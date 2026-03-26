# PRAJA - प्रजा | Citizen Grievance Portal

PRAJA is an AI-assisted civic complaint platform where citizens report local issues and authorities track, assign, and resolve them with better transparency.

## Features

### Citizen Experience
- Submit complaints with images and location
- Track status updates in real time
- Upvote community complaints
- Earn points through participation
- Rate public services through QR flow

### Government & Admin Workflows
- Official dashboard for assigned complaints
- Complaint assignment and escalation handling
- Analytics dashboard for departments and trends
- Notification and ATR (Action Taken Report) support

### AI Assistance
- Optional Python-based CLIP image analyzer (`analyze_service`)
- Detects likely civic issues and category/severity hints
- Returns confidence and recommended department information

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, Zustand
- Backend: Node.js, Express, MongoDB, JWT, OTP, Multer
- AI Service: FastAPI + Transformers (CLIP) + PyTorch

## Project Structure

```
Praja/
├─ backend/          # Express API
├─ frontend/         # React app
├─ analyze_service/  # Optional Python image analysis service
└─ REQUIREMENTS.md
```

## Prerequisites

- Docker Desktop (recommended)
- Docker Compose v2+
- Node.js 18+ (for local/non-Docker run)
- npm 9+ (for local/non-Docker run)
- MongoDB (local or Atlas, for local/non-Docker run)
- Python 3.10+ (only if using `analyze_service` locally)

## Quick Start

### 1) Run with Docker (recommended)

From repository root:

```bash
docker compose up --build -d
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- AI Analyzer: `http://localhost:8000`

Useful commands:

```bash
docker compose ps
docker compose logs -f
docker compose down
```

### 2) Local run (without Docker)

#### Install dependencies

```bash
npm install
npm run install:all
```

#### Configure backend environment

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/praja
JWT_SECRET=your_super_secret
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Run frontend + backend

From repository root:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## QR Rating on Any Device (ngrok)

Use this when scanning QR from a phone that is not on your localhost/WiFi network.

1) Start frontend/backend stack normally.

2) In another terminal, start ngrok for frontend:

```bash
ngrok http 5173
```

3) Copy the generated HTTPS URL and set it as frontend env:

```env
VITE_NGROK_URL=https://your-id.ngrok-free.app
```

For Docker Compose, you can export `VITE_NGROK_URL` before running compose so QR links use that public URL.

4) Restart frontend (or recreate frontend container). New QR codes will open:

`https://your-id.ngrok-free.app/rate/<serviceId>`

## Optional: Start AI Analyzer Service

If you want image analysis through `useImageAnalysis`, run:

```bash
cd analyze_service
start.bat
```

or manually:

```bash
cd analyze_service
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Then set frontend environment (optional):

```env
VITE_ANALYZE_URL=http://localhost:8000
```

When using Docker, CLIP model files are pre-cached during image build so runtime startup is more reliable.

## Scripts

### Root
- `npm run dev` - Run backend + frontend together
- `npm run build` - Build frontend
- `npm run start` - Start backend in production mode

### Backend (`backend/`)
- `npm run dev` - Start backend with watch mode
- `npm start` - Start backend normally

### Frontend (`frontend/`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build app
- `npm run preview` - Preview build

## Useful Docs

- `REQUIREMENTS.md` - Detailed dependencies, APIs, and role permissions

## License

MIT





