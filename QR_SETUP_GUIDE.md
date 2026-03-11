# QR Code Rating System Setup Guide

## Overview
This system allows citizens to rate public services by scanning QR codes with their phones. When scanned, the QR code opens a mobile-friendly rating page that works without requiring login.

## Quick Start

### 1. Start the Backend
```bash
cd swachhata-app/backend
npm run dev
```
Backend runs on: http://localhost:5001

### 2. Start the Frontend
```bash
cd swachhata-app/frontend
npm run dev
```
Frontend runs on: http://localhost:5173 (accessible from all network interfaces)

### 3. Set Up ngrok for Mobile Access

**Why ngrok?**
QR codes need to be scannable from ANY phone, not just devices on your local network. ngrok creates a public URL that tunnels to your local server.

**Steps:**

1. Install ngrok (if not already):
   ```bash
   npm install -g ngrok
   # OR download from https://ngrok.com/download
   ```

2. In a NEW terminal, start ngrok:
   ```bash
   ngrok http 5173
   ```

3. ngrok shows output like:
   ```
   Forwarding  https://abc123.ngrok-free.app -> localhost:5173
   ```

4. Copy the `https://...ngrok-free.app` URL

5. Update `frontend/.env`:
   ```
   VITE_NGROK_URL=https://abc123.ngrok-free.app
   ```

6. Restart frontend (Ctrl+C, then `npm run dev`)

**Note:** Free ngrok URLs change every restart. Update `.env` each time.

## Demo Flow for Judges

### Step 1: Show the RateServiceScreen
1. Open app on laptop
2. Login as citizen
3. Go to "Rate Service" 
4. Click any service category (e.g., "Public Toilet")
5. Click any service location → QR code modal appears

### Step 2: Judge Scans QR Code
1. Judge uses their phone camera to scan QR code
2. Mobile rating page opens instantly (no login needed!)
3. Beautiful teal-themed page with service details
4. They tap stars, optionally rate specific aspects
5. Submit rating

### Step 3: Show Live Update
1. On laptop, refresh the service card
2. Rating count increased
3. Average rating updated live

### Step 4: Show Admin Analytics (Optional)
- "X ratings via QR scan today"
- Average rating breakdown by aspect
- Category-wise statistics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | Get all services grouped by category |
| GET | `/api/services/:serviceId` | Get single service details |
| POST | `/api/services/:serviceId/rate` | Submit rating (no auth required) |
| POST | `/api/services` | Create new service (admin only) |
| GET | `/api/services/analytics/summary` | Get rating statistics |

## Service IDs Format
Services are identified with IDs like:
- `SVC-TOILET-001` - Public Toilet
- `SVC-PARK-001` - Park & Garden
- `SVC-HOSP-001` - Government Hospital
- `SVC-TRANS-001` - Public Transport
- `SVC-OFFICE-001` - Government Office
- `SVC-WATER-001` - Water Supply
- `SVC-WASTE-001` - Waste Collection
- `SVC-LIGHT-001` - Street Light

## Rating URLs
QR codes encode URLs in this format:
```
https://your-ngrok-url.ngrok-free.app/rate/SVC-TOILET-001
```

When scanned, this opens the standalone `MobileRatingScreen` without the main app shell.

## Troubleshooting

### QR code not working on phone?
- Make sure ngrok is running
- Check that `VITE_NGROK_URL` in `.env` matches the ngrok URL
- Restart the frontend after changing `.env`

### "Service not found" error?
- Run the seed script: `node backend/seedServices.js`
- Make sure MongoDB is running

### CORS errors?
- The backend is configured to accept requests from ngrok URLs
- Check that backend is running on port 5001

## Files Created

### Backend
- `models/ServiceLocation.model.js` - Service location schema
- `models/ServiceRating.model.js` - Rating schema
- `controllers/service.controller.js` - Service endpoints
- `routes/service.routes.js` - Service routing
- `seedServices.js` - Database seeder

### Frontend
- `src/config/ngrok.js` - ngrok URL configuration
- `src/components/screens/MobileRatingScreen.jsx` - Standalone rating page
- Updated `App.jsx` with React Router for `/rate/:serviceId`
- Updated `RateServiceScreen.jsx` with ngrok QR URLs
