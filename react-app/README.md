# Pollinations Chat UI (React)

Modern React + Vite client for Pollinations APIs.

## API alignment source of truth

This app is aligned to:
- `pollinations/pollinations` → `APIDOCS.md`
- Base URL: `https://gen.pollinations.ai`

Implemented API surfaces in `src/utils/api.js`:
- Chat completions (`/v1/chat/completions`) with streaming SSE
- Image generation (`/image/{prompt}`)
- Image edits (`/v1/images/edits`)
- Video generation (`/video/{prompt}`)
- Audio generation (`/audio/{text}`)
- Audio transcription (`/v1/audio/transcriptions`)
- Embeddings (`/v1/embeddings`)
- Realtime WebSocket URL builder (`/v1/realtime`)
- Model catalogs (`/v1/models`, `/image/models`, `/audio/models`, `/embeddings/models`)
- Account and key endpoints (`/account/profile`, `/account/balance`, `/account/usage`, `/account/usage/daily`, `/account/earnings`, `/account/keys`, `/account/key`, `/account/key/usage`)

## Auth keys

- `pk_...` (publishable) is recommended for browser clients.
- `sk_...` (secret) must stay server-side.

You can set a default key via env:

```bash
VITE_POLLINATIONS_API_KEY=pk_or_sk_key
```

Or set it in-app from **Settings → Pollinations API**.

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```
