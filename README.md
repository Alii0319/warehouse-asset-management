# Warehouse Asset Management System

A full-stack warehouse asset management app built with **Django + DRF** (backend) and **React + TypeScript + Vite + Tailwind CSS** (frontend).

## Prerequisites
- Python 3.12+
- Node.js 20+ and npm

## Setup & Run

### 1. Backend
```bash
cd backend
python3 -m venv .venv
```

Activate virtual environment:
- **Linux / macOS:**
  ```bash
  source .venv/bin/activate
  ```
- **Windows (Command Prompt):**
  ```cmd
  .venv\Scripts\activate.bat
  ```
- **Windows (PowerShell):**
  ```powershell
  .venv\Scripts\Activate.ps1
  ```

Install dependencies, configure env, migrate, and start server:
```bash
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173` in your browser.

## Run Tests
With the virtual environment activated:
```bash
cd backend
python manage.py test -v 2
```

## Warehouse LAN Access
1. Find the host machine IP (e.g. `192.168.1.50` via `hostname -I`).
2. Add it to `DJANGO_ALLOWED_HOSTS` and `http://192.168.1.50:5173` to `CORS_ALLOWED_ORIGINS` in `backend/.env`.
3. Open `http://192.168.1.50:5173` from any device on the same network.

## Main API Endpoints
- `GET /api/assets/` — List assets (supports `?search=<asset_id>`)
- `POST /api/assets/` — Create asset (`multipart/form-data`: `asset_id`, `category`, `photograph`)
- `GET /api/assets/{id}/` — Asset details
- `GET /api/dashboard/summary/` — Dashboard statistics
