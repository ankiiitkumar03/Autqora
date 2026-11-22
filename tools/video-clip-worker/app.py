import hmac
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

import yt_dlp
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field


APP_DIR = Path(__file__).resolve().parent
CLIPS_DIR = Path(os.environ.get("CLIPS_DIR", APP_DIR / "clips")).resolve()
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
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
    return {"ok": True, "ffmpeg": bool(subprocess.run(["ffmpeg", "-version"], capture_output=True).returncode == 0)}


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
            latest_start = duration - payload.clipDurationSeconds
            starts = [round(latest_start * index / max(payload.clipCount - 1, 1)) for index in range(payload.clipCount)]
            for index, start in enumerate(starts, start=1):
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
                    "durationSeconds": payload.clipDurationSeconds,
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
