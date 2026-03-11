# PRAJA - प्रजा | Citizen Grievance Portal

A modern AI-powered civic grievance management system for India. Report civic issues, track complaint status, and contribute to improving public services in your community.

## 🌟 Key Features

### 🤖 AI-Powered Analysis
- **Google Gemini Vision Integration**: Automatic image analysis for civic issues
- **Smart Categorization**: AI detects issue type, severity, and recommends department
- **Confidence Scoring**: Reliability metrics for each analysis
- **Auto-fill Forms**: AI generates descriptions from uploaded photos

### 👥 Multi-Role System
- **Citizens**: Report issues, track complaints, earn points
- **Government Officials**: Manage assigned complaints, update status, ATR reports
- **Administrators**: Full system oversight, analytics, user management

### 📱 Citizen Features
- **Post Complaints**: Report civic issues with photos and GPS location
- **Real-time Tracking**: Monitor complaint resolution progress
- **Gamification**: Earn XP points for civic participation
- **Community Hub**: Upvote and support others' complaints
- **Civic Quiz**: Learn and earn rewards
- **Rate Services**: Review public toilets, transport, and more
- **OTP Authentication**: Secure phone/email verification

### 🏛️ Official Portal
- **Complaint Dashboard**: Filter by status, priority, search
- **AI Severity Badges**: Visual priority indicators
- **Map Integration**: Google Maps embed for location
- **ATR History**: Action Taken Report timeline
- **Status Updates**: Acknowledge → In Progress → Resolved

### 🔐 Admin Portal
- **Real-time Statistics**: Complaints, users, resolution rates
- **User Management**: View and manage all users
- **Analytics Dashboard**: Trends and performance metrics

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** Authentication with OTP support
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security
- **Nodemailer** for email notifications

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Google Gemini Vision API** for AI analysis

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn
- Google Gemini API Key (free at https://aistudio.google.com/app/apikey)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Shendu09/Praja.git
cd Praja
npm install
```

2. **Configure Backend environment:**

Create `backend/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/praja
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

3. **Configure Frontend environment:**

Create `frontend/.env`:
```env
VITE_API_URL=/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Start MongoDB** (if running locally):
```bash
mongod --dbpath "C:\data\db"
```

5. **Run the application:**
```bash
# Run both frontend and backend
npm run dev

# Or run separately:
cd backend && node server.js    # Backend on port 5001
cd frontend && npm run dev      # Frontend on port 5173
```

6. **Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api
- Health Check: http://localhost:5001/api/health

## 📁 Project Structure

```
praja/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js     # Authentication
│   │   ├── complaint.controller.js # Complaints CRUD
│   │   └── user.controller.js     # User management
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── error.middleware.js    # Error handling
│   │   └── validation.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Complaint.model.js
│   │   └── Notification.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   ├── otp.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── ai.service.js          # AI analysis
│   │   ├── notification.service.js
│   │   └── otp.service.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/
│   │   │   │   ├── SplashScreen.jsx
│   │   │   │   ├── RoleSelectionScreen.jsx
│   │   │   │   ├── OTPAuthScreen.jsx
│   │   │   │   ├── HomeScreen.jsx
│   │   │   │   ├── CategoryScreen.jsx
│   │   │   │   ├── ComplaintFormScreen.jsx
│   │   │   │   ├── ComplaintsScreen.jsx
│   │   │   │   ├── CommunityScreen.jsx
│   │   │   │   ├── QuizScreen.jsx
│   │   │   │   ├── RateServiceScreen.jsx
│   │   │   │   ├── ProfileScreen.jsx
│   │   │   │   ├── OfficialPortal.jsx
│   │   │   │   └── AdminPortal.jsx
│   │   │   ├── ComplaintAIAnalyzer.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   └── PhoneShell.jsx
│   │   ├── hooks/
│   │   │   └── useImageAnalysis.js  # Gemini Vision hook
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── location.js
│   │   ├── store/
│   │   │   └── index.js           # Zustand stores
│   │   └── App.jsx
│   └── vite.config.js
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP

### Complaints
- `GET /api/complaints` - List all complaints
- `GET /api/complaints/my` - Get user's complaints
- `POST /api/complaints` - Create complaint (with AI analysis)
- `GET /api/complaints/:id` - Get complaint details
- `PATCH /api/complaints/:id/status` - Update status

### Users
- `GET /api/users/notifications` - Get notifications
- `PUT /api/users/notifications/:id/read` - Mark as read
- `GET /api/users/leaderboard` - Get leaderboard

## 🎨 Screenshots

| Role Selection | Citizen Home | AI Analysis | Official Portal |
|---------------|--------------|-------------|-----------------|
| Choose your role | Dashboard view | Image analysis | Manage complaints |

## 📄 License

MIT License - Feel free to use for your Smart India Hackathon projects!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


│   │   ├── User.model.js
│   │   ├── Complaint.model.js
│   │   └── Notification.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   └── user.routes.js
│   ├── uploads/               # Uploaded files
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.jsx
│   │   │   │   ├── CategoryScreen.jsx
│   │   │   │   ├── ComplaintFormScreen.jsx
│   │   │   │   ├── NotificationsScreen.jsx
│   │   │   │   ├── ComplaintsScreen.jsx
│   │   │   │   └── ProfileScreen.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── PhoneShell.jsx
│   │   │   └── TealHeader.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── store/
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Update password |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | Get all complaints |
| GET | `/api/complaints/my` | Get user's complaints |
| GET | `/api/complaints/:id` | Get single complaint |
| POST | `/api/complaints` | Create complaint |
| PUT | `/api/complaints/:id/status` | Update status (Admin) |
| POST | `/api/complaints/:id/feedback` | Add feedback |
| GET | `/api/complaints/categories` | Get categories |
| GET | `/api/complaints/stats` | Get statistics |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/notifications` | Get notifications |
| PUT | `/api/users/notifications/:id/read` | Mark as read |
| GET | `/api/users/leaderboard` | Get leaderboard |
| GET | `/api/users/stats` | Get user stats |

## 🎨 Complaint Categories

- 🗑️ Cleanliness Target Unit (Dirty Spot)
- 🏔️ Garbage Dump
- 🚛 Garbage Vehicle Not Arrived
- 🔥 Burning of Garbage in Open Space
- 🧹 Sweeping Not Done
- 🗑️ Dustbins Not Cleaned
- 🚽 Open Defecation
- 💧 Overflow of Sewerage or Storm Water
- 🌊 Stagnant Water on Road / Open Area
- 🏚️ Slum Area Not Clean
- 🌿 Overgrown Vegetation on Road
- 🐄 Stray Animals

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- Input validation
- CORS configuration
- File upload restrictions

## 📝 License

MIT License - feel free to use this for learning or production!

---

