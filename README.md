# PRAJA - प्रजा | Citizen Grievance Portal

A modern AI-powered civic grievance management platform designed to help citizens report public issues easily and assist authorities in resolving them efficiently. The system improves transparency, accountability, and community participation in civic services.

## Key Features


## AI-Powered Analysis
- **Smart Categorization**: Detects issue type, severity, and recommends the responsible department.
- **Confidence Scoring**: Shows reliability of AI analysis.
- **Auto-fill Forms**: AI suggests complaint descriptions from uploaded photos.

## Multi-Role System

**Citizens**:
- Report civic issues with images and GPS location
- Track complaint status in real time
- Earn XP points for participation
- Support community complaints with upvotes
- Participate in civic quizzes
- Rate public services
  
**Government Officials**: 
- View and manage assigned complaints
- Filter complaints by status, priority, or search
- Update complaint progress
- View AI severity indicators
- Maintain ATR (Action Taken Report) history

**Administrators**: 
- Monitor system statistics
- Manage users and officials
- View analytics and performance metrics
- Maintain full platform control


## Tech Stack


### Backend
- **Node.js** with Express.js
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
- 

### Database
- **Mongo DB**


### Authentication
- User registration
- User login
- Get current user
- Send OTP
- Verify OTP

### Complaints
- Create Complaint
- Get Complaint Details
- List All Complaints
- Get User Complaints
- Update Complaint Status

### Users
- Get notifications
- Mark notifications as read
- Get leaderboard

## 🎨

| Role Selection | Citizen Home | AI Analysis | Official Portal |
|---------------|--------------|-------------|-----------------|
| Choose your role | Dashboard view | Image analysis | Manage complaints |





