# DeepFlow: project state

Project folder: C:\Users\kakke\MusicApp
Stack: Electron 33, plain HTML/CSS/JavaScript, YouTube Data API v3 (search and popular chart), YouTube IFrame Player API (playback), localStorage for persistence.

## Completed
- Electron shell with preload bridge (main.js, preload.js)
- Dark and light themes, five accent colours
- Search on Enter only, with 3-character minimum, cache (24 h), and quota tracking with warning and pause
- Home view: popular music in India (1 quota unit, cached 24 h)
- Embedded playback, queue (add, remove, reorder, play), auto-advance
- Saved library, playlists (create, rename, delete, add and remove), history
- Backup export and import (JSON)
- Album artwork background (toggle in Settings)
- Optional liquid-glass panels (toggle in Settings; uses more GPU)
- Window size presets and fullscreen (button or F11)
- Background video, your own .mp4 only (toggle in Settings)

## Not built yet
- Synchronized lyrics (lyrics provider not yet chosen)
- Supabase accounts, public and private playlists, likes, copying, discovery page
- Windows installer and packaging
- Full testing pass on a real Windows run

## Decisions
- Quota is estimated locally; Google's count is authoritative.
- Visualizer is decorative and does not reflect real audio.
- No audio extraction or download from YouTube.
- API key is entered in-app and stored only on this computer.
- Free services only; no paid subscriptions without approval.

## Next steps
1. Confirm the app launches and search, playback, queue, history and new settings all work.
2. Choose a lyrics source.
3. Set up Supabase (free tier) and build online features.
4. Package installer.
