import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  logout: () => api.post('/auth/logout'),
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
