# 🛰️ SatQuery

> **Ask. Analyze. Understand Earth.**

An interactive vision-language assistant for multimodal remote sensing image analysis through natural-language text queries.

**Team DELVE · Smart India Hackathon 2026 · ISRO · Space Technology**

---

## 🎯 What is SatQuery?

SatQuery lets humans ask questions directly to Earth observation data in plain English.

Examples:
- *"What percentage of Chennai is water?"*
- *"Compare vegetation in the Amazon over two seasons."*
- *"Assess flood damage in Rajahmundry."*
- *"Ice extent in Antarctica this month."*

The system returns:
- A natural-language answer from an AI vision model
- Land-cover percentage breakdowns
- Evidence (source, date, confidence, limitations)
- Thematic map layers (water, vegetation, ice, flood, etc.)
- A downloadable PDF report

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────┐
│              Browser (Next.js 16 + TS)            │
│   ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│   │ Sidebar  │  │ MapLibre │  │  ChatPanel    │   │
│   │          │  │ GL +     │  │  (streaming   │   │
│   │          │  │ Esri/    │  │   AI + stats) │   │
│   │          │  │ NASA     │  │               │   │
│   └──────────┘  └──────────┘  └───────────────┘   │
│   IndexedDB (local saves) · localStorage          │
└──────────────────────┬────────────────────────────┘
                       │ fetch /api/*
                       ▼
┌───────────────────────────────────────────────────┐
│           FastAPI (Python 3.11)                   │
│  /api/analyze   → Gemini 3.6 Flash (vision+text)  │
│  /health        → status                          │
│  Cache: diskcache · 24h TTL                       │
│  Rate limit: slowapi · 15 req/min                 │
└──────────────────────┬────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Gemini API    NASA GIBS       Esri World
   (free tier)   (free)          Imagery (free)
```

### Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind v4, MapLibre GL | Free |
| Backend | FastAPI, Python 3.11, Rasterio | Free |
| AI | Google Gemini 3.6 Flash (vision + text) | Free tier (1500 req/day) |
| Imagery | NASA GIBS, Esri World Imagery, OpenStreetMap | Free, no auth |
| Geocoding | Open-Meteo Geocoding API | Free, no auth |
| Storage | IndexedDB + SQLite (diskcache) | Free |
| Reports | jsPDF + jspdf-autotable | Free |

**No paid APIs. No credit card. No hidden fees.**

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- A free Gemini API key → https://aistudio.google.com/apikey

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/satquery.git
cd satquery
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env → paste your GEMINI_API_KEY
```

### 3. Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS/Linux
# source venv/bin/activate

pip install fastapi "uvicorn[standard]" python-multipart google-genai pillow numpy diskcache slowapi python-dotenv requests reportlab python-pptx
uvicorn main:app --reload --port 8000
```

### 4. Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

### 5. Open

- Frontend → http://localhost:3000
- Backend health → http://localhost:8000/health

---

## 📁 Project Structure

```
satquery/
├── frontend/                  # Next.js app
│   ├── app/                   # Pages (App Router)
│   ├── components/            # UI components
│   ├── lib/                   # API client, storage, utils
│   └── public/                # Static assets
├── backend/                   # FastAPI
│   ├── api/                   # Route handlers
│   ├── ai/                    # Gemini client + prompts
│   ├── utils/                 # Cache, image processing
│   └── main.py
├── data/                      # Runtime cache (gitignored)
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

---

## 🎯 Features

### Core
- 🌍 **Worldwide map** — Esri satellite imagery, zoom to street level
- 🔍 **Place autocomplete** — search any city/region/country (Open-Meteo geocoding)
- 🤖 **Gemini vision AI** — answers questions about uploaded images OR any region
- 📊 **Land-cover percentages** — water, vegetation, built-up, agriculture, ice, bare land
- 🗺️ **Layer manager** — 12 thematic layers, color-coded
- ✏️ **Region selector** — draw rectangle, live area readout in km²
- 📅 **Timeline / date picker** — NASA GIBS daily MODIS imagery

### Advanced
- 📤 **Image upload** — drag, analyze with AI vision
- 🔁 **Before/After compare** — AI reads both images, reports change
- 🌊 **Disaster detection** — flood, wildfire, cyclone, ice, drought
- 💾 **Saved analyses** — IndexedDB, fully restorable
- 📄 **PDF reports** — executive summary, stats, evidence, images
- 🌓 **Dark / light theme** — glassmorphism + claymorphism

---

## 🔐 Data & Privacy

- **No user accounts** — all data stored in your browser (IndexedDB)
- **API keys** — server-side only, never exposed to browser
- **Images** — processed locally before sending to Gemini (resized to 1024px)
- **No telemetry** — we don't track anything
- **Rate limits** — 15 req/min per IP, cached for 24h

---

## ⚠️ Honest Limitations

SatQuery is a student hackathon project. We tell you the truth:

1. **Satellite imagery is not real-time.** Each dataset has a revisit lag:
   - MODIS: daily
   - Sentinel-2: ~5 days
   - Landsat: 16 days

2. **Land cover percentages are estimates**, not pixel-level computations. They are drawn from reference datasets (ESA WorldCover, Copernicus, MODIS) and reference values the AI knows.

3. **"Confidence"** = the AI's self-assessed certainty. It is **not accuracy**.

4. **Ice / glacier layers** use NASA MODIS Snow Cover — this is visual extent, not ice mass.

5. **Tsunami detection** requires hydrodynamic modeling (bathymetry + inundation models). SatQuery recognizes the intent and explains this — it does not fake it.

6. **Predicted risk** is clearly distinguished from **detected events**.

---

## 🧪 Testing

1. Open http://localhost:3000
2. Map defaults to Rajahmundry, India
3. Type in the TopBar search: **"Tokyo"** → map flies to Tokyo
4. In the chat panel: **"What percentage of Chennai is water?"** → AI response with stats
5. Click **Select Region** → drag a rectangle → see cyan outline + area in km²
6. Sidebar → **Upload & Compare** → upload two images → AI compares
7. Sidebar → **Disaster Detection** → pick flood + location → run
8. Click **Save** on any result → check **Saved Analyses**
9. Download **PDF** from any result

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

- **ISRO** — for the problem statement
- **Google Gemini** — free tier vision + language model
- **NASA GIBS** — free satellite imagery
- **Esri, Maxar, Earthstar Geographics** — base imagery
- **OpenStreetMap** — roads & labels
- **Open-Meteo** — geocoding

---

**Team DELVE · 2026**