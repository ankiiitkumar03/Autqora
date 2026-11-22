# AUTQORA YouTube video to shorts worker

This local service processes an archived, public YouTube video that you own or are authorized to process. It creates up to ten evenly spaced vertical MP4 clips, each 15–20 seconds. It does not capture live streams. The n8n workflow has separate YouTube and Instagram upload branches; both are opt-in, require provider credentials, and can create real posts when enabled.

## Start with Docker Desktop

1. Open `tools/video-clip-worker` in PowerShell.
2. If `.env` does not exist, copy `.env.example` to `.env` and replace its sample with a random key of at least 32 characters. Keep an existing key; do not overwrite it.
3. Run `docker compose up -d --build`.
4. Confirm `http://localhost:8090/health` returns `ok: true`.
5. In n8n, create a **Header Auth** credential named `AUTQORA Clip Worker`. Set the header name to `Authorization` and value to `Bearer <the key from .env>`. Run `Get-Content .env` in this folder to read the local value; keep it private and do not paste it into AUTQORA.
6. Import the workflow and select that credential on **Create vertical clips with FFmpeg**.
7. In **Set clip options**, set a YouTube video URL, clip count (1–10), and duration (15–20 seconds). Run manually and review the returned links.

The n8n Docker container reaches the host through `host.docker.internal`. If this address is unavailable in your n8n container, connect its Docker network to the host service. Keep port 8090 local and do not expose it to the public internet.

The source must be public and available without sign-in. The worker refuses playlists and non-YouTube hosts, limits source duration to four hours, and requires the API key. Do not bypass access controls or process content without permission. The worker processes one video job at a time. By default, it removes clip folders older than seven days when the next authenticated job starts. You can set `CLIP_RETENTION_SECONDS` in `.env` from 3600 (one hour) through 2592000 (30 days); expired files may remain while the worker is idle. `docker compose down -v` removes the entire `autqora_clips` volume.
