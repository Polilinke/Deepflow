# DeepFlow future integration plan

## JARVIS assistant

The browser app must not contain a Gemini API key, JARVIS secret, or private endpoint credential. When JARVIS is ready, add a server-side Netlify Function (or a separately hosted authenticated API) as the only browser-facing assistant endpoint. The function should authenticate the user, validate and limit requests, call the JARVIS service from the server, and return only the response needed by the UI. Keep the JARVIS service URL and credentials in Netlify environment variables. Do not expose a Windows `localhost` URL: a public website cannot securely or reliably reach a user's local JARVIS process.

Suggested future interface boundary: `AssistantProvider.sendMessage({ message, context })`. The UI should depend on this interface, not directly on Gemini or a specific JARVIS implementation. The provider is intentionally not enabled in this build.

## Listening rooms

Real shared listening rooms require a realtime service and a server-side room authority. A suitable future design is a small authenticated Netlify Functions API plus a realtime provider (for example Supabase Realtime) to broadcast room ID, queue, current video ID, playback state and server timestamp. Do not rely on one visitor's localStorage as a shared room database. The current Rooms view is an honest placeholder, not a working multiplayer feature.

## Audio processing

The YouTube IFrame player is cross-origin and does not expose its decoded audio to the app. A real equalizer and waveform/frequency visualizer require an audio source the app is permitted to process (for example user-selected local audio or a properly licensed direct stream). The current YouTube playback visualizer remains decorative and should not be described as audio-reactive.
