# SubSync AI

An AI-powered video subtitle generator and translator built with **React**, **TypeScript**, **FastAPI**, **SQLite**, and **Google Gemini**.

> [!NOTE]
> SubSync AI is designed for **local / desktop use** (via `pywebview` or local dev servers). The built-in login screen is a client-side demo gate, and backend endpoints do not enforce server-side authentication. Do not expose the backend directly to the public internet without adding proper authentication and rate limiting.

## Features

- Upload videos and extract audio automatically with **FFmpeg**
- Single-pass transcription & translation into target languages using **Gemini**
- Interactive subtitle timeline & block editor with live video sync
- Save edits, track revision history, and favorite videos
- Daily API usage tracking

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+ and npm
- **FFmpeg** installed and available in your system `PATH`
- A **Google Gemini API Key**

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/KorkitChj/SubSync-AI.git
cd SubSync-AI
```

### 2. Backend setup

```bash
python -m venv .venv
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# macOS / Linux
# source .venv/bin/activate

pip install -r backend/requirements.txt
```

Create `backend/.env` from the example file and add your Gemini API key:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend setup

```bash
npm install
```

## Running the App

### Option A: Development Mode (Frontend + Backend)

Start the FastAPI backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

In a separate terminal, start the Vite dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Option B: Desktop App Mode (`pywebview`)

Build the frontend into `frontend_dist/` and launch the desktop window:

```bash
npm run build
python desktop_app.py
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic, Google GenAI SDK (`google-genai`)
- **Desktop Wrapper:** pywebview, Uvicorn

## License

This project is licensed under the [MIT License](LICENSE).
