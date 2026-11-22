# AUTQORA YouTube video to shorts worker

This local service processes a completed, archived, public YouTube video that you own or are authorized to process. It creates up to ten non-overlapping vertical MP4 clips, each 15–20 seconds. Choose `evenly_spaced` or `scene_change`; scene-change mode uses visual cuts only and does not identify semantic highlights or speech. Upcoming and active live stream URLs are rejected before download; use the completed replay after it becomes available. It does not capture live streams. The n8n workflow has separate YouTube and Instagram upload branches; both are opt-in, require provider credentials, and can create real posts when enabled.

## Start with Docker Desktop

1. Open `tools/video-clip-worker` in PowerShell.
2. If `.env` does not exist, copy `.env.example` to `.env` and replace its sample with a random key of at least 32 characters. Keep an existing key; do not overwrite it.
3. Run `docker compose up -d --build`.
4. Confirm `http://localhost:8090/health` returns `ok: true`.
5. In n8n, create a **Header Auth** credential named `AUTQORA Clip Worker`. Set the header name to `Authorization` and value to `Bearer <the key from .env>`. Run `Get-Content .env` in this folder to read the local value; keep it private and do not paste it into AUTQORA.
6. Import the workflow and select that credential on **Create vertical clips with FFmpeg**.
7. In **Set clip options**, set a YouTube video URL, clip count (1–10), duration (15–20 seconds), and selection mode (`evenly_spaced` or `scene_change`). The selected clips must fit within the source duration without overlapping. Run manually and review the returned links and each clip's selection basis.

The n8n Docker container reaches the host through `host.docker.internal`. If this address is unavailable in your n8n container, connect its Docker network to the host service. Keep port 8090 local and do not expose it to the public internet.

The generated publishing branches reserve a clip hash and platform in the worker's persistent SQLite ledger before upload, then record the platform item ID after success. Existing reservations block duplicate uploads on a later run. If n8n stops during an upload, check the platform account before recovery; only reset a reservation after confirming the post was not created. The ledger and generated clips remain in the named Docker volume until `docker compose down -v` removes it. Regenerate saved workflows to receive these nodes; AUTQORA's structural verification does not confirm live n8n or provider execution.

The source must be public and available without sign-in. The worker refuses playlists and non-YouTube hosts, limits source duration to four hours, and requires the API key. Do not bypass access controls or process content without permission. The worker processes one video job at a time. By default, it removes clip folders older than seven days when the next authenticated job starts. You can set `CLIP_RETENTION_SECONDS` in `.env` from 3600 (one hour) through 2592000 (30 days); expired files may remain while the worker is idle. `docker compose down -v` removes the entire `autqora_clips` volume.
