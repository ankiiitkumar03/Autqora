# AUTQORA YouTube video to shorts worker

This local service downloads a completed, archived, public YouTube video that you own or are authorized to process, then uses FFmpeg to create up to ten non-overlapping, 9:16 MP4 clips. Each clip can be 15–20 seconds. Choose `evenly_spaced` or `scene_change` in the n8n **Set clip options** node. Scene-change mode samples at one frame per second and centers clips on strong visual cuts; this is a lightweight visual signal, not semantic highlight, speech, or event detection. If too few cuts are found, remaining clips use evenly spaced fallback positions. Upcoming and active live stream URLs are rejected before download; use the completed replay after it becomes available. Live-stream capture and subtitles are not included. The n8n workflow has separate YouTube and Instagram upload branches; both are opt-in, require provider credentials, and can create real posts when enabled.

## Start it on Windows with Docker Desktop

1. If `.env` does not exist, copy `.env.example` to `.env` and replace the sample with a random key of at least 32 characters. Keep an existing `.env` key; do not overwrite it.
2. In PowerShell, from this folder, run `docker compose up -d --build`.
3. Confirm the worker responds at `http://localhost:8090/health` and check `docker compose ps` for a `healthy` state. The endpoint and Compose healthcheck verify that FFmpeg runs and the worker API key is configured; neither check contacts YouTube or tests a clip job.
4. In n8n, create a **Header Auth** credential named `AUTQORA Clip Worker`, with header name `Authorization` and value `Bearer <the key from .env>`. On Windows, read the local value in PowerShell with `Get-Content .env`; keep it private and do not put it in AUTQORA project fields.
5. Import the AUTQORA workflow and select that credential on **Create vertical clips with FFmpeg**.
6. In **Set clip options**, set a YouTube video URL, clip count (1–10), duration (15–20 seconds), and selection mode (`evenly_spaced` or `scene_change`). The requested clips must fit without overlapping in the source duration. Run manually; the final node returns local download links and the selection basis for each clip.

The n8n container reaches this Windows host through `host.docker.internal`. If that address is unavailable in your n8n container, it must be attached to a Docker network that can reach the host service. Keep the worker port local and never expose it to the public internet.

The source video must be public and available to yt-dlp without sign-in. The service refuses playlists and non-YouTube hosts, limits source duration to four hours, and requires the API key. Do not use it to bypass access controls or process content without permission. Only one video job runs at a time to avoid competing downloads and FFmpeg processes on a local machine. Older clip folders are removed before the next authenticated job starts. The default retention is seven days; set `CLIP_RETENTION_SECONDS` in `.env` to a value from 3600 (one hour) through 2592000 (30 days). Expired folders are cleaned when the next job starts, so an idle worker may keep expired files until then. `docker compose down -v` removes the entire clip volume.

## Stop and remove generated clips

Run `docker compose down` to stop the service. To permanently remove generated clips, use `docker compose down -v`; this deletes the named clip volume.
