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
├─ QR_SETUP_GUIDE.md
└─ REQUIREMENTS.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)
- Python 3.10+ (only if using `analyze_service`)

## Quick Start

### 1) Install dependencies

```bash
npm install
npm run install:all
```

### 2) Configure backend environment

Create `backend/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/praja
JWT_SECRET=your_super_secret
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> `PORT=5001` is recommended because frontend proxy defaults to backend on port 5001.

### 3) Run frontend + backend

From repository root:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

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

- `QR_SETUP_GUIDE.md` - Mobile QR-based service rating setup
- `REQUIREMENTS.md` - Detailed dependencies, APIs, and role permissions

## License

MIT





