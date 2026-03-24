import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const LOCAL_USERS_KEY = 'praja_local_users';

const isLocalMode = () => {
  const envFlag = String(import.meta.env.VITE_LOCAL_MODE || '').toLowerCase();
  if (envFlag === 'true') return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('praja_local_mode') === 'true';
  }
  return false;
};

const readLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role || 'citizen',
  points: user.points || 0,
  complaintsPosted: user.complaintsPosted || 0,
  location: user.location || null,
});

const makeLocalToken = () => `demo_token_${Date.now()}`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('praja_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('praja_token');
      // Don't redirect, let app handle it
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authAPI = {
  register: async (data) => {
    if (!isLocalMode()) return api.post('/auth/register', data);

    const users = readLocalUsers();
    const duplicate = users.find((u) =>
      (data.email && u.email === data.email) || (data.phone && u.phone === data.phone)
    );
    if (duplicate) {
      return Promise.reject({ error: 'Account already exists' });
    }

    const localUser = {
      _id: `local_${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role || 'citizen',
      points: 0,
      complaintsPosted: 0,
      location: data.location || null,
      createdAt: new Date().toISOString(),
    };
    users.unshift(localUser);
    writeLocalUsers(users);

    const token = makeLocalToken();
    const publicUser = toPublicUser(localUser);
    localStorage.setItem('praja_token', token);
    localStorage.setItem('praja_demo_user', JSON.stringify(publicUser));
    return { success: true, data: { ...publicUser, token } };
  },

  login: async (data) => {
    if (!isLocalMode()) return api.post('/auth/login', data);

    const users = readLocalUsers();
    const user = users.find((u) => {
      const identifierMatches =
        (data.email && u.email === data.email) ||
        (data.phone && u.phone === data.phone) ||
        (data.identifier && (u.email === data.identifier || u.phone === data.identifier));
      const roleMatches = !data.role || !u.role || u.role === data.role;
      return identifierMatches && roleMatches;
    });

    if (!user || (data.password && user.password !== data.password)) {
      return Promise.reject({ error: 'Invalid credentials' });
    }

    const token = makeLocalToken();
    const publicUser = toPublicUser(user);
    localStorage.setItem('praja_token', token);
    localStorage.setItem('praja_demo_user', JSON.stringify(publicUser));
    return { success: true, data: { ...publicUser, token } };
  },

  getMe: async () => {
    if (!isLocalMode()) return api.get('/auth/me');
    const token = localStorage.getItem('token') || localStorage.getItem('praja_token');
    if (!token) {
      return Promise.reject({ error: 'Unauthorized' });
    }
    const saved = localStorage.getItem('praja_demo_user');
    if (!saved) {
      return Promise.reject({ error: 'User not found' });
    }
    return { success: true, data: JSON.parse(saved) };
  },

  updateProfile: async (data) => {
    if (!isLocalMode()) return api.put('/auth/profile', data);
    const saved = localStorage.getItem('praja_demo_user');
    if (!saved) {
      return Promise.reject({ error: 'User not found' });
    }

    const current = JSON.parse(saved);
    const updated = { ...current, ...data };
    localStorage.setItem('praja_demo_user', JSON.stringify(updated));

    const users = readLocalUsers();
    writeLocalUsers(users.map((u) => (u._id === current._id ? { ...u, ...data } : u)));
    return { success: true, data: updated };
  },

  updatePassword: async (data) => {
    if (!isLocalMode()) return api.put('/auth/password', data);
    const saved = localStorage.getItem('praja_demo_user');
    if (!saved) {
      return Promise.reject({ error: 'User not found' });
    }
    const current = JSON.parse(saved);
    const users = readLocalUsers();
    writeLocalUsers(
      users.map((u) => (u._id === current._id ? { ...u, password: data.newPassword || data.password } : u))
    );
    return { success: true };
  },

  logout: async () => {
    if (!isLocalMode()) return api.post('/auth/logout');
    return { success: true };
  },
};

// Complaints API
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getMy: (params) => api.get('/complaints/my', { params }),
  getOne: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  addFeedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),
  upvote: (id) => api.post(`/complaints/${id}/upvote`),
  getNearby: (params) => api.get('/complaints/nearby', { params }),
  getStats: () => api.get('/complaints/stats'),
  getCategories: () => api.get('/complaints/categories'),
  escalate: (id, data) => api.post(`/complaints/${id}/escalate`, data),
};

// Admin API
export const adminAPI = {
  // Assignment
  assignComplaint: (complaintId, data) => api.post(`/admin/complaints/${complaintId}/assign`, data),
  bulkAssign: (data) => api.post('/admin/complaints/bulk-assign', data),
  getOfficials: (params) => api.get('/admin/officials', { params }),
  getAssignmentStats: () => api.get('/admin/assignment-stats'),
  createOfficial: (data) => api.post('/users/officials', data),
  
  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
  getDepartmentAnalytics: () => api.get('/admin/analytics/departments'),
  getLocationAnalytics: () => api.get('/admin/analytics/locations'),
  exportAnalytics: (params) => api.get('/admin/analytics/export', { params }),
  
  // Escalation resolution
  resolveEscalation: (id, data) => api.patch(`/complaints/${id}/escalation-resolution`, data),
};

// Users API
export const usersAPI = {
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
  markAllRead: () => api.put('/users/notifications/read-all'),
  getLeaderboard: (params) => api.get('/users/leaderboard', { params }),
  getStats: () => api.get('/users/stats'),
};

export default api;
