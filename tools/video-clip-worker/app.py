import hmac
import hashlib
import os
import re
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import time
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse
from uuid import uuid4
from datetime import datetime, timezone

import yt_dlp
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator


APP_DIR = Path(__file__).resolve().parent
CLIPS_DIR = Path(os.environ.get("CLIPS_DIR", APP_DIR / "clips")).resolve()
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
PUBLISH_LEDGER_PATH = Path(os.environ.get("PUBLISH_LEDGER_PATH", CLIPS_DIR / "publishing-ledger.sqlite3")).resolve()
PUBLISH_LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("CLIP_WORKER_API_KEY", "")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8090").rstrip("/")
MAX_SOURCE_SECONDS = 4 * 60 * 60
ACTIVE_LIVE_STATUSES = {"is_live", "is_upcoming", "post_live"}
CLIP_RETENTION_SECONDS = int(os.environ.get("CLIP_RETENTION_SECONDS", str(7 * 24 * 60 * 60)))
if not 60 * 60 <= CLIP_RETENTION_SECONDS <= 30 * 24 * 60 * 60:
    raise RuntimeError("CLIP_RETENTION_SECONDS must be between 3600 (1 hour) and 2592000 (30 days).")
CLIP_JOB_LOCK = threading.Lock()

app = FastAPI(title="AUTQORA YouTube clip worker", version="0.1.0")


class ClipRequest(BaseModel):
    sourceUrl: str = Field(min_length=12, max_length=2048)
    clipCount: int = Field(default=5, ge=1, le=10)
    clipDurationSeconds: int = Field(default=18, ge=15, le=20)
    selectionMode: Literal["evenly_spaced", "scene_change", "manual_timestamps"] = "evenly_spaced"
    clipStartsSeconds: list[int] | None = Field(default=None, max_length=10)

    @model_validator(mode="after")
    def validate_manual_timestamps(self):
        starts = self.clipStartsSeconds
        if self.selectionMode != "manual_timestamps":
            if starts is not None:
                raise ValueError("clipStartsSeconds is only allowed with manual_timestamps selection mode.")
            return self
        if starts is None or len(starts) != self.clipCount:
            raise ValueError("Provide one clip start timestamp for each requested clip.")
        if any(start < 0 for start in starts):
            raise ValueError("Clip start timestamps must be zero or greater.")
        if starts != sorted(starts):
            raise ValueError("Clip start timestamps must be in ascending order.")
        if any(later - earlier < self.clipDurationSeconds for earlier, later in zip(starts, starts[1:])):
            raise ValueError("Manual clip timestamps must not overlap; leave at least the clip duration between starts.")
        return self


class PublishClaimRequest(BaseModel):
    clipId: str = Field(pattern=r"^[a-f0-9]{64}$")
    platform: Literal["youtube", "instagram"]


class PublishCompleteRequest(PublishClaimRequest):
    platformItemId: str = Field(min_length=1, max_length=512)


class PublishResetRequest(PublishClaimRequest):
    confirmedNotPublished: Literal[True]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def open_publish_ledger() -> sqlite3.Connection:
    connection = sqlite3.connect(PUBLISH_LEDGER_PATH, timeout=10, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout = 10000")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS clip_publications (
            clip_id TEXT NOT NULL CHECK(length(clip_id) = 64),
            platform TEXT NOT NULL CHECK(platform IN ('youtube', 'instagram')),
            status TEXT NOT NULL CHECK(status IN ('publishing', 'published')),
            platform_item_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (clip_id, platform),
            CHECK ((status = 'publishing' AND platform_item_id IS NULL)
                OR (status = 'published' AND platform_item_id IS NOT NULL))
        )
        """
    )
    return connection


def sha256_file(path: Path) -> str:
    with path.open("rb") as media_file:
        return hashlib.file_digest(media_file, "sha256").hexdigest()


def require_api_key(authorization: str | None) -> None:
    if len(API_KEY) < 32:
        raise HTTPException(status_code=503, detail="Set CLIP_WORKER_API_KEY to a random value of at least 32 characters.")
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not hmac.compare_digest(supplied, API_KEY):
        raise HTTPException(status_code=401, detail="Valid worker authorization is required.")


def validate_youtube_url(value: str) -> str:
    parsed = urlparse(value.strip())
    host = (parsed.hostname or "").lower().removeprefix("www.")
    if parsed.scheme != "https" or host not in {"youtube.com", "m.youtube.com", "youtu.be"}:
        raise HTTPException(status_code=400, detail="Use an https://youtube.com or https://youtu.be video URL.")
    if host in {"youtube.com", "m.youtube.com"} and parsed.path not in {"/watch", "/live", "/shorts"} and not parsed.path.startswith(("/embed/", "/live/")):
        raise HTTPException(status_code=400, detail="Provide one video URL, not a playlist or channel URL.")
    if parsed.path == "/watch" and not parsed.query:
        raise HTTPException(status_code=400, detail="The YouTube video URL is missing its video ID.")
    return value.strip()


def run_command(arguments: list[str]) -> str:
    try:
        result = subprocess.run(arguments, check=True, capture_output=True, text=True, timeout=180)
        return result.stdout.strip()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="FFmpeg is missing in the clip worker image.") from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Video inspection timed out.") from exc
    except subprocess.CalledProcessError as exc:
        raise HTTPException(status_code=422, detail="Could not inspect the downloaded video.") from exc


def evenly_spaced_clip_starts(duration: int, clip_duration: int, clip_count: int) -> list[float]:
    latest_start = max(0, duration - clip_duration)
    if clip_count == 1:
        return [round(latest_start / 2, 3)]
    return [round(latest_start * index / (clip_count - 1), 3) for index in range(clip_count)]


def detect_scene_change_scores(video_path: Path) -> list[tuple[float, float]]:
    """Return sampled FFmpeg scene-change timestamps and scores for reviewable clip candidates."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(video_path),
                "-vf", "scale=160:-2,fps=1,select='gt(scene,0.30)',metadata=print:key=lavfi.scene_score:file=-",
                "-an", "-f", "null", "-",
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=600,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="FFmpeg is missing in the clip worker image.") from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Scene-change analysis exceeded its ten-minute limit. Retry with evenly spaced clips or a shorter source video.") from exc
    except subprocess.CalledProcessError as exc:
        raise HTTPException(status_code=422, detail="Could not analyze visual scene changes in this video.") from exc

    candidates: list[tuple[float, float]] = []
    for block in result.stdout.split("frame:")[1:]:
        timestamp_match = re.search(r"pts_time:([-+]?(?:\d+(?:\.\d*)?|\.\d+))", block)
        score_match = re.search(r"lavfi\.scene_score=([-+]?(?:\d+(?:\.\d*)?|\.\d+))", block)
        if not timestamp_match or not score_match:
            continue
        timestamp = float(timestamp_match.group(1))
        score = float(score_match.group(1))
        if timestamp >= 0 and 0.30 <= score <= 1:
            candidates.append((timestamp, score))
    return candidates


def choose_scene_change_clip_starts(
    duration: int,
    clip_duration: int,
    clip_count: int,
    scene_changes: list[tuple[float, float]],
) -> list[tuple[float, str]]:
    """Center clips on strong visual cuts while keeping a full, non-overlapping fallback set."""
    latest_start = max(0, duration - clip_duration)
    selected = [
        {"start": start, "basis": "evenly_spaced_fallback"}
        for start in evenly_spaced_clip_starts(duration, clip_duration, clip_count)
    ]
    ranked_changes = sorted(scene_changes, key=lambda candidate: candidate[1], reverse=True)
    for timestamp, _score in ranked_changes:
        candidate = round(min(latest_start, max(0.0, timestamp - clip_duration / 2)), 3)
        eligible_slots = []
        for slot_index, slot in enumerate(selected):
            other_starts = [other["start"] for index, other in enumerate(selected) if index != slot_index]
            if all(abs(candidate - other_start) >= clip_duration for other_start in other_starts):
                eligible_slots.append((abs(candidate - slot["start"]), slot_index))
        if eligible_slots:
            _distance, slot_index = min(eligible_slots)
            selected[slot_index] = {"start": candidate, "basis": "visual_scene_change"}
        if all(slot["basis"] == "visual_scene_change" for slot in selected):
            break
    return sorted(
        [(round(slot["start"], 3), slot["basis"]) for slot in selected],
        key=lambda clip: clip[0],
    )


def remove_expired_clip_jobs(now: float | None = None) -> None:
    cutoff = (time.time() if now is None else now) - CLIP_RETENTION_SECONDS
    for job_dir in CLIPS_DIR.iterdir():
        if job_dir.is_symlink() or not job_dir.is_dir() or not re.fullmatch(r"[a-f0-9]{32}", job_dir.name):
            continue
        try:
            if job_dir.stat().st_mtime < cutoff:
                shutil.rmtree(job_dir, ignore_errors=True)
        except OSError:
            continue


@app.get("/health")
def health():
    try:
        ffmpeg_available = subprocess.run(
            ["ffmpeg", "-version"], capture_output=True, timeout=3, check=False,
        ).returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        ffmpeg_available = False
    api_key_configured = len(API_KEY) >= 32
    if not ffmpeg_available or not api_key_configured:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Clip worker is not ready.",
                "ffmpegAvailable": ffmpeg_available,
                "apiKeyConfigured": api_key_configured,
            },
        )
    ledger_connection = None
    try:
        ledger_connection = open_publish_ledger()
        ledger_connection.execute("SELECT 1").fetchone()
    except sqlite3.Error as exc:
        raise HTTPException(status_code=503, detail="Publishing ledger is unavailable.") from exc
    finally:
        if ledger_connection is not None:
            ledger_connection.close()
    return {"ok": True, "ffmpegAvailable": True, "apiKeyConfigured": True, "publishLedgerReady": True}


@app.post("/publishing/claim")
def claim_publication(payload: PublishClaimRequest, authorization: str | None = Header(default=None)):
    require_api_key(authorization)
    connection = open_publish_ledger()
    try:
        connection.execute("BEGIN IMMEDIATE")
        now = utc_now()
        inserted = connection.execute(
            "INSERT OR IGNORE INTO clip_publications (clip_id, platform, status, platform_item_id, created_at, updated_at) VALUES (?, ?, 'publishing', NULL, ?, ?)",
            (payload.clipId, payload.platform, now, now),
        ).rowcount == 1
        row = connection.execute(
            "SELECT status, platform_item_id FROM clip_publications WHERE clip_id = ? AND platform = ?",
            (payload.clipId, payload.platform),
        ).fetchone()
        connection.execute("COMMIT")
        if row is None:
            raise HTTPException(status_code=503, detail="Could not read the publication ledger entry.")
        return {
            "clipId": payload.clipId,
            "platform": payload.platform,
            "claimed": inserted,
            "status": "claimed" if inserted else row["status"],
            "platformItemId": row["platform_item_id"],
        }
    except sqlite3.Error as exc:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise HTTPException(status_code=503, detail="Publishing ledger is unavailable.") from exc
    finally:
        connection.close()


@app.post("/publishing/complete")
def complete_publication(payload: PublishCompleteRequest, authorization: str | None = Header(default=None)):
    require_api_key(authorization)
    platform_item_id = payload.platformItemId.strip()
    if not platform_item_id:
        raise HTTPException(status_code=422, detail="A non-empty platform item ID is required.")
    connection = open_publish_ledger()
    try:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT status, platform_item_id FROM clip_publications WHERE clip_id = ? AND platform = ?",
            (payload.clipId, payload.platform),
        ).fetchone()
        if row is None:
            connection.execute("ROLLBACK")
            raise HTTPException(status_code=409, detail="Claim this clip and platform before recording a publishing result.")
        if row["status"] == "published":
            if row["platform_item_id"] != platform_item_id:
                connection.execute("ROLLBACK")
                raise HTTPException(status_code=409, detail="A different platform item ID is already recorded for this clip.")
            connection.execute("COMMIT")
            return {"clipId": payload.clipId, "platform": payload.platform, "status": "published", "platformItemId": platform_item_id, "alreadyRecorded": True}
        connection.execute(
            "UPDATE clip_publications SET status = 'published', platform_item_id = ?, updated_at = ? WHERE clip_id = ? AND platform = ? AND status = 'publishing'",
            (platform_item_id, utc_now(), payload.clipId, payload.platform),
        )
        connection.execute("COMMIT")
        return {"clipId": payload.clipId, "platform": payload.platform, "status": "published", "platformItemId": platform_item_id, "alreadyRecorded": False}
    except sqlite3.Error as exc:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise HTTPException(status_code=503, detail="Publishing ledger is unavailable.") from exc
    finally:
        connection.close()


@app.get("/publishing/status/{clip_id}")
def publication_status(clip_id: str, authorization: str | None = Header(default=None)):
    require_api_key(authorization)
    if not re.fullmatch(r"[a-f0-9]{64}", clip_id):
        raise HTTPException(status_code=404, detail="Clip publication record not found.")
    connection = open_publish_ledger()
    try:
        rows = connection.execute(
            "SELECT platform, status, platform_item_id, created_at, updated_at FROM clip_publications WHERE clip_id = ? ORDER BY platform",
            (clip_id,),
        ).fetchall()
        return {"clipId": clip_id, "publications": [
            {"platform": row["platform"], "status": row["status"], "platformItemId": row["platform_item_id"], "createdAt": row["created_at"], "updatedAt": row["updated_at"]}
            for row in rows
        ]}
    except sqlite3.Error as exc:
        raise HTTPException(status_code=503, detail="Publishing ledger is unavailable.") from exc
    finally:
        connection.close()


@app.post("/publishing/reset")
def reset_unpublished_claim(payload: PublishResetRequest, authorization: str | None = Header(default=None)):
    require_api_key(authorization)
    connection = open_publish_ledger()
    try:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT status FROM clip_publications WHERE clip_id = ? AND platform = ?",
            (payload.clipId, payload.platform),
        ).fetchone()
        if row is None:
            connection.execute("ROLLBACK")
            raise HTTPException(status_code=404, detail="Publication claim not found.")
        if row["status"] != "publishing":
            connection.execute("ROLLBACK")
            raise HTTPException(status_code=409, detail="Published records cannot be reset.")
        connection.execute(
            "DELETE FROM clip_publications WHERE clip_id = ? AND platform = ? AND status = 'publishing'",
            (payload.clipId, payload.platform),
        )
        connection.execute("COMMIT")
        return {"clipId": payload.clipId, "platform": payload.platform, "status": "claim_reset"}
    except sqlite3.Error as exc:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise HTTPException(status_code=503, detail="Publishing ledger is unavailable.") from exc
    finally:
        connection.close()


@app.post("/clips")
def create_clips(payload: ClipRequest, authorization: str | None = Header(default=None)):
    require_api_key(authorization)
    if not CLIP_JOB_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="A clip job is already running. Wait for it to finish before starting another.", headers={"Retry-After": "60"})
    try:
        remove_expired_clip_jobs()
        return create_clip_job(payload)
    finally:
        CLIP_JOB_LOCK.release()


def create_clip_job(payload: ClipRequest):
    source_url = validate_youtube_url(payload.sourceUrl)
    job_dir = CLIPS_DIR / uuid4().hex
    job_dir.mkdir(parents=True, exist_ok=False)
    output: list[dict[str, object]] = []

    try:
        with tempfile.TemporaryDirectory(prefix="autqora-video-") as temporary:
            template = str(Path(temporary) / "source.%(ext)s")
            options = {
                "format": "bv*[height<=1080]+ba/b[height<=1080]",
                "merge_output_format": "mp4",
                "outtmpl": template,
                "noplaylist": True,
                "max_filesize": 1_000_000_000,
                "socket_timeout": 30,
                "retries": 2,
                "quiet": True,
                "no_warnings": True,
            }
            try:
                with yt_dlp.YoutubeDL(options) as downloader:
                    metadata = downloader.extract_info(source_url, download=False)
                    if not isinstance(metadata, dict):
                        raise HTTPException(status_code=422, detail="The source URL did not resolve to one archived video.")
                    live_status = metadata.get("live_status")
                    if metadata.get("is_live") is True or live_status in ACTIVE_LIVE_STATUSES:
                        raise HTTPException(
                            status_code=409,
                            detail="This URL is an upcoming or active live stream. The local worker only processes completed, archived videos; try the replay after it is available.",
                        )
                    duration = int(metadata.get("duration") or 0)
                    if duration <= 0:
                        raise HTTPException(status_code=422, detail="This archived video has no available duration metadata; live or unbounded sources are not supported.")
                    if duration > MAX_SOURCE_SECONDS:
                        raise HTTPException(status_code=413, detail="Source videos are limited to four hours.")
                    if duration < payload.clipDurationSeconds:
                        raise HTTPException(status_code=422, detail="The source video is shorter than the requested clip duration.")
                    if duration < payload.clipDurationSeconds * payload.clipCount:
                        raise HTTPException(status_code=422, detail="This source is too short for the requested number of non-overlapping clips. Reduce clipCount or clipDurationSeconds.")
                    if payload.selectionMode == "manual_timestamps" and any(start + payload.clipDurationSeconds > duration for start in payload.clipStartsSeconds or []):
                        raise HTTPException(status_code=422, detail="A manual clip timestamp extends beyond the end of the source video.")
                    info = downloader.extract_info(source_url, download=True)
                    downloaded = Path(downloader.prepare_filename(info))
                    if not downloaded.exists():
                        downloaded = downloaded.with_suffix(".mp4")
            except Exception as exc:
                if isinstance(exc, HTTPException):
                    raise
                raise HTTPException(status_code=422, detail="Could not fetch this archived video. Confirm it is public, available, and yours or authorized for processing.") from exc

            if not downloaded.is_file():
                candidates = list(Path(temporary).glob("source.*"))
                if not candidates:
                    raise HTTPException(status_code=422, detail="The video downloader did not produce a media file.")
                downloaded = candidates[0]
            if payload.selectionMode == "manual_timestamps":
                clip_starts = [(start, "user_selected_timestamp") for start in payload.clipStartsSeconds or []]
            elif payload.selectionMode == "scene_change":
                scene_changes = detect_scene_change_scores(downloaded)
                clip_starts = choose_scene_change_clip_starts(
                    duration, payload.clipDurationSeconds, payload.clipCount, scene_changes,
                )
            else:
                clip_starts = [
                    (start, "evenly_spaced")
                    for start in evenly_spaced_clip_starts(duration, payload.clipDurationSeconds, payload.clipCount)
                ]
            for index, (start, selection_basis) in enumerate(clip_starts, start=1):
                filename = f"clip-{index:02d}.mp4"
                target = job_dir / filename
                run_command([
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(start), "-i", str(downloaded),
                    "-t", str(payload.clipDurationSeconds), "-vf",
                    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "128k",
                    "-movflags", "+faststart", "-y", str(target),
                ])
                output.append({
                    "fileName": filename,
                    "clipId": sha256_file(target),
                    "startSeconds": start,
                    "durationSeconds": payload.clipDurationSeconds,
                    "selectionMode": payload.selectionMode,
                    "selectionBasis": selection_basis,
                    "downloadUrl": f"{PUBLIC_BASE_URL}/clips/{job_dir.name}/{filename}",
                })
        return {"clips": output}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Clip generation failed. Check the worker logs for details.") from exc


@app.get("/clips/{job_id}/{filename}")
def download_clip(job_id: str, filename: str):
    if not re.fullmatch(r"[a-f0-9]{32}", job_id) or not re.fullmatch(r"clip-[0-9]{2}\.mp4", filename):
        raise HTTPException(status_code=404, detail="Clip not found.")
    path = (CLIPS_DIR / job_id / filename).resolve()
    if not path.is_relative_to(CLIPS_DIR) or not path.is_file():
        raise HTTPException(status_code=404, detail="Clip not found.")
    return FileResponse(path, media_type="video/mp4", filename=filename)
