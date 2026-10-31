# DeepFlow Player (Windows)

## Setup (once)

1. Replace the files in `C:\Users\kakke\MusicApp` with the files in this package. Keep the folder structure: `js\` and `css\` subfolders.
2. Open **Command Prompt** in that folder and run:

   ```
   cd C:\Users\kakke\MusicApp
   npm install
   ```

## Run

```
npm start
```

## Get a YouTube API key (free)

1. Go to https://console.cloud.google.com and create a project.
2. Enable **YouTube Data API v3** for it (APIs & Services > Library).
3. Go to APIs & Services > Credentials > Create credentials > API key.
4. In the app, click ⚙ and paste the key, then **Save & close**.

Limits: the free quota is 10,000 units per day. Each search costs 100 units, so you get about 100 fresh searches per day. Playback uses no quota. Cached searches are free and last 24 hours. Keys created in the same Google Cloud project share one quota pool. To get more quota, request an increase through Google's official quota extension form.

## Notes

- Installer: `npm run dist:win`. The output is in `dist\`.

- Playback uses YouTube's official embedded player. The app does not download or extract audio.
- Some videos disallow embedding. The app skips them and shows a message.
- The visualizer bars are decorative animation. They do not react to the real audio.
- Your library, playlists, queue, and API key are stored on this computer only. Use **Export backup** to save a copy.
- Quota tracking is an estimate kept on this computer. Google's own count is authoritative.

## Files

- `main.js`: Electron window setup
- `index.html`: interface layout
- `css/styles.css`: themes, accent colours, animations
- `js/store.js`: saved data, playlists, queue, quota, cache
- `js/youtube.js`: YouTube search
- `js/app.js`: UI, search, playback, queue, settings

## Browser edition and Netlify

This folder can be deployed as a static browser app: create a Netlify site and publish the `MusicApp` folder (the folder containing `index.html`). The browser edition keeps library, playlists, history, queue, settings and the selected MP4 background in that browser's local storage / IndexedDB. These are not synced between devices.

### Browser features in this build

- Insights and a local DeepFlow Wrapped summary based on recorded play starts.
- Smart queue suggestions based on saved tracks and listening history; these do not call YouTube Search and do not use YouTube Data API quota.
- Per-track synced-lyrics timing adjustment, saved separately for each track.
- Theme studio controls for custom accent colour and glass blur intensity.
- Sleep timer that pauses the YouTube player.
- MP4 background persistence using IndexedDB in the browser.
- Listening Rooms screen is a placeholder pending a realtime backend.

### Current technical limitations

The YouTube embedded player does not expose its audio stream to this page, so the existing animated visualizer is not a true audio analyser and a real equalizer cannot process YouTube playback. A supported direct audio source is needed for those features. Listening Rooms require a realtime backend and authentication. See `docs/FUTURE-INTEGRATIONS.md` for the planned secure architecture for Rooms and a future JARVIS connection.

The YouTube API key is still entered by each visitor in Settings. Browser-side keys are visible to site visitors; restrict each key to YouTube Data API v3 and configure appropriate website restrictions where possible. A future server-side search proxy is recommended for a public production launch.


## Shared YouTube search API (Netlify)

Set `YOUTUBE_API_KEY` in Netlify Site configuration → Environment variables and mark it as a secret.
The browser app calls the `netlify/functions/youtube.mjs` serverless function; it never receives the key.
For local Netlify Dev, copy `.env.example` to `.env` and add your private key. Never distribute `.env`.

**Important rate-limit note:** this starter includes a per-server-instance 5-second cooldown and a 30-search daily cap per IP. Serverless instances can restart or scale independently, so these are basic guardrails, not a hard global quota. Before a broad public launch, add persistent shared rate-limit storage and configure Google Cloud API restrictions / quota alerts. The API key is hidden from website visitors but server-side keys are not magically impossible to abuse if the endpoint is public.

For the Electron `file://` build, the API endpoint must be configured to your deployed Netlify site's `/.netlify/functions/youtube` URL before distributing the installer. The browser deployment uses same-origin automatically. Do not ship an API key in the Electron package.
