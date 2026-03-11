import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, 
  LogOut, Bell, Search, Filter, ChevronDown, CheckCircle,
  Clock, AlertTriangle, TrendingUp, Building2, MapPin,
  Eye, UserPlus, Trash2, Edit, X, User, Calendar,
  AlertCircle, ArrowUpRight, RefreshCw, Download, Activity,
  ShieldCheck, ToggleLeft, ToggleRight, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';
import api, { adminAPI, complaintsAPI } from '../../services/api';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'complaints', label: 'All Complaints', icon: FileText },
  { id: 'officials', label: 'Manage Officials', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Backend department enum values → display labels
const DEPT_MAP = {
  sanitation: 'Sanitation Department',
  roads: 'Public Works / Roads',
  water: 'Water Supply Board',
  electricity: 'Electricity Department',
  health: 'Health Department',
  environment: 'Environment Department',
  general: 'General / Municipal',
};
const DEPT_KEYS = Object.keys(DEPT_MAP);
const deptLabel = (key) => DEPT_MAP[key] || key;

// For backward-compat: long label → backend key
const deptKeyFromLabel = (label) => {
  const entry = Object.entries(DEPT_MAP).find(([, v]) => v === label);
  return entry ? entry[0] : label;
};

const severityColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700 animate-pulse'
};

const statusColors = {
  Submitted: 'bg-gray-100 text-gray-700',
  Assigned: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-200 text-gray-600',
  Escalated: 'bg-orange-100 text-orange-700',
  'Final Resolution': 'bg-purple-100 text-purple-700'
};

const CHART_COLORS = {
  primary: '#0D4F44',
  secondary: '#4ade80',
  submitted: '#94a3b8',
  assigned: '#3b82f6',
  inProgress: '#f59e0b',
  resolved: '#22c55e',
  closed: '#0D4F44'
};

// ─── Shared localStorage helpers ─────────────────────────────────────────────
const DEMO_NOTIF_KEY      = 'praja_demo_notifications';
const DEMO_COMPLAINTS_KEY = 'praja_demo_complaints';
const ADMIN_SETTINGS_KEY  = 'praja_admin_settings';
function loadDemoNotifs()           { try { return JSON.parse(localStorage.getItem(DEMO_NOTIF_KEY)      || '[]'); } catch { return []; } }
function loadAdminDemoComplaints()  { try { return JSON.parse(localStorage.getItem(DEMO_COMPLAINTS_KEY) || '[]'); } catch { return []; } }
function loadAdminSettings()        { try { return JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY)  || '{}'); } catch { return {}; } }
function saveAdminSettings(s)       { try { localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(s)); } catch {} }
function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({
    officialId: '',
    department: '',
    note: '',
    priorityOverride: null
  });

  // Live activity feed state
  const [activityFeed, setActivityFeed] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const [bellUnread, setBellUnread] = useState(0);
  const bellRef = useRef(null);
  const prevComplaintCount = useRef(0);

  // Persistent settings state (saved to localStorage)
  const [settings, setSettings] = useState(() => {
    const s = loadAdminSettings();
    return {
      autoRefresh:          s.autoRefresh          ?? true,
      newComplaintAlerts:   s.newComplaintAlerts   ?? true,
      escalationAlerts:     s.escalationAlerts     ?? true,
      officialUpdateAlerts: s.officialUpdateAlerts ?? true,
    };
  });
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveAdminSettings(next);
      return next;
    });
  }, []);

  // Add official modal
  const [showAddOfficialModal, setShowAddOfficialModal] = useState(false);
  const [addOfficialForm, setAddOfficialForm] = useState({ name: '', email: '', phone: '', department: '', password: 'Official@123' });

  const buildActivityFeed = useCallback((latestComplaints) => {
    // Demo notifications from localStorage (status updates by officials)
    const demoNotifs = loadDemoNotifs().slice(0, 20).map(n => ({
      id: n._id,
      type: n.type,
      icon: n.type === 'complaint_resolved' ? '✅' : '🔄',
      message: n.title,
      detail: n.message,
      time: timeAgo(n.createdAt),
      raw: n.createdAt,
      severity: n.type === 'complaint_resolved' ? 'resolved' : 'update',
    }));

    // Recent complaints from API (new submissions by citizens)
    const recentItems = (latestComplaints || []).slice(0, 10).map(c => ({
      id: c._id,
      type: 'new_complaint',
      icon: '📋',
      message: `New ${c.categoryLabel || 'complaint'} submitted`,
      detail: c.location?.address || c.location?.city || '',
      time: timeAgo(c.createdAt),
      raw: c.createdAt,
      severity: c.aiVerification?.severity || c.priority || 'medium',
    }));

    const merged = [...demoNotifs, ...recentItems]
      .sort((a, b) => new Date(b.raw) - new Date(a.raw))
      .slice(0, 25);
    setActivityFeed(merged);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Poll for new data; also listen for localStorage writes (citizen/official demo activity)
  useEffect(() => {
    const interval = settings.autoRefresh ? setInterval(() => fetchData(), 15000) : null;
    const onStorage = (e) => {
      if (e.key === DEMO_NOTIF_KEY) {
        buildActivityFeed(complaints);
        if (settings.officialUpdateAlerts) setBellUnread(prev => prev + 1);
      }
      if (e.key === DEMO_COMPLAINTS_KEY) {
        const fresh = loadAdminDemoComplaints();
        setComplaints(prev => {
          const apiIds = new Set(prev.filter(c => !String(c._id).startsWith('demo_')).map(c => String(c._id)));
          return [...prev.filter(c => !String(c._id).startsWith('demo_')), ...fresh.filter(c => !apiIds.has(String(c._id)))];
        });
        buildActivityFeed(fresh);
        if (settings.newComplaintAlerts) setBellUnread(prev => prev + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [complaints, buildActivityFeed, settings]);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get('/complaints', { params: { limit: 200, order: 'desc' } }),
        api.get('/complaints/stats'),
      ]);

      // complaintsRes is the full body { success, data: [...], pagination: {} }
      const list = complaintsRes.data || [];
      setComplaints(list);

      // statsRes.data = { total, resolvedToday, byStatus: { pending: N, ... }, topCategories: [...] }
      const s = statsRes.data || {};
      const byStatus = s.byStatus || {};
      const normalised = {
        total:      s.total || list.length,
        pending:    (byStatus.pending || 0) + (byStatus.Pending || 0),
        inProgress: (byStatus.in_progress || 0) + (byStatus['In Progress'] || 0) +
                    (byStatus.acknowledged || 0) + (byStatus.under_inspection || 0) +
                    (byStatus.work_scheduled || 0),
        resolved:   (byStatus.resolved || 0) + (byStatus.Resolved || 0) +
                    (byStatus.closed || 0) + (byStatus.Closed || 0),
        todayNew:   s.resolvedToday || 0,
      };
      setStats(normalised);

      // Detect new complaints since last fetch
      if (prevComplaintCount.current > 0 && list.length > prevComplaintCount.current) {
        setBellUnread(prev => prev + (list.length - prevComplaintCount.current));
      }
      prevComplaintCount.current = list.length;
      buildActivityFeed(list);

      // Fetch officials
      try {
        const officialsRes = await adminAPI.getOfficials();
        setOfficials(officialsRes.data || []);
      } catch (e) {
        console.log('Officials fetch failed (normal if no admin route):', e.message);
      }
    } catch (error) {
      console.error('fetchData failed:', error);
      // Demo / offline fallback — load from shared localStorage
      const demoComplaints = loadAdminDemoComplaints();
      setComplaints(demoComplaints);
      const total   = demoComplaints.length;
      const pending = demoComplaints.filter(c => ['pending','Pending','Submitted'].includes(c.status)).length;
      const inProg  = demoComplaints.filter(c => ['in_progress','In Progress','acknowledged','under_inspection','work_scheduled'].includes(c.status)).length;
      const resolvd = demoComplaints.filter(c => ['resolved','Resolved','closed','Closed'].includes(c.status)).length;
      setStats({ total, pending, inProgress: inProg, resolved: resolvd, todayNew: 0 });
      buildActivityFeed(demoComplaints);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await adminAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (error) {
      console.error('Analytics API failed, computing from local data:', error);
      // Compute analytics from the complaints we already have
      const list = complaints;
      const total = list.length;
      const resolvedList = list.filter(c => ['resolved','Resolved','closed','Closed','Final Resolution'].includes(c.status));
      const pendingList = list.filter(c => ['pending','Pending','Submitted'].includes(c.status));
      const inProgList = list.filter(c => ['in_progress','In Progress','acknowledged','Assigned','under_inspection','work_scheduled'].includes(c.status));
      const escalatedList = list.filter(c => c.isEscalated);
      const todayList = list.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString());
      const todayResolved = resolvedList.filter(c => {
        const d = c.resolution?.resolvedAt || c.updatedAt;
        return d && new Date(d).toDateString() === new Date().toDateString();
      });

      // By category
      const catMap = {};
      list.forEach(c => {
        const k = c.categoryLabel || c.category || 'Other';
        if (!catMap[k]) catMap[k] = { category: k, count: 0, resolved: 0 };
        catMap[k].count++;
        if (['resolved','Resolved','closed','Closed'].includes(c.status)) catMap[k].resolved++;
      });
      // By status
      const stMap = {};
      list.forEach(c => { stMap[c.status] = (stMap[c.status]||0)+1; });
      // By severity
      const sevMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };
      list.forEach(c => {
        const s = (c.aiVerification?.severity || c.priority || 'medium').toLowerCase();
        if (s === 'low') sevMap.Low++;
        else if (s === 'medium') sevMap.Medium++;
        else if (s === 'high') sevMap.High++;
        else if (s === 'critical') sevMap.Critical++;
      });
      // 7-day trend
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const trend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toDateString();
        trend.push({
          date: dayNames[d.getDay()],
          complaints: list.filter(c => new Date(c.createdAt).toDateString() === ds).length,
          resolved: resolvedList.filter(c => { const rd = c.resolution?.resolvedAt || c.updatedAt; return rd && new Date(rd).toDateString() === ds; }).length,
        });
      }

      setAnalytics({
        overview: {
          totalComplaints: total,
          resolvedComplaints: resolvedList.length,
          pendingComplaints: pendingList.length,
          inProgressComplaints: inProgList.length,
          totalCitizens: 0,
          totalOfficials: officials.length,
          avgResolutionDays: 0,
          resolutionRate: total > 0 ? Math.round((resolvedList.length / total) * 100) : 0,
          escalatedCount: escalatedList.length,
          todayNew: todayList.length,
          todayResolved: todayResolved.length,
        },
        byCategory: Object.values(catMap).sort((a,b) => b.count - a.count).slice(0, 8),
        byStatus: Object.entries(stMap).map(([status, count]) => ({ status, count })),
        bySeverity: Object.entries(sevMap).map(([severity, count]) => ({ severity, count })).filter(x => x.count > 0),
        trend,
        topOfficials: officials.slice(0, 5).map(o => ({
          name: o.name,
          resolved: o.resolvedComplaints || 0,
          pending: o.activeComplaints || 0,
          rating: o.avgRating || 'N/A',
        })),
        recentActivity: list.slice(0, 6).map(c => ({
          type: ['resolved','Resolved','closed','Closed'].includes(c.status) ? 'complaint_resolved' : 'complaint_submitted',
          message: `${c.categoryLabel || c.category} — ${c.grv_id || c.complaintId}`,
          time: timeAgo(c.createdAt),
          severity: (c.aiVerification?.severity || c.priority || 'medium').toLowerCase(),
          location: c.location?.city || '',
        })),
      });
    }
  };

  const handleAssignComplaint = async () => {
    if (!assignmentForm.department) {
      toast.error('Please select a department');
      return;
    }

    try {
      await adminAPI.assignComplaint(selectedComplaint._id, assignmentForm);
      toast.success(`Complaint assigned to ${assignmentForm.department}`);
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setAssignmentForm({ officialId: '', department: '', note: '', priorityOverride: null });
      fetchData();
    } catch (error) {
      toast.error(error.error || 'Failed to assign complaint');
    }
  };

  const handleResolveEscalation = async (complaintId, remarks, status) => {
    try {
      await adminAPI.resolveEscalation(complaintId, { remarks, escalationStatus: status });
      toast.success('Escalation updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update escalation');
    }
  };

  // Admin directly updates a complaint's status
  const handleAdminStatusUpdate = async (complaintId, newStatus, remarks = '') => {
    try {
      await complaintsAPI.updateStatus(complaintId, { status: newStatus, comment: remarks });
      toast.success(`Status updated to "${newStatus}"`);
      // Optimistic update
      setComplaints(prev => prev.map(c =>
        c._id === complaintId ? { ...c, status: newStatus } : c
      ));
      if (selectedComplaint?._id === complaintId) {
        setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
      }
      fetchData();
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to update status');
    }
  };

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
  };

  // Normalize status to a canonical form for filtering
  const ns = (status) => (status || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const UNASSIGNED_ST  = ['pending', 'submitted'];
  const ASSIGNED_ST    = ['assigned', 'acknowledged'];
  const INPROGRESS_ST  = ['in_progress', 'under_inspection', 'work_scheduled'];
  const RESOLVED_ST    = ['resolved', 'closed', 'final_resolution', 'rejected'];

  const filteredComplaints = complaints.filter(c => {
    const st = ns(c.status);
    const matchesStatus = filterStatus === 'all'
      || (filterStatus === 'unassigned'  && UNASSIGNED_ST.includes(st))
      || (filterStatus === 'assigned'    && ASSIGNED_ST.includes(st))
      || (filterStatus === 'in_progress' && INPROGRESS_ST.includes(st))
      || (filterStatus === 'resolved'    && RESOLVED_ST.includes(st))
      || (filterStatus === 'escalated'   && c.isEscalated);

    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || c.complaintId?.toLowerCase().includes(q)
      || c.grv_id?.toLowerCase().includes(q)
      || (c.grv_id || '').toLowerCase().replace(/[^a-z0-9]/g,'').includes(q.replace(/[^a-z0-9]/g,''))
      || c.categoryLabel?.toLowerCase().includes(q)
      || c.location?.address?.toLowerCase().includes(q)
      || c.location?.city?.toLowerCase().includes(q)
      || (typeof c.user === 'object' ? c.user?.name?.toLowerCase().includes(q) : false)
      || c.description?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Tab counts (derived from same normalizer)
  const unassignedCount  = complaints.filter(c => UNASSIGNED_ST.includes(ns(c.status))).length;
  const assignedCount    = complaints.filter(c => ASSIGNED_ST.includes(ns(c.status))).length;
  const inProgressCount  = complaints.filter(c => INPROGRESS_ST.includes(ns(c.status))).length;
  const resolvedCount    = complaints.filter(c => RESOLVED_ST.includes(ns(c.status))).length;
  const escalatedCount   = complaints.filter(c => c.isEscalated).length;


  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend.startsWith('+') || trend.startsWith('↑') ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => {
    const totalCount   = stats?.total      || complaints.length || 0;
    const pendingCount = stats?.pending    || unassignedCount || 0;
    const inProgCount  = stats?.inProgress || inProgressCount + assignedCount || 0;
    const resolvedCnt  = stats?.resolved   || resolvedCount || 0;
    const resolutionRate = totalCount > 0 ? Math.round((resolvedCnt / totalCount) * 100) : 0;

    return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 items-center">
        <Search size={20} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search complaint by ID, GRV number, category, citizen name or location…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 text-sm focus:outline-none text-gray-700 placeholder-gray-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0">
            Clear
          </button>
        )}
        {searchQuery && (
          <button
            onClick={() => { setActiveTab('complaints'); }}
            className="px-3 py-1.5 bg-teal text-white rounded-lg text-xs font-medium flex-shrink-0"
          >
            View results ({filteredComplaints.length})
          </button>
        )}
      </div>

      {/* Search results preview (inline on dashboard) */}
      {searchQuery && (
        <div className="bg-white rounded-xl shadow-sm border border-teal/30">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <p className="font-semibold text-gray-800 text-sm">
              Search results for "{searchQuery}" — {filteredComplaints.length} found
            </p>
            <button onClick={() => { setActiveTab('complaints'); }} className="text-xs text-teal hover:underline">
              Open in All Complaints →
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
            {filteredComplaints.slice(0, 6).map(c => (
              <div key={c._id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer" onClick={() => openAssignModal(c)}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${['resolved','Resolved','closed','Closed'].includes(c.status) ? 'bg-green-500' : c.isEscalated ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-teal">{c.grv_id || c.complaintId}</p>
                  <p className="text-xs text-gray-500 truncate">{c.categoryLabel} · {c.location?.address?.substring(0, 40) || c.location?.city}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              </div>
            ))}
            {filteredComplaints.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">No complaints match your search</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={totalCount} icon={FileText} color="bg-blue-500"
          trend={`+${complaints.filter(c => { const d = new Date(c.createdAt); const today = new Date(); return d.toDateString() === today.toDateString(); }).length} today`} />
        <StatCard title="Pending" value={pendingCount} icon={Clock} color="bg-yellow-500"
          subtitle={unassignedCount > 0 ? `${unassignedCount} unassigned` : 'All assigned'} />
        <StatCard title="In Progress" value={inProgCount} icon={AlertTriangle} color="bg-orange-500"
          subtitle={escalatedCount > 0 ? `${escalatedCount} escalated` : ''} />
        <StatCard title="Resolved" value={resolvedCnt} icon={CheckCircle} color="bg-green-500"
          trend={`${resolutionRate}% rate`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Complaints</h3>
            <button onClick={() => setActiveTab('complaints')} className="text-teal text-sm hover:underline">
              View all ({complaints.length})
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {[...complaints].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map((complaint) => {
              const isResolved = ['resolved','Resolved','closed','Closed'].includes(complaint.status);
              const isInProg   = ['in_progress','In Progress','acknowledged','under_inspection','work_scheduled'].includes(complaint.status);
              const dotCls     = isResolved ? 'bg-green-500' : isInProg ? 'bg-orange-500' : complaint.isEscalated ? 'bg-red-500 animate-pulse' : 'bg-yellow-500';
              const timeAgo    = (() => {
                if (!complaint.createdAt) return '';
                const diff = Date.now() - new Date(complaint.createdAt).getTime();
                const m = Math.floor(diff/60000);
                if (m < 60) return `${m}m ago`;
                const h = Math.floor(m/60);
                if (h < 24) return `${h}h ago`;
                return `${Math.floor(h/24)}d ago`;
              })();
              return (
                <div key={complaint._id} className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer" onClick={() => openAssignModal(complaint)}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotCls}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-teal">{complaint.grv_id || complaint.complaintId}</p>
                      {complaint.isEscalated && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">ESC</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {complaint.categoryLabel} · {complaint.user?.name || complaint.citizenName || 'Citizen'} · {complaint.location?.city || ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[complaint.status] || 'bg-gray-100 text-gray-600'}`}>{complaint.status}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
            {complaints.length === 0 && (
              <div className="p-8 text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">No complaints yet</p>
                <p className="text-xs text-gray-300 mt-1">Complaints filed by citizens will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Escalated Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              🚨 Escalated Complaints
              {escalatedCount > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                  {escalatedCount}
                </span>
              )}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {complaints.filter(c => c.isEscalated).slice(0, 5).map((complaint) => (
              <div 
                key={complaint._id} 
                className="p-4 hover:bg-orange-50 cursor-pointer"
                onClick={() => openAssignModal(complaint)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{complaint.grv_id || complaint.complaintId}</p>
                    <p className="text-sm text-gray-500">{complaint.categoryLabel}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      Reason: {complaint.escalationReason?.substring(0, 50)}...
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    complaint.escalationStatus === 'Pending' ? 'bg-orange-100 text-orange-700' :
                    complaint.escalationStatus === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {complaint.escalationStatus || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
            {complaints.filter(c => c.isEscalated).length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No escalated complaints
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Feed — full width */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Live Activity Feed
          </h3>
          <button
            onClick={() => { fetchData(); setBellUnread(0); }}
            className="flex items-center gap-1.5 text-xs text-teal hover:underline"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div className="divide-y divide-gray-50 max-h-[340px] overflow-y-auto">
          {activityFeed.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No activity yet. Activity will appear here when citizens submit complaints or officials update statuses.</p>
            </div>
          ) : activityFeed.map((item, idx) => {
            const dotColor = {
              resolved: 'bg-green-500',
              update: 'bg-blue-500',
              critical: 'bg-red-500 animate-pulse',
              high: 'bg-orange-500',
              medium: 'bg-amber-500',
              low: 'bg-green-400',
            }[item.severity] || 'bg-gray-400';
            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50"
              >
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.message}</p>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${item.badgeColor || 'bg-gray-100 text-gray-500'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.detail}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
  };

  const renderComplaints = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',         label: `All (${complaints.length})` },
            { key: 'unassigned',  label: `Unassigned (${unassignedCount})`,  color: 'text-red-600' },
            { key: 'assigned',    label: `Assigned (${assignedCount})` },
            { key: 'in_progress', label: `In Progress (${inProgressCount})` },
            { key: 'resolved',    label: `Resolved (${resolvedCount})` },
            { key: 'escalated',   label: `🚨 Escalated (${escalatedCount})`, color: 'text-orange-600' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === item.key
                  ? 'bg-teal text-white'
                  : `bg-gray-100 ${item.color || 'text-gray-600'} hover:bg-gray-200`
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, title, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal w-64"
            />
          </div>
          <button
            onClick={() => fetchData()}
            title="Refresh complaints"
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-teal hover:border-teal transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">GRV ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">AI Severity</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Assigned To</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Department</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredComplaints.map((complaint) => (
              <tr key={complaint._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-teal">
                  {complaint.grv_id || complaint.complaintId}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{complaint.categoryLabel}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                  {complaint.location?.city || complaint.location?.address?.substring(0, 30) || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColors[complaint.status] || 'bg-gray-100 text-gray-700'
                  }`}>
                    {complaint.isEscalated && '🚨 '}{complaint.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    severityColors[complaint.aiVerification?.severity || complaint.priority] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {(complaint.aiVerification?.severity || complaint.priority || 'medium').toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {complaint.assignedTo ? (
                    <span className="text-sm text-gray-700">
                      {typeof complaint.assignedTo === 'object' ? complaint.assignedTo.name : 'Assigned'}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {deptLabel(complaint.assignedDepartment || complaint.department || '') || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openAssignModal(complaint)}
                      className="p-1.5 text-gray-400 hover:text-teal hover:bg-teal-50 rounded"
                      title="View & Assign"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => openAssignModal(complaint)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                      title="Assign"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredComplaints.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No complaints found matching your filters
          </div>
        )}
      </div>
    </div>
  );

  const handleAddOfficial = async () => {
    if (!addOfficialForm.name || !addOfficialForm.department) {
      toast.error('Name and department are required');
      return;
    }
    try {
      await adminAPI.createOfficial(addOfficialForm);
      const pwd = addOfficialForm.password || 'Official@123';
      toast.success(`Official added! Login: ${addOfficialForm.email || addOfficialForm.phone} | Password: ${pwd}`, { duration: 6000 });
      setShowAddOfficialModal(false);
      setAddOfficialForm({ name: '', email: '', phone: '', department: '', password: 'Official@123' });
      fetchData();
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to add official');
    }
  };

  const renderOfficials = () => {
    const displayOfficials = officials;
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Government Officials ({displayOfficials.length})</h3>
            </div>
            <button
              onClick={() => setShowAddOfficialModal(true)}
              className="px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <UserPlus size={16} />
              Add Official
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayOfficials.length === 0 && (
                <div className="col-span-full p-8 text-center">
                  <Users size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">No officials registered yet</p>
                  <p className="text-xs text-gray-300 mt-1">Click "Add Official" to register government officials</p>
                </div>
              )}
              {displayOfficials.map((official) => (
                <div key={official._id} className="p-4 border rounded-xl border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal font-bold text-lg">{official.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{official.name}</p>
                      <p className="text-xs text-gray-500">{official.email || official.phone || '—'}</p>
                      <p className="text-xs text-teal font-medium">{deptLabel(official.department)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Active</p>
                      <p className="font-bold text-amber-600">{official.activeComplaints || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Resolved</p>
                      <p className="font-bold text-green-600">{official.resolvedComplaints || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Rating</p>
                      <p className="font-bold text-blue-600">⭐ {official.avgRating || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Official Modal */}
        <AnimatePresence>
          {showAddOfficialModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddOfficialModal(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg text-gray-800">Add Government Official</h3>
                  <button onClick={() => setShowAddOfficialModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={addOfficialForm.name} onChange={e => setAddOfficialForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" placeholder="e.g. Ravi Kumar" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={addOfficialForm.email} onChange={e => setAddOfficialForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" placeholder="official@gov.in" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(10-digit Indian number)</span></label>
                    <input type="tel" value={addOfficialForm.phone} onChange={e => setAddOfficialForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" placeholder="9XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login Password *</label>
                    <input type="text" value={addOfficialForm.password} onChange={e => setAddOfficialForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal font-mono" placeholder="Official@123" />
                    <p className="text-xs text-gray-400 mt-1">Official will use this password to login</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <select value={addOfficialForm.department} onChange={e => setAddOfficialForm(f => ({ ...f, department: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal">
                      <option value="">Select department…</option>
                      {DEPT_KEYS.map(k => <option key={k} value={k}>{deptLabel(k)}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddOfficial}
                    className="w-full bg-teal text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
                    Add Official
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };


  const renderAnalytics = () => {
    const data = analytics || {};
    // Merge live stats into overview so real data always wins
    const overview = {
      ...(data.overview || {}),
      totalComplaints:      stats?.total      || data.overview?.totalComplaints    || complaints.length,
      pendingComplaints:    stats?.pending    || data.overview?.pendingComplaints  || 0,
      inProgressComplaints: stats?.inProgress || data.overview?.inProgressComplaints || 0,
      resolvedComplaints:   stats?.resolved   || data.overview?.resolvedComplaints  || 0,
    };
    // Build live byCategory and byStatus from complaints array when API analytics fails
    const byCategory = data.byCategory?.length > 0 ? data.byCategory : (() => {
      const map = {};
      complaints.forEach(c => {
        const k = c.categoryLabel || c.category || 'Other';
        if (!map[k]) map[k] = { category: k, count: 0, resolved: 0 };
        map[k].count++;
        if (['resolved','Resolved','closed','Closed'].includes(c.status)) map[k].resolved++;
      });
      return Object.values(map).sort((a,b) => b.count - a.count).slice(0, 6);
    })();
    const byStatus = data.byStatus?.length > 0 ? data.byStatus : (() => {
      const map = {};
      complaints.forEach(c => { map[c.status] = (map[c.status]||0)+1; });
      return Object.entries(map).map(([status, count]) => ({ status, count }));
    })();
    const bySeverity = data.bySeverity || [];
    const trend = data.trend || [];
    const topOfficials = data.topOfficials || [];
    const recentActivity = data.recentActivity || [];

    const statusChartColors = [
      CHART_COLORS.submitted,
      CHART_COLORS.assigned,
      CHART_COLORS.inProgress,
      CHART_COLORS.resolved,
      CHART_COLORS.closed
    ];

    const severityChartColors = {
      'Low': '#22c55e',
      'Medium': '#f59e0b',
      'High': '#f97316',
      'Critical': '#ef4444'
    };

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm">
            <p className="font-medium">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6">
        {/* Row 1 - Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <FileText size={18} />
              Total Complaints
            </div>
            <p className="text-4xl font-bold mt-2">{overview.totalComplaints || 0}</p>
            <p className="text-sm text-white/70 mt-2">+{overview.todayNew || 0} today</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CheckCircle size={18} />
              Resolved
            </div>
            <p className="text-4xl font-bold mt-2">{overview.resolvedComplaints || 0}</p>
            <p className="text-sm text-white/70 mt-2">+{overview.todayResolved || 0} today</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Clock size={18} />
              Pending
            </div>
            <p className="text-4xl font-bold mt-2">{overview.pendingComplaints || 0}</p>
            <p className="text-sm text-white/70 mt-2">Needs attention</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <TrendingUp size={18} />
              Resolution Rate
            </div>
            <p className="text-4xl font-bold mt-2">{overview.resolutionRate || 0}%</p>
            <p className="text-sm text-white/70 mt-2">Avg: {overview.avgResolutionDays || 0} days</p>
          </motion.div>
        </div>

        {/* Row 2 - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Complaints by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="count" name="Total" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart - Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={statusChartColors[index % statusChartColors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3 - More Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - 7-day Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">7-Day Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="complaints" 
                  name="Submitted"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  name="Resolved"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Horizontal Bar Chart - Severity Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Severity Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={bySeverity} 
                layout="vertical"
                margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="severity"
                  tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fill: '#374151', fontSize: 12 }}
                >
                  {bySeverity.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={severityChartColors[entry.severity] || '#94a3b8'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4 - Leaderboard and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Officials Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🏆 Top Performing Officials
            </h3>
            <div className="space-y-4">
              {topOfficials.map((official, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const maxResolved = topOfficials[0]?.resolved || 1;
                const progress = (official.resolved / maxResolved) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-2xl w-8">{medals[index] || `${index + 1}.`}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-800">{official.name}</span>
                        <span className="text-sm text-gray-500">{official.resolved} resolved</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal to-emerald-400 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{official.pending} pending</span>
                        <span>⭐ {official.rating}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {topOfficials.length === 0 && (
                <p className="text-center text-gray-400 py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ⚡ Live Activity
            </h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {recentActivity.map((activity, index) => {
                const icons = {
                  complaint_submitted: '📋',
                  complaint_resolved: '✅',
                  status_updated: '🔄'
                };
                const severityDot = {
                  low: 'bg-green-500',
                  medium: 'bg-amber-500',
                  high: 'bg-orange-500',
                  critical: 'bg-red-500 animate-pulse'
                };
                
                return (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{icons[activity.type] || '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${severityDot[activity.severity] || 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-500">{activity.location}</span>
                          <span className="text-xs text-gray-400 ml-auto">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-400 py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    const Toggle = ({ sKey, label, description }) => (
      <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
        <div>
          <p className="font-medium text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <button
          onClick={() => updateSetting(sKey, !settings[sKey])}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings[sKey] ? 'bg-teal' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[sKey] ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
    );

    const handleExportData = () => {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        complaints,
        activityFeed,
        officials,
        stats,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `praja-admin-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dashboard data exported!');
    };

    const handleClearCache = () => {
      localStorage.removeItem('praja_demo_complaints');
      localStorage.removeItem('praja_demo_notifications');
      setComplaints([]);
      setActivityFeed([]);
      setBellUnread(0);
      toast.success('Demo cache cleared. Refresh to load live data.');
    };

    return (
      <div className="max-w-2xl space-y-6">
        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <Bell size={18} className="text-teal" /> Notification Preferences
          </h3>
          <p className="text-xs text-gray-500 mb-4">Control which events trigger alerts and appear in the activity feed</p>
          <Toggle sKey="newComplaintAlerts" label="New Complaint Submitted"
            description="Show when a citizen submits a new complaint" />
          <Toggle sKey="escalationAlerts" label="Complaint Escalated"
            description="Alert when a complaint is escalated by a citizen" />
          <Toggle sKey="officialUpdateAlerts" label="Official Status Updates"
            description="Show when an official changes the status of a complaint" />
        </div>

        {/* Dashboard Behaviour */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <RefreshCw size={18} className="text-teal" /> Dashboard Behaviour
          </h3>
          <p className="text-xs text-gray-500 mb-4">Control how the portal fetches and displays data</p>
          <Toggle sKey="autoRefresh" label="Auto-refresh (every 15 s)"
            description="Automatically poll for new complaints and status updates" />
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Download size={18} className="text-teal" /> Data Management
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Export Dashboard Data</p>
                <p className="text-xs text-gray-500">Download complaints + activity as JSON</p>
              </div>
            </button>
            <button
              onClick={handleClearCache}
              className="w-full flex items-center gap-3 p-3 border border-red-100 rounded-lg hover:bg-red-50 text-left transition-colors"
            >
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Clear Demo Cache</p>
                <p className="text-xs text-gray-500">Remove locally-stored demo complaints &amp; notifications</p>
              </div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-teal" /> System Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Activity Feed</span>
              <span className="font-medium text-green-600">{activityFeed.length} events tracked</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Demo Complaints</span>
              <span className="font-medium text-blue-600">{loadAdminDemoComplaints().length} stored locally</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Demo Notifications</span>
              <span className="font-medium text-purple-600">{loadDemoNotifs().length} stored locally</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Auto-refresh</span>
              <span className={`font-medium ${settings.autoRefresh ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.autoRefresh ? 'Active (15 s)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal" /> Admin Account
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xl">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.name || 'Admin'}</p>
              <p className="text-sm text-gray-500">{user?.email || user?.phone || ''}</p>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Administrator</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{complaints.length}</p>
              <p className="text-xs text-gray-500">Total Complaints</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {complaints.filter(c => ['resolved', 'Resolved', 'closed', 'Closed'].includes(c.status)).length}
              </p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{officials.length}</p>
              <p className="text-xs text-gray-500">Officials</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white text-lg">⚙️</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Admin Panel</h1>
              <p className="text-xs text-gray-500">PRAJA Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-teal text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.id === 'complaints' && escalatedCount > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {escalatedCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 capitalize">{activeTab.replace('_', ' ')}</h2>
            <p className="text-sm text-gray-500">Welcome back, {user?.name || 'Admin'}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { fetchData(); setBellUnread(0); }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh data"
            >
              <RefreshCw size={20} />
            </button>
            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => { setShowBell(v => !v); setBellUnread(0); }}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Bell size={22} />
                {(bellUnread + escalatedCount) > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {bellUnread + escalatedCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showBell && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm">Recent Updates</span>
                      <span className="text-xs text-gray-400">{activityFeed.length} events</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {activityFeed.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">No recent activity</div>
                      ) : activityFeed.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-start gap-2">
                            <span className="text-base">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{item.message}</p>
                              {item.detail && <p className="text-xs text-gray-400 truncate">{item.detail}</p>}
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 text-center">
                      <button
                        onClick={() => { setShowBell(false); setActiveTab('dashboard'); }}
                        className="text-xs text-teal hover:underline"
                      >
                        View full activity feed
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-semibold">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-teal border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'complaints' && renderComplaints()}
              {activeTab === 'officials' && renderOfficials()}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && selectedComplaint && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h3 className="font-bold text-lg">{selectedComplaint.grv_id || selectedComplaint.complaintId}</h3>
                  <p className="text-sm text-gray-500">Complaint Assignment</p>
                </div>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Complaint Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Complaint Details</h4>
                  
                  {selectedComplaint.photo && (
                    <img 
                      src={selectedComplaint.photo} 
                      alt="Complaint" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  )}
                  
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[selectedComplaint.status] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedComplaint.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      severityColors[selectedComplaint.aiVerification?.severity || selectedComplaint.priority] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {(selectedComplaint.aiVerification?.severity || selectedComplaint.priority || 'medium').toUpperCase()}
                    </span>
                    {selectedComplaint.isEscalated && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                        🚨 ESCALATED
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{selectedComplaint.categoryLabel}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-700">{selectedComplaint.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin size={14} />
                      {selectedComplaint.location?.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedComplaint.location?.city}, {selectedComplaint.location?.state}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Submitted By</p>
                      <p className="font-medium">
                        {typeof selectedComplaint.user === 'object' 
                          ? selectedComplaint.user.name 
                          : 'Citizen'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted On</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(selectedComplaint.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedComplaint.aiVerification && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-800 mb-2">AI Analysis</p>
                      <p className="text-sm text-blue-700">
                        Confidence: {(selectedComplaint.aiVerification.confidence * 100).toFixed(0)}%
                      </p>
                      {selectedComplaint.aiVerification.aiNotes && (
                        <p className="text-sm text-blue-600 mt-1">
                          {selectedComplaint.aiVerification.aiNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Escalation Details */}
                  {selectedComplaint.isEscalated && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-semibold text-orange-800 mb-2">🚨 Escalation Details</p>
                      <p className="text-sm text-orange-700">
                        <strong>Reason:</strong> {selectedComplaint.escalationReason}
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        <strong>Status:</strong> {selectedComplaint.escalationStatus || 'Pending'}
                      </p>
                      {selectedComplaint.escalationRemarks && (
                        <p className="text-sm text-orange-600 mt-1">
                          <strong>Remarks:</strong> {selectedComplaint.escalationRemarks}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side - Assignment Form */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">
                    {selectedComplaint.isEscalated ? 'Escalation Resolution' : 'Assignment & Status Update'}
                  </h4>

                  {/* Admin Direct Status Update (always visible) */}
                  {!selectedComplaint.isEscalated && (
                    <div className="p-3 bg-teal/5 border border-teal/20 rounded-xl space-y-2">
                      <p className="text-xs font-semibold text-teal uppercase tracking-wide">Admin Status Override</p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label: 'Pending',      value: 'pending',          cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                          { label: 'Acknowledge',  value: 'acknowledged',     cls: 'bg-blue-100 text-blue-700 border-blue-200' },
                          { label: 'In Progress',  value: 'in_progress',      cls: 'bg-orange-100 text-orange-700 border-orange-200' },
                          { label: 'Inspecting',   value: 'under_inspection', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
                          { label: 'Scheduled',    value: 'work_scheduled',   cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                          { label: 'Resolved',     value: 'resolved',         cls: 'bg-green-100 text-green-700 border-green-200' },
                          { label: 'Rejected',     value: 'rejected',         cls: 'bg-red-100 text-red-700 border-red-200' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            disabled={selectedComplaint.status === opt.value}
                            onClick={() => handleAdminStatusUpdate(selectedComplaint._id, opt.value)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-opacity ${opt.cls} ${selectedComplaint.status === opt.value ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400">Current: <span className="font-semibold">{selectedComplaint.status}</span></p>
                    </div>
                  )}

                  {!selectedComplaint.isEscalated ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={assignmentForm.department}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value, officialId: '' }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-teal"
                        >
                          <option value="">Select Department</option>
                          {DEPT_KEYS.map((key) => (
                            <option key={key} value={key}>{deptLabel(key)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign to Official
                        </label>
                        <select
                          value={assignmentForm.officialId}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, officialId: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-teal"
                        >
                          <option value="">Select Official (Optional)</option>
                          {officials
                            .filter(o => !assignmentForm.department || o.department === assignmentForm.department)
                            .map((official) => (
                              <option key={official._id} value={official._id}>
                                {official.name} — {deptLabel(official.department)} ({official.activeComplaints || 0} active)
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assignment Note (Optional)
                        </label>
                        <textarea
                          value={assignmentForm.note}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, note: e.target.value }))}
                          placeholder="Add instructions for the official..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-teal h-24 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority Override
                        </label>
                        <div className="flex gap-2">
                          {['low', 'medium', 'high', 'critical'].map((priority) => (
                            <button
                              key={priority}
                              onClick={() => setAssignmentForm(prev => ({ 
                                ...prev, 
                                priorityOverride: prev.priorityOverride === priority ? null : priority 
                              }))}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                assignmentForm.priorityOverride === priority
                                  ? priority === 'low' ? 'bg-green-500 text-white' :
                                    priority === 'medium' ? 'bg-amber-500 text-white' :
                                    priority === 'high' ? 'bg-orange-500 text-white' :
                                    'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Current: {(selectedComplaint.aiVerification?.severity || selectedComplaint.priority || 'medium').toUpperCase()}
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Escalation Resolution Form */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Escalation Status
                        </label>
                        <select
                          value={assignmentForm.escalationStatus || selectedComplaint.escalationStatus || 'Pending'}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, escalationStatus: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-teal"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Final Resolution">Final Resolution</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Resolution Remarks <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={assignmentForm.escalationRemarks || ''}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, escalationRemarks: e.target.value }))}
                          placeholder="Provide detailed resolution remarks..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-teal h-32 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button 
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignmentForm({ officialId: '', department: '', note: '', priorityOverride: null });
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                {selectedComplaint.isEscalated ? (
                  <button 
                    onClick={() => handleResolveEscalation(
                      selectedComplaint._id, 
                      assignmentForm.escalationRemarks,
                      assignmentForm.escalationStatus || 'Under Review'
                    )}
                    disabled={!assignmentForm.escalationRemarks}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Submit Resolution
                  </button>
                ) : (
                  <button 
                    onClick={handleAssignComplaint}
                    disabled={!assignmentForm.department}
                    className="px-6 py-3 bg-teal text-white rounded-xl font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowUpRight size={18} />
                    Assign Complaint
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
