# Swachhata App - Requirements

## System Requirements

### Development Environment
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v6.0 or higher (local) OR MongoDB Atlas (cloud)
- **OS**: Windows 10+, macOS 10.15+, or Linux

### Recommended IDE
- Visual Studio Code with extensions:
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

---

## Backend Dependencies

### Production Dependencies
| Package | Version | Description |
|---------|---------|-------------|
| express | ^4.18.2 | Web framework for Node.js |
| mongoose | ^8.0.0 | MongoDB object modeling |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| dotenv | ^16.3.1 | Environment variables |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| multer | ^1.4.5-lts.1 | File upload handling |
| express-validator | ^7.0.1 | Input validation |
| helmet | ^7.1.0 | Security headers |
| morgan | ^1.10.0 | HTTP request logger |
| express-rate-limit | ^7.1.5 | Rate limiting |

---

## Frontend Dependencies

### Production Dependencies
| Package | Version | Description |
|---------|---------|-------------|
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | React DOM renderer |
| react-router-dom | ^6.20.0 | Client-side routing |
| axios | ^1.6.2 | HTTP client |
| zustand | ^4.4.7 | State management |
| react-hot-toast | ^2.4.1 | Toast notifications |
| lucide-react | ^0.294.0 | Icon library |
| framer-motion | ^10.16.16 | Animations |

### Dev Dependencies
| Package | Version | Description |
|---------|---------|-------------|
| vite | ^5.0.8 | Build tool |
| @vitejs/plugin-react | ^4.2.1 | React plugin for Vite |
| tailwindcss | ^3.3.6 | Utility-first CSS framework |
| postcss | ^8.4.32 | CSS transformations |
| autoprefixer | ^10.4.16 | CSS vendor prefixes |

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhata
JWT_SECRET=abcdefghijklmnop
JWT_EXPIRE=30d
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=/api
```

---

## Installation Commands

```bash
# Clone and navigate to project
cd swachhata-app

# Install all dependencies (root, backend, frontend)
npm install

# Start development servers
npm run dev

# Or start individually:
npm run dev:backend   # Backend on port 5000
npm run dev:frontend  # Frontend on port 5173
```

---

## Database Requirements

### MongoDB Collections
1. **users** - User accounts and profiles
2. **complaints** - Complaint records
3. **notifications** - User notifications

### Indexes Required
- `users.email` (unique)
- `users.phone` (unique)
- `complaints.location` (2dsphere - geospatial)
- `complaints.user` + `complaints.createdAt`
- `complaints.status` + `complaints.createdAt`
- `notifications.user` + `notifications.createdAt`

---

## API Requirements

### Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id/status` - Update status (admin)
- `GET /api/users/notifications` - Get notifications

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## File Upload Requirements

- **Supported formats**: JPEG, JPG, PNG, WebP
- **Max file size**: 5MB per image
- **Max files per request**: 5

---

## Security Requirements

- JWT token-based authentication
- Password hashing (bcrypt with 12 rounds)
- Rate limiting (100 requests per 15 minutes)
- CORS whitelist configuration
- Helmet security headers
- Input validation and sanitization
