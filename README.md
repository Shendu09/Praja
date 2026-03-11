# PRAJA - प्रजा | Citizen Grievance Portal

A modern AI-powered civic grievance management system for India. Report civic issues, track complaint status, and contribute to improving public services in your community.

## Key Features


## AI-Powered Analysis
- **Google Gemini Vision Integration**: Automatic image analysis for civic issues
- **Smart Categorization**: AI detects issue type, severity, and recommends department
- **Confidence Scoring**: Reliability metrics for each analysis
- **Auto-fill Forms**: AI generates descriptions from uploaded photos

## Multi-Role System
- **Citizens**: Report issues, track complaints, earn points
- **Government Officials**: Manage assigned complaints, update status, ATR reports
- **Administrators**: Full system oversight, analytics, user management

## Citizen Features
- **Post Complaints**: Report civic issues with photos and GPS location
- **Real-time Tracking**: Monitor complaint resolution progress
- **Gamification**: Earn XP points for civic participation
- **Community Hub**: Upvote and support others' complaints
- **Civic Quiz**: Learn and earn rewards
- **Rate Services**: Review public toilets, transport, and more
- **OTP Authentication**: Secure phone/email verification

## Official Portal
- **Complaint Dashboard**: Filter by status, priority, search
- **AI Severity Badges**: Visual priority indicators
- **Map Integration**: Google Maps embed for location
- **ATR History**: Action Taken Report timeline
- **Status Updates**: Acknowledge → In Progress → Resolved

## Admin Portal
- **Real-time Statistics**: Complaints, users, resolution rates
- **User Management**: View and manage all users
- **Analytics Dashboard**: Trends and performance metrics

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
- **Google Gemini Vision API** for AI analysis

### Database
- **Mongo DB**


### Authentication
- User registration
- User login
- Get current user
- Send OTP
- Verify OTP

### Complaints
- List all complaints
- Get user's complaints
- Create complaint (with AI analysis)
- Get complaint details
- Update status

### Users
- Get notifications
- Mark as read
- Get leaderboard

## 🎨

| Role Selection | Citizen Home | AI Analysis | Official Portal |
|---------------|--------------|-------------|-----------------|
| Choose your role | Dashboard view | Image analysis | Manage complaints |





