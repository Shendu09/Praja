# PRAJA - प्रजा | Project Requirements

## System Requirements

### Development Environment
- **Docker Desktop**: Latest stable
- **Docker Compose**: v2+
- **Node.js**: v18.0.0 or higher *(only for non-Docker local run)*
- **npm**: v9.0.0 or higher *(only for non-Docker local run)*
- **MongoDB**: v6.0+ *(only for non-Docker local run)* or MongoDB Atlas
- **OS**: Windows 10+, macOS 10.15+, or Linux

### Optional AI Requirements

#### Gemini API (Frontend assistant features)
- **API Key**: Required for Gemini-powered UI features
- **Model**: `gemini-1.5-flash`
- **Env Var**: `VITE_GEMINI_API_KEY`

#### Local Python Analyzer (`analyze_service`)
- **Python**: 3.10+
- **Runs locally** on `http://localhost:8000`
- **Docker build pre-caches CLIP model** (~600MB) so runtime works offline after image build

---

## Dependencies

### Backend (`backend/package.json`)
| Package | Version |
|---------|---------|
| bcryptjs | ^2.4.3 |
| cors | ^2.8.5 |
| dotenv | ^16.3.1 |
| express | ^4.18.2 |
| express-rate-limit | ^7.1.5 |
| express-validator | ^7.0.1 |
| helmet | ^7.1.0 |
| jsonwebtoken | ^9.0.2 |
| mongoose | ^8.0.0 |
| morgan | ^1.10.0 |
| multer | ^1.4.5-lts.1 |
| nodemailer | ^8.0.2 |

### Frontend (`frontend/package.json`)
| Package | Version |
|---------|---------|
| axios | ^1.6.2 |
| framer-motion | ^10.16.16 |
| html5-qrcode | ^2.3.8 |
| leaflet | ^1.9.4 |
| lucide-react | ^0.294.0 |
| qrcode.react | ^4.2.0 |
| react | ^18.2.0 |
| react-dom | ^18.2.0 |
| react-hot-toast | ^2.4.1 |
| react-is | ^19.2.4 |
| react-leaflet | ^4.2.1 |
| react-router-dom | ^6.20.0 |
| recharts | ^3.8.0 |
| zustand | ^4.4.7 |

### Python Analyzer (`analyze_service/requirements.txt`)
| Package | Version |
|---------|---------|
| fastapi | 0.110.0 |
| uvicorn[standard] | 0.27.1 |
| python-multipart | 0.0.9 |
| Pillow | 10.2.0 |
| transformers | 4.38.0 |
| torch | Installed in Dockerfile (`pip install ... --index-url https://download.pytorch.org/whl/cpu`) |

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/praja
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ANALYZE_URL=http://localhost:8000
VITE_NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

---

## Installation & Run Commands

### Docker (recommended)
```bash
# from repo root
docker compose up --build -d

# check services
docker compose ps

# logs
docker compose logs -f
```

### Stop Docker stack
```bash
docker compose down
```

---

### Local (without Docker)
```bash
# root
npm install
npm run install:all

# run backend + frontend together
npm run dev
```

### Individual Services
```bash
# backend
cd backend
npm run dev

# frontend
cd frontend
npm run dev

# python analyzer (optional)
cd analyze_service
start.bat
```

Default ports:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- AI Analyzer: `http://localhost:8000`

---

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

### Auth
| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/otp-login` |
| GET | `/api/auth/me` |
| PUT | `/api/auth/profile` |
| PUT | `/api/auth/password` |
| POST | `/api/auth/logout` |

### OTP
| Method | Endpoint |
|--------|----------|
| POST | `/api/otp/send` |
| POST | `/api/otp/verify` |

### Complaints
| Method | Endpoint |
|--------|----------|
| GET | `/api/complaints` |
| GET | `/api/complaints/categories` |
| GET | `/api/complaints/stats` |
| GET | `/api/complaints/nearby` |
| POST | `/api/complaints/check-duplicate` |
| POST | `/api/complaints` |
| GET | `/api/complaints/my` |
| GET | `/api/complaints/:id` |
| POST | `/api/complaints/:id/upvote` |
| POST | `/api/complaints/:id/feedback` |
| POST | `/api/complaints/:id/escalate` |
| PUT | `/api/complaints/:id/status` |
| PATCH | `/api/complaints/:id/status` |
| PATCH | `/api/complaints/:id/escalation-resolution` |

### Users
| Method | Endpoint |
|--------|----------|
| GET | `/api/users/leaderboard` |
| GET | `/api/users/stats` |
| GET | `/api/users/notifications` |
| PUT | `/api/users/notifications/read-all` |
| PUT | `/api/users/notifications/:id/read` |
| GET | `/api/users` *(admin)* |
| POST | `/api/users/officials` *(admin)* |
| GET | `/api/users/:id` *(admin)* |
| PUT | `/api/users/:id/role` *(admin)* |
| PUT | `/api/users/:id/deactivate` *(admin)* |

### Admin Assignment
| Method | Endpoint |
|--------|----------|
| POST | `/api/admin/complaints/:id/assign` |
| POST | `/api/admin/complaints/bulk-assign` |
| GET | `/api/admin/officials` |
| GET | `/api/admin/assignment-stats` |

### Admin Analytics
| Method | Endpoint |
|--------|----------|
| GET | `/api/admin/analytics` |
| GET | `/api/admin/analytics/departments` |
| GET | `/api/admin/analytics/locations` |
| GET | `/api/admin/analytics/export` |

### Services / QR Ratings
| Method | Endpoint |
|--------|----------|
| GET | `/api/services` |
| GET | `/api/services/analytics/summary` |
| GET | `/api/services/:serviceId` |
| POST | `/api/services/:serviceId/rate` |
| POST | `/api/services` *(admin)* |

---

## Security Requirements

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting (100 requests / 15 minutes)
- Helmet security headers
- Input validation with express-validator
- CORS support for localhost/ngrok/vercel/render and configured frontend URL

---

## File Upload Requirements

- Supported: JPEG, JPG, PNG, WebP
- Backend JSON/body limit: `10mb`
- Complaint upload route uses single image field: `photo`

---
## Related Docs

- `README.md` - quick project setup
- `QR_SETUP_GUIDE.md` - ngrok + QR demo flow

---

