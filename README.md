# Swachhata App - स्वच्छता ऐप

A modern civic complaint management system for the Clean India Mission. Report cleanliness issues, track complaint status, and contribute to making your city cleaner.

## 🚀 Features

### For Citizens
- **Post Complaints**: Report cleanliness issues with photos and location
- **Track Status**: Monitor your complaint resolution progress
- **Earn Points**: Get rewarded for active participation
- **Notifications**: Real-time updates on complaint status

### For Admins
- **Complaint Management**: View, assign, and resolve complaints
- **User Management**: Manage citizen accounts
- **Analytics**: Track complaint statistics and trends

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** Authentication
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security
- **Morgan** for logging

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **Framer Motion** for animations
- **React Hot Toast** for notifications

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone and install dependencies:**
```bash
cd swachhata-app
npm install
```

2. **Configure environment variables:**

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhata
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

3. **Start MongoDB** (if running locally):
```bash
mongod
```

4. **Run the application:**
```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend
npm run dev:frontend
```

5. **Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 📁 Project Structure

```
swachhata-app/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── complaint.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── upload.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
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

*Made with ❤️ for a cleaner India* 🇮🇳
