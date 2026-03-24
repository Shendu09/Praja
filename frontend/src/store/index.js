import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, complaintsAPI, usersAPI } from '../services/api';

// ─── Demo / offline helpers (localStorage) ─────────────────────────────────
const DEMO_NOTIF_KEY      = 'praja_demo_notifications';
const DEMO_COMPLAINTS_KEY = 'praja_demo_complaints';
function loadDemoNotifs()       { try { return JSON.parse(localStorage.getItem(DEMO_NOTIF_KEY)      || '[]'); } catch { return []; } }
function saveDemoNotifs(list)   { try { localStorage.setItem(DEMO_NOTIF_KEY,      JSON.stringify(list.slice(0, 100))); } catch {} }
function loadDemoComplaints()   { try { return JSON.parse(localStorage.getItem(DEMO_COMPLAINTS_KEY) || '[]'); } catch { return []; } }
function saveDemoComplaints(l)  { try { localStorage.setItem(DEMO_COMPLAINTS_KEY, JSON.stringify(l.slice(0, 50)));  } catch {} }
// ─────────────────────────────────────────────────────────────────────────────

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
        // Demo mode — restore user from localStorage without hitting the API
        if (token.startsWith('demo_token_')) {
          const saved = localStorage.getItem('praja_demo_user');
          if (saved) {
            try {
              const demoUser = JSON.parse(saved);
              set({ user: demoUser, isAuthenticated: true, token });
              return demoUser;
            } catch {}
          }
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
export const useComplaintsStore = create(
  persist(
    (set, get) => ({
  complaints: [],
  myComplaints: [],
  storedUserId: null,   // tracks whose complaints are cached
  currentComplaint: null,
  categories: [],
  stats: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  clearMyComplaints: () => set({ myComplaints: [], storedUserId: null }),

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

  fetchMyComplaints: async (params = {}, currentUserId = null) => {
    set({ isLoading: true });
    try {
      const response = await complaintsAPI.getMy(params);
      const dbComplaints = response.data || [];
      set((state) => {
        const prevUserId = state.storedUserId;
        const resolvedUserId = currentUserId
          ? String(currentUserId)
          : (dbComplaints[0]
              ? String(dbComplaints[0].user?._id || dbComplaints[0].user || prevUserId || '')
              : prevUserId);

        // Only keep locally-created demo complaints for the SAME user.
        // If a different user logs in, start with a clean slate.
        const isSameUser = !prevUserId || !currentUserId || prevUserId === String(currentUserId);
        const demoComplaints = isSameUser
          ? (state.myComplaints || []).filter(
              c => String(c._id).startsWith('demo_')
            )
          : [];

        // Merge: DB is authoritative for status/timeline; demo complaints are appended
        const dbIds = new Set(dbComplaints.map(c => String(c._id)));
        const filteredDemo = demoComplaints.filter(c => !dbIds.has(String(c._id)));

        return {
          myComplaints: [...dbComplaints, ...filteredDemo],
          storedUserId: resolvedUserId || prevUserId,
          pagination: response.pagination,
          isLoading: false,
        };
      });
    } catch {
      // API unavailable — keep whatever is already in the store (never wipe)
      set({ isLoading: false });
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

      // Persist to shared key so admin portal can read it cross-tab
      saveDemoComplaints([demoComplaint, ...loadDemoComplaints()]);
      
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
    const idStr = String(id);
    try {
      const response = await complaintsAPI.updateStatus(id, data);
      const updated = response.data;
      set((state) => ({
        complaints: state.complaints.map(c =>
          String(c._id) === idStr ? { ...c, ...updated } : c
        ),
        myComplaints: state.myComplaints.map(c =>
          String(c._id) === idStr ? { ...c, ...updated } : c
        ),
      }));
      return { success: true, data: updated };
    } catch (error) {
      // Demo mode fallback — update store locally so citizen view stays in sync
      const timelineEntry = {
        status: data.status,
        comment: data.comment || `Status updated to ${data.status}`,
        updatedBy: 'Official',
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        complaints: state.complaints.map(c =>
          String(c._id) === idStr
            ? { ...c, status: data.status, timeline: [...(c.timeline || []), timelineEntry] }
            : c
        ),
        myComplaints: state.myComplaints.map(c =>
          String(c._id) === idStr
            ? { ...c, status: data.status, timeline: [...(c.timeline || []), timelineEntry] }
            : c
        ),
      }));

      // Keep admin portal's shared complaints store in sync
      saveDemoComplaints(
        loadDemoComplaints().map(c =>
          String(c._id) === idStr
            ? { ...c, status: data.status, updatedAt: new Date().toISOString() }
            : c
        )
      );

      // Push a local notification so the citizen-side screen shows the update
      const statusLabels = {
        pending: 'Pending', acknowledged: 'Acknowledged', in_progress: 'In Progress',
        under_inspection: 'Under Inspection', work_scheduled: 'Work Scheduled',
        resolved: 'Resolved', rejected: 'Rejected', closed: 'Closed',
      };
      const statusLabel = statusLabels[data.status] || data.status;
      const allComplaints = [...get().complaints, ...get().myComplaints];
      const complaint = allComplaints.find(c => String(c._id) === idStr);
      useNotificationsStore.getState().addDemoNotification({
        _id: 'demo_notif_' + Date.now(),
        type: data.status === 'resolved' ? 'complaint_resolved' : 'complaint_update',
        title: data.status === 'resolved' ? '✅ Complaint Resolved!' : `📋 Status Updated: ${statusLabel}`,
        message: `Your complaint${complaint?.complaintId ? ' ' + complaint.complaintId : ''} has been updated to "${statusLabel}".${data.comment ? ` Official note: ${data.comment}` : ''}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return { success: true, data: { status: data.status } };
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
}),
  {
    name: 'complaints-storage',
    partialize: (state) => ({ myComplaints: state.myComplaints, storedUserId: state.storedUserId }),
  }
));

// Notifications Store
export const useNotificationsStore = create((set, get) => ({
  notifications: [],   // always the full list (read + unread)
  unreadCount: 0,
  isLoading: false,

  // Always fetch the full list so read/unread tabs are both populated
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await usersAPI.getNotifications({ limit: 50 });
      const apiList = response.data || [];
      // Merge any locally-stored demo notifications (cross-tab / offline)
      const demoList = loadDemoNotifs();
      const apiIds = new Set(apiList.map(n => n._id));
      const merged = [...apiList, ...demoList.filter(n => !apiIds.has(n._id))];
      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      set({
        notifications: merged,
        unreadCount: response.unreadCount != null
          ? response.unreadCount + demoList.filter(n => !n.isRead).length
          : merged.filter(n => !n.isRead).length,
        isLoading: false,
      });
    } catch (error) {
      // API failed (demo / token expired) — show local demo notifications
      const demoList = loadDemoNotifs();
      set({
        notifications: demoList,
        unreadCount: demoList.filter(n => !n.isRead).length,
        isLoading: false,
      });
    }
  },

  markAsRead: async (id) => {
    // Demo notifications don't exist in DB – just update local + localStorage
    if (String(id).startsWith('demo_')) {
      saveDemoNotifs(loadDemoNotifs().map(n => n._id === id ? { ...n, isRead: true } : n));
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      return;
    }
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

  // Inject a notification created locally (demo / offline mode)
  addDemoNotification: (notification) => {
    const existing = loadDemoNotifs();
    saveDemoNotifs([notification, ...existing]);
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllAsRead: async () => {
    // Always mark localStorage demo notifications as read
    saveDemoNotifs(loadDemoNotifs().map(n => ({ ...n, isRead: true })));
    try {
      await usersAPI.markAllRead();
    } catch (error) {
      // Ignore — demo mode
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
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
