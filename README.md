# Recapsule

A podcast generator that's a time capsule to the past. Give it a topic and it researches, writes a script in your chosen tone, and produces a full audio episode with AI voices, complete with timestamped citations.

## Inspiration

We are big fans of documentary-style storytelling, think channels like **Fern** that make history, culture, and science deeply engaging. We initially wanted to build a tool to democratize this kind of high-quality video production. However, we quickly realized that video generation is computationally heavy and complex. We pivoted to the next best medium: **Audio.** We set out to build an intelligent "Research Agent" and "Podcast Host" in one, capable of turning a simple topic into a fully produced, conversational deep-dive.


## Features

- **AI Research & Scripting** — Gemini researches any topic and writes a two-host dialogue in your chosen tone
- **Tone Selection** — 6 styles: Conversational, Professional, Humorous, Dramatic, Educational, or Casual
- **Timestamped Citations** — Sources are resolved via Open Library with cover art and links
- **Auto-Categorization** — Episodes are classified into categories for browsing and filtering
- **Audio Player** — Built-in player with progress bar, citation markers, and a slide-up sources panel
- **Real-time Progress** — Watch episodes move through each generation stage live

## Project Structure

```
Recapsule/
├── backend/                    # FastAPI server + pipeline
│   ├── app/
│   │   ├── main.py             # FastAPI app, routes, CORS
│   │   ├── config.py           # Settings (env vars via pydantic-settings)
│   │   ├── db.py               # MongoDB connection (Motor + certifi)
│   │   ├── models.py           # Pydantic schemas (Episode, Citation, Tone, Category)
│   │   ├── gemini_client.py    # Gemini research, scripting & topic categorization
│   │   ├── tts_client.py       # ElevenLabs TTS
│   │   ├── audio_stitcher.py   # pydub audio assembly + timestamps
│   │   ├── episode_pipeline.py # End-to-end generation pipeline
│   │   ├── citations_client.py # Open Library citation resolver (with retries)
│   │   ├── image_client.py     # Cover image fetcher (Google CSE + Wikipedia fallback)
│   │   └── storage.py          # Google Cloud Storage upload
│   ├── static/audio/           # (legacy) local audio directory
│   ├── pyproject.toml
│   ├── uv.lock
│   └── .env.example
├── frontend/                   # React + Vite UI
│   ├── src/
│   │   ├── components/         # Header, Layout, NowPlaying, PodcastCard,
│   │   │                       # PodcastGrid, PodcastSection, FilterBar, SearchBar
│   │   ├── pages/              # HomePage, CreatePage, EpisodePage
│   │   ├── api/                # API client (episodes.js)
│   │   ├── App.jsx
│   │   └── index.css           # Tailwind CSS
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Tech Stack

**Backend:**
- **FastAPI** — async web framework
- **MongoDB Atlas** (Motor) — document storage
- **Google Gemini** — research, script generation & categorization
- **ElevenLabs** — text-to-speech with two distinct voices
- **pydub / FFmpeg** — audio stitching
- **Google Cloud Storage** — audio file hosting
- **Open Library API** — citation resolution

**Frontend:**
- **React** + **Vite** — UI framework
- **Tailwind CSS** — styling
- **Wouter** — routing

## Prerequisites

- Python 3.10+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) package manager
- FFmpeg (`brew install ffmpeg` on macOS, `apt-get install ffmpeg` on Linux)
- MongoDB Atlas cluster (free tier works)
- Google Gemini API key
- ElevenLabs API key
- Google Cloud Storage bucket (for audio hosting)
- Google Custom Search Engine ID (optional, for cover images)

## Setup

### Backend

```bash
cd backend
uv sync

# Configure environment
cp .env.example .env
# Edit .env with your API keys, MongoDB URI, and GCS bucket name
```

### Frontend

```bash
cd frontend
npm install
```

### Required environment variables

Create a `backend/.env` file:

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Gemini API key (also used for Google Custom Search if CSE is configured) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `MONGODB_DB_NAME` | Database name (default: `podcastgpt`) |
| `ELEVENLABS_VOICE_ID_HOST_A` | Voice for Host A (default: `JBFqnCBsd6RMkjVDRZzb`) |
| `ELEVENLABS_VOICE_ID_HOST_B` | Voice for Host B (default: `9BWtsMINqrJLrRacOk9x`) |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket for audio files |
| `GCS_PROJECT_ID` | Google Cloud project ID (optional if using default credentials) |
| `GOOGLE_CSE_CX` | Google Custom Search Engine ID for cover images (optional — falls back to Wikipedia) |

> **Note:** Make sure your current IP is allow-listed in MongoDB Atlas → Network Access.

## Running

Start both the backend and frontend:

```bash
# Terminal 1 — Backend
cd backend
uv run uvicorn app.main:app --reload --reload-exclude .venv --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## How It Works

1. **Research + Categorize + Cover Art** — These three tasks run in parallel:
   - Gemini (`gemini-3-pro-preview`) searches the web via grounded Google Search and compiles key facts, timeline, and notable details
   - Gemini (`gemini-2.0-flash`) classifies the topic into a category (technology, science, history, etc.)
   - A cover image is fetched from Google Custom Search (or Wikipedia as fallback)
2. **Script** — Gemini writes a tone-aware dialogue (15–25 exchanges) between two hosts, with citation queries for referenced primary sources
3. **Voice** — ElevenLabs generates speech for each dialogue line with distinct voices (Host A and Host B)
4. **Stitch** — pydub combines all audio segments with natural pauses (400ms same speaker, 600ms speaker change) into a single MP3, recording per-line timestamps
5. **Upload** — The final MP3 is uploaded to Google Cloud Storage and a public URL is saved
6. **Citations** — Open Library resolves referenced sources with titles, authors, cover images, and links (with exponential backoff on rate limits)
