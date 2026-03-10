import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, complaintsAPI, usersAPI } from '../services/api';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          const { token, ...user } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.error || 'Login failed' });
          return { success: false, error: error.error };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          const { token, ...user } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.error || 'Registration failed' });
          return { success: false, error: error.error };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('praja_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (userData) => {
        set({ user: userData, isAuthenticated: true });
      },

      updateUser: (data) => {
        set((state) => ({ user: { ...state.user, ...data } }));
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token') || localStorage.getItem('praja_token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        try {
          const response = await authAPI.getMe();
          set({ user: response.data, isAuthenticated: true, token });
          return response.data;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('praja_token');
          set({ user: null, token: null, isAuthenticated: false });
          throw new Error('Auth failed');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Complaints Store
export const useComplaintsStore = create((set, get) => ({
  complaints: [],
  myComplaints: [],
  currentComplaint: null,
  categories: [],
  stats: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchCategories: async () => {
    try {
      const response = await complaintsAPI.getCategories();
      set({ categories: response.data });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  fetchComplaints: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await complaintsAPI.getAll(params);
      set({
        complaints: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: error.error });
    }
  },

  fetchMyComplaints: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await complaintsAPI.getMy(params);
      set({
        myComplaints: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: error.error });
    }
  },

  fetchComplaint: async (id) => {
    set({ isLoading: true });
    try {
      const response = await complaintsAPI.getOne(id);
      set({ currentComplaint: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.error });
    }
  },

  createComplaint: async (data) => {
    set({ isLoading: true });
    try {
      const response = await complaintsAPI.create(data);
      set((state) => ({
        myComplaints: [response.data, ...state.myComplaints],
        isLoading: false,
      }));
      // Return full response including aiAnalysis
      return { 
        success: true, 
        data: {
          ...response.data,
          aiAnalysis: response.aiAnalysis,
          governmentNotified: response.governmentNotified,
          notifiedDepartment: response.notifiedDepartment
        }
      };
    } catch (error) {
      console.log('API failed, using demo mode for complaint creation');
      // Demo mode fallback - create complaint locally
      const demoComplaint = {
        _id: 'demo_' + Date.now(),
        complaintId: 'PRJ-' + new Date().getFullYear() + '-' + String(Math.floor(100000 + Math.random() * 900000)),
        user: 'demo_user',
        category: data.category,
        categoryLabel: data.categoryLabel,
        description: data.description,
        photo: data.photo,
        location: data.location,
        status: 'pending',
        priority: data.geminiAnalysis?.severity?.toLowerCase() || 'medium',
        department: data.geminiAnalysis?.department || 'Municipal',
        aiVerification: {
          isVerified: true,
          confidence: (data.geminiAnalysis?.confidence || 85) / 100,
          severity: data.geminiAnalysis?.severity?.toLowerCase() || 'medium',
          detectedIssues: data.geminiAnalysis?.tags || [],
          verifiedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set((state) => ({
        myComplaints: [demoComplaint, ...state.myComplaints],
        complaints: [demoComplaint, ...state.complaints],
        isLoading: false,
      }));
      
      return { 
        success: true, 
        data: demoComplaint,
        aiAnalysis: {
          confidence: demoComplaint.aiVerification.confidence,
          severity: demoComplaint.aiVerification.severity,
          priority: demoComplaint.priority,
          department: demoComplaint.department,
          detectedIssues: demoComplaint.aiVerification.detectedIssues
        },
        governmentNotified: true,
        notifiedDepartment: demoComplaint.department,
        demoMode: true
      };
    }
  },

  updateComplaintStatus: async (id, data) => {
    try {
      const response = await complaintsAPI.updateStatus(id, data);
      const updated = response.data;
      set((state) => ({
        complaints: state.complaints.map(c =>
          c._id === id ? { ...c, ...updated } : c
        ),
        myComplaints: state.myComplaints.map(c =>
          c._id === id ? { ...c, ...updated } : c
        ),
      }));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.error };
    }
  },

  fetchStats: async () => {
    try {
      const response = await complaintsAPI.getStats();
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },
}));

// Notifications Store
export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await usersAPI.getNotifications(params);
      set({
        notifications: response.data,
        unreadCount: response.unreadCount,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await usersAPI.markNotificationRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await usersAPI.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },
}));

// UI Store for navigation and modals
export const useUIStore = create((set) => ({
  currentScreen: 'home',
  activeTab: 'home',
  selectedCategory: null,
  showAuthModal: false,
  authModalType: 'login',
  switchRoleRequested: false,

  setScreen: (screen) => set({ currentScreen: screen }),
  setActiveTab: (tab) => set({ activeTab: tab, currentScreen: tab }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setShowAuthModal: (show, type = 'login') => set({ showAuthModal: show, authModalType: type }),
  requestSwitchRole: () => set({ switchRoleRequested: true }),
  clearSwitchRoleRequest: () => set({ switchRoleRequested: false }),
}));
