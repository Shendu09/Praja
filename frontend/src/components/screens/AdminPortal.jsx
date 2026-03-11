import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, 
  LogOut, Bell, Search, Filter, ChevronDown, CheckCircle,
  Clock, AlertTriangle, TrendingUp, Building2, MapPin,
  Eye, UserPlus, Trash2, Edit, X, User, Calendar,
  AlertCircle, ArrowUpRight, RefreshCw, Download
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

const departmentOptions = [
  'Public Works Department',
  'Water Supply Board',
  'Electricity Department',
  'Sanitation Department',
  'Municipal Corporation',
  'Transport Department',
  'Health Department',
  'Revenue Department'
];

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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get('/complaints?limit=100'),
        api.get('/complaints/stats'),
      ]);
      setComplaints(complaintsRes.data || []);
      setStats(statsRes.data || {});
      
      // Fetch officials
      try {
        const officialsRes = await adminAPI.getOfficials();
        setOfficials(officialsRes.data || []);
      } catch (e) {
        console.log('Officials fetch failed:', e);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setStats({
        total: 156,
        pending: 42,
        inProgress: 38,
        resolved: 76,
        todayNew: 12,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await adminAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (error) {
      console.error('Analytics fetch failed:', error);
      // Set demo data
      setAnalytics({
        overview: {
          totalComplaints: 156,
          resolvedComplaints: 98,
          pendingComplaints: 42,
          inProgressComplaints: 16,
          totalCitizens: 1250,
          totalOfficials: 24,
          avgResolutionDays: 2.4,
          resolutionRate: 69,
          escalatedCount: 8,
          todayNew: 12,
          todayResolved: 8
        },
        byCategory: [
          { category: 'Dirty Spot', count: 45, resolved: 30 },
          { category: 'Garbage Dump', count: 38, resolved: 28 },
          { category: 'Sewerage Overflow', count: 28, resolved: 20 },
          { category: 'Stagnant Water', count: 22, resolved: 15 },
          { category: 'Sweeping Issue', count: 15, resolved: 12 },
          { category: 'Other', count: 8, resolved: 5 }
        ],
        byStatus: [
          { status: 'Submitted', count: 22 },
          { status: 'Assigned', count: 20 },
          { status: 'In Progress', count: 16 },
          { status: 'Resolved', count: 78 },
          { status: 'Closed', count: 20 }
        ],
        bySeverity: [
          { severity: 'Low', count: 35 },
          { severity: 'Medium', count: 58 },
          { severity: 'High', count: 48 },
          { severity: 'Critical', count: 15 }
        ],
        trend: [
          { date: 'Mon', complaints: 12, resolved: 8 },
          { date: 'Tue', complaints: 18, resolved: 14 },
          { date: 'Wed', complaints: 15, resolved: 12 },
          { date: 'Thu', complaints: 22, resolved: 18 },
          { date: 'Fri', complaints: 19, resolved: 15 },
          { date: 'Sat', complaints: 8, resolved: 6 },
          { date: 'Sun', complaints: 6, resolved: 4 }
        ],
        topOfficials: [
          { name: 'Ravi Kumar', resolved: 23, pending: 4, rating: 4.8 },
          { name: 'Priya Sharma', resolved: 19, pending: 6, rating: 4.5 },
          { name: 'Arun Singh', resolved: 15, pending: 3, rating: 4.6 },
          { name: 'Sunita Devi', resolved: 12, pending: 5, rating: 4.3 },
          { name: 'Vikram Patel', resolved: 10, pending: 2, rating: 4.7 }
        ],
        recentActivity: [
          { type: 'complaint_submitted', message: 'New complaint: Garbage Dump', time: '2 mins ago', severity: 'high', location: 'Sector 5' },
          { type: 'complaint_resolved', message: 'Complaint resolved: Water leak', time: '15 mins ago', severity: 'medium', location: 'Ward 3' },
          { type: 'status_updated', message: 'Status updated: Road repair', time: '32 mins ago', severity: 'low', location: 'MG Road' },
          { type: 'complaint_submitted', message: 'New complaint: Sewerage overflow', time: '1 hour ago', severity: 'critical', location: 'Old City' }
        ]
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

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'unassigned' && (!c.assignedTo && c.status === 'Submitted')) ||
      (filterStatus === 'escalated' && c.isEscalated) ||
      c.status?.toLowerCase().replace(' ', '_') === filterStatus;
    
    const matchesSearch = !searchQuery || 
      c.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.grv_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoryLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Count unassigned and escalated
  const unassignedCount = complaints.filter(c => !c.assignedTo && c.status === 'Submitted').length;
  const escalatedCount = complaints.filter(c => c.isEscalated).length;

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

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Complaints" 
          value={stats?.total || analytics?.overview?.totalComplaints || 0} 
          icon={FileText} 
          color="bg-blue-500"
          trend={`+${analytics?.overview?.todayNew || 0} today`}
        />
        <StatCard 
          title="Pending" 
          value={stats?.pending || analytics?.overview?.pendingComplaints || 0} 
          icon={Clock} 
          color="bg-yellow-500"
        />
        <StatCard 
          title="In Progress" 
          value={stats?.inProgress || analytics?.overview?.inProgressComplaints || 0} 
          icon={AlertTriangle} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Resolved" 
          value={stats?.resolved || analytics?.overview?.resolvedComplaints || 0} 
          icon={CheckCircle} 
          color="bg-green-500"
          trend={`${analytics?.overview?.resolutionRate || 85}% rate`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Complaints</h3>
            <button 
              onClick={() => setActiveTab('complaints')}
              className="text-teal text-sm hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {complaints.slice(0, 5).map((complaint) => (
              <div 
                key={complaint._id} 
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => openAssignModal(complaint)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    complaint.status === 'Resolved' || complaint.status === 'resolved' ? 'bg-green-500' :
                    complaint.status === 'In Progress' || complaint.status === 'in_progress' ? 'bg-orange-500' :
                    complaint.isEscalated ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-800">{complaint.grv_id || complaint.complaintId}</p>
                    <p className="text-sm text-gray-500">{complaint.categoryLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    !complaint.assignedTo ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {complaint.assignedTo ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
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
    </div>
  );

  const renderComplaints = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'unassigned', label: `Unassigned (${unassignedCount})`, color: 'text-red-600' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
            { key: 'escalated', label: `🚨 Escalated (${escalatedCount})`, color: 'text-orange-600' },
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
                  {complaint.assignedDepartment || complaint.department || '—'}
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

  const renderOfficials = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Government Officials</h3>
        <button className="px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium flex items-center gap-2">
          <UserPlus size={16} />
          Add Official
        </button>
      </div>
      <div className="p-5">
        {officials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.map((official) => (
              <div key={official._id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <User size={24} className="text-teal" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{official.name}</p>
                    <p className="text-sm text-gray-500">{official.email}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Active</p>
                    <p className="font-bold text-amber-600">{official.activeComplaints || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Resolved</p>
                    <p className="font-bold text-green-600">{official.resolvedComplaints || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Rating</p>
                    <p className="font-bold text-blue-600">⭐ {official.avgRating || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No officials registered yet. Add officials to start assigning complaints.
          </p>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => {
    const data = analytics || {};
    const overview = data.overview || {};
    const byCategory = data.byCategory || [];
    const byStatus = data.byStatus || [];
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
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh data"
            >
              <RefreshCw size={20} />
            </button>
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={22} />
              {escalatedCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
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
              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl p-5">Settings coming soon...</div>
              )}
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
                    {selectedComplaint.isEscalated ? 'Escalation Resolution' : 'Assignment Details'}
                  </h4>

                  {!selectedComplaint.isEscalated ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={assignmentForm.department}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-teal"
                        >
                          <option value="">Select Department</option>
                          {departmentOptions.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
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
                            .filter(o => !assignmentForm.department || o.department === assignmentForm.department.toLowerCase())
                            .map((official) => (
                              <option key={official._id} value={official._id}>
                                {official.name} ({official.activeComplaints || 0} active)
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
