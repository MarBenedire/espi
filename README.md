# ESPI: Zero-Config Meeting Transcription App

A modern, zero-config React + Python app for free, multilingual meeting transcription with speaker identification, English translation, and summary—deployable in one click on Vercel with no setup or keys required.

## Features
- Upload or record audio (any language)
- Transcribes with open-source Whisper (no API key)
- Speaker diarization (labels speakers)
- Detects original language and translates to English (LibreTranslate, no key)
- Summarizes transcript into concise meeting minutes (T5-small)
- Download transcript and summary (.txt or .docx)
- No authentication or sign up
- Modern, responsive UI (React + TailwindCSS)

## Deployment
**No API keys, no .env, no manual setup.**

### One-click Vercel deploy:

```
git clone https://github.com/MarBenedire/espi.git
vercel --prod
```

App is ready—no further setup required.

---

- Frontend: React + TailwindCSS (`/frontend`)
- Backend: Python FastAPI (`/api`)
- All dependencies are free, open-source, and run without API keys or paid plans. 