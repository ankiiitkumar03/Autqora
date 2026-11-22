# AUTQORA YouTube video to shorts worker

This local service downloads an archived, public YouTube video that you own or are authorized to process, then uses FFmpeg to create up to ten evenly spaced, 9:16 MP4 clips. Each clip can be 15–20 seconds. Live-stream capture, subtitles, and scene detection are not included. The n8n workflow has separate YouTube and Instagram upload branches; both are opt-in, require provider credentials, and can create real posts when enabled.

## Start it on Windows with Docker Desktop

1. If `.env` does not exist, copy `.env.example` to `.env` and replace the sample with a random key of at least 32 characters. Keep an existing `.env` key; do not overwrite it.
2. In PowerShell, from this folder, run `docker compose up -d --build`.
3. Confirm the worker responds at `http://localhost:8090/health`.
4. In n8n, create a **Header Auth** credential named `AUTQORA Clip Worker`, with header name `Authorization` and value `Bearer <the key from .env>`. On Windows, read the local value in PowerShell with `Get-Content .env`; keep it private and do not put it in AUTQORA project fields.
5. Import the AUTQORA workflow and select that credential on **Create vertical clips with FFmpeg**.
6. In **Set clip options**, set a YouTube video URL, clip count (1–10), and duration (15–20 seconds). Run manually; the final node returns local download links.

The n8n container reaches this Windows host through `host.docker.internal`. If that address is unavailable in your n8n container, it must be attached to a Docker network that can reach the host service. Keep the worker port local and never expose it to the public internet.

The source video must be public and available to yt-dlp without sign-in. The service refuses playlists and non-YouTube hosts, limits source duration to four hours, and requires the API key. Do not use it to bypass access controls or process content without permission. Generated clips remain in the Docker volume `autqora_clips` until you remove them.

## Stop and remove generated clips

Run `docker compose down` to stop the service. To permanently remove generated clips, use `docker compose down -v`; this deletes the named clip volume.
