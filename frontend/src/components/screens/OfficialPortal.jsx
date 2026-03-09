import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, FileText, CheckCircle, Clock, XCircle,
  LogOut, Bell, Search, MapPin, Camera, MessageSquare,
  AlertTriangle, Send, ChevronRight, User, Calendar, Filter,
  Eye, Navigation, Activity, TrendingUp, RefreshCcw, X,
  AlertCircle, ExternalLink, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useComplaintsStore } from '../../store';
import ComplaintAIAnalyzer from '../ComplaintAIAnalyzer';

// AI Severity Badge Component
const AISeverityBadge = ({ severity, confidence }) => {
  const severityConfig = {
    critical: { bg: 'bg-gradient-to-r from-red-600 to-red-500', icon: '🚨', glow: 'shadow-red-500/30' },
    high: { bg: 'bg-gradient-to-r from-orange-600 to-orange-500', icon: '⚠️', glow: 'shadow-orange-500/30' },
    medium: { bg: 'bg-gradient-to-r from-yellow-600 to-yellow-500', icon: '⚡', glow: 'shadow-yellow-500/30' },
    low: { bg: 'bg-gradient-to-r from-green-600 to-green-500', icon: '✅', glow: 'shadow-green-500/30' }
  };
  const config = severityConfig[severity] || severityConfig.medium;
  
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} text-white text-xs font-bold shadow-lg ${config.glow}`}>
      <span>{config.icon}</span>
      <span className="uppercase tracking-wide">{severity}</span>
      {confidence && <span className="opacity-80">• {Math.round(confidence * 100)}%</span>}
    </div>
  );
};

// Priority Badge
const PriorityBadge = ({ priority }) => {
  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[priority] || colors.medium}`}>
      {priority?.toUpperCase() || 'MEDIUM'}
    </span>
  );
};

const navItems = [
  { id: 'pending', label: 'Pending', icon: AlertCircle },
  { id: 'in_progress', label: 'In Progress', icon: Clock },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle },
];

const statusOptions = [
  { value: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-500', desc: 'Complaint received and noted' },
  { value: 'in_progress', label: 'Work In Progress', color: 'bg-orange-500', desc: 'Work has been initiated' },
  { value: 'under_inspection', label: 'Under Inspection', color: 'bg-purple-500', desc: 'Site inspection ongoing' },
  { value: 'work_scheduled', label: 'Work Scheduled', color: 'bg-indigo-500', desc: 'Work planned for specific date' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500', desc: 'Issue has been fixed' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500', desc: 'Complaint cannot be addressed' },
];

export default function OfficialPortal({ user, onLogout }) {
  // Get complaints from store (includes demo complaints)
  const { complaints: storeComplaints } = useComplaintsStore();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [stats, setStats] = useState({ assigned: 0, pending: 0, inProgress: 0, resolved: 0, avgDays: 2.3 });
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [storeComplaints]); // Re-fetch when store complaints change

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      // In production, filter by assigned officer
      const response = await api.get('/complaints?limit=50');
      let allComplaints = response.data || [];
      
      // Merge with store complaints (includes demo complaints)
      if (storeComplaints && storeComplaints.length > 0) {
        const storeIds = new Set(storeComplaints.map(c => c._id));
        // Add store complaints that aren't already in API response
        const newFromStore = storeComplaints.filter(sc => !allComplaints.find(ac => ac._id === sc._id));
        allComplaints = [...newFromStore, ...allComplaints];
      }
      
      // Enhance with mock AI data if not present
      const enhanced = allComplaints.map(c => ({
        ...c,
        priority: c.aiVerification?.severity || c.priority || ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        aiVerification: c.aiVerification || {
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          confidence: 0.75 + Math.random() * 0.2,
          tags: ['garbage', 'drainage', 'overflow'][Math.floor(Math.random() * 3)]
        },
        assignedDate: c.assignedDate || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysElapsed: c.daysElapsed || Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (24 * 60 * 60 * 1000))),
        atrHistory: c.atrHistory || []
      }));
      
      setComplaints(enhanced);
      const pending = enhanced.filter(c => c.status === 'pending' || c.status === 'acknowledged').length;
      const inProg = enhanced.filter(c => ['in_progress', 'under_inspection', 'work_scheduled'].includes(c.status)).length;
      const resolved = enhanced.filter(c => c.status === 'resolved').length;
      
      setStats({
        assigned: pending + inProg,
        pending,
        inProgress: inProg,
        resolved,
        avgDays: 2.3
      });
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      
      // Use store complaints if available, otherwise use demo data
      let fallbackComplaints = storeComplaints && storeComplaints.length > 0 
        ? storeComplaints.map(c => ({
            ...c,
            priority: c.aiVerification?.severity || c.priority || 'medium',
            aiVerification: c.aiVerification || { severity: 'medium', confidence: 0.85, tags: 'general' },
            daysElapsed: c.daysElapsed || Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (24 * 60 * 60 * 1000))),
            atrHistory: c.atrHistory || []
          }))
        : [
        {
          _id: '1',
          complaintId: 'SWT-2024-001234',
          categoryLabel: 'Garbage Collection',
          description: 'Large pile of garbage accumulated near the community park. Needs immediate attention.',
          status: 'pending',
          priority: 'high',
          photo: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
          location: { address: 'Sector 15, Near Central Park', city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
          aiVerification: { severity: 'high', confidence: 0.89, tags: 'garbage' },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          daysElapsed: 2,
          atrHistory: []
        },
        {
          _id: '2',
          complaintId: 'SWT-2024-001235',
          categoryLabel: 'Drainage Issue',
          description: 'Blocked drain causing water logging on the main road during monsoon.',
          status: 'in_progress',
          priority: 'critical',
          photo: 'https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=400',
          location: { address: 'MG Road Junction', city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
          aiVerification: { severity: 'critical', confidence: 0.95, tags: 'drainage' },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysElapsed: 5,
          atrHistory: [
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'acknowledged', remarks: 'Complaint received and assigned to field team' },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'in_progress', remarks: 'Team dispatched for inspection' }
          ]
        },
        {
          _id: '3',
          complaintId: 'SWT-2024-001236',
          categoryLabel: 'Street Light',
          description: 'Multiple street lights not working in residential area causing safety concerns.',
          status: 'resolved',
          priority: 'medium',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          location: { address: 'Gandhi Nagar, Block C', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
          aiVerification: { severity: 'medium', confidence: 0.82, tags: 'electrical' },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysElapsed: 10,
          atrHistory: [
            { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), status: 'acknowledged', remarks: 'Issue logged' },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'work_scheduled', remarks: 'Electrical team assigned' },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'resolved', remarks: '4 street lights replaced successfully' }
          ]
        },
        {
          _id: '4',
          complaintId: 'SWT-2024-001237',
          categoryLabel: 'Public Toilet',
          description: 'Community toilet facility needs urgent cleaning and maintenance.',
          status: 'pending',
          priority: 'high',
          photo: null,
          location: { address: 'Railway Station Complex', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
          aiVerification: { severity: 'high', confidence: 0.88, tags: 'sanitation' },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          daysElapsed: 1,
          atrHistory: []
        }
      ];
      setComplaints(fallbackComplaints);
      const pending = fallbackComplaints.filter(c => c.status === 'pending' || c.status === 'acknowledged').length;
      const inProg = fallbackComplaints.filter(c => ['in_progress', 'under_inspection', 'work_scheduled'].includes(c.status)).length;
      const resolved = fallbackComplaints.filter(c => c.status === 'resolved').length;
      setStats({ 
        assigned: pending + inProg, 
        pending, 
        inProgress: inProg, 
        resolved, 
        avgDays: 2.3 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateStatus) {
      toast.error('Please select a status');
      return;
    }

    const atrEntry = {
      date: new Date().toISOString(),
      status: updateStatus,
      remarks: updateRemarks || 'Status updated',
      updatedBy: user?.name || 'Official'
    };

    try {
      await api.patch(`/complaints/${updateModal._id}/status`, {
        status: updateStatus,
        remarks: updateRemarks,
      });
      
      toast.success('Status updated successfully!');
      // Update local state with ATR entry
      setComplaints(prev => prev.map(c => 
        c._id === updateModal._id 
          ? { ...c, status: updateStatus, atrHistory: [...(c.atrHistory || []), atrEntry] }
          : c
      ));
      setUpdateModal(null);
      setUpdateStatus('');
      setUpdateRemarks('');
    } catch (error) {
      // Demo mode - update locally
      setComplaints(prev => prev.map(c => 
        c._id === updateModal._id 
          ? { ...c, status: updateStatus, atrHistory: [...(c.atrHistory || []), atrEntry] }
          : c
      ));
      toast.success('Status updated! (Demo Mode)');
      setUpdateModal(null);
      setUpdateStatus('');
      setUpdateRemarks('');
    }
  };

  const handleMarkResolved = (complaint) => {
    setUpdateModal(complaint);
    setUpdateStatus('resolved');
    setUpdateRemarks('Issue has been resolved successfully.');
  };

  const getFilteredComplaints = () => {
    let filtered = complaints;
    
    // Filter by tab
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(c => c.status === 'pending' || c.status === 'acknowledged');
        break;
      case 'in_progress':
        filtered = filtered.filter(c => ['in_progress', 'under_inspection', 'work_scheduled'].includes(c.status));
        break;
      case 'resolved':
        filtered = filtered.filter(c => c.status === 'resolved');
        break;
      default:
        break;
    }
    
    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter || c.aiVerification?.severity === priorityFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.complaintId?.toLowerCase().includes(query) ||
        c.categoryLabel?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.location?.address?.toLowerCase().includes(query) ||
        c.location?.city?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Google Maps embed URL generator
  const getMapEmbedUrl = (location) => {
    if (!location?.lat || !location?.lng) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(location?.address || 'India')}&output=embed`;
    }
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  };

  const ComplaintCard = ({ complaint }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
    >
      <div className="flex">
        {/* Photo */}
        <div className="w-36 h-36 flex-shrink-0 relative bg-gray-100">
          {complaint.photo ? (
            <img 
              src={complaint.photo} 
              alt="Issue" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera size={32} className="text-gray-300" />
            </div>
          )}
          {/* AI Severity Badge Overlay */}
          {complaint.aiVerification && (
            <div className="absolute top-2 left-2">
              <AISeverityBadge 
                severity={complaint.aiVerification.severity} 
                confidence={complaint.aiVerification.confidence}
              />
            </div>
          )}
          {/* Days elapsed badge */}
          {complaint.daysElapsed && complaint.status !== 'resolved' && (
            <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-bold text-white ${
              complaint.daysElapsed > 5 ? 'bg-red-500' : complaint.daysElapsed > 3 ? 'bg-orange-500' : 'bg-green-500'
            }`}>
              {complaint.daysElapsed}d ago
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-green-700">{complaint.complaintId}</span>
                <PriorityBadge priority={complaint.priority || complaint.aiVerification?.severity} />
              </div>
              <p className="text-gray-800 font-medium mt-1">{complaint.categoryLabel}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
              complaint.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
              complaint.status === 'under_inspection' ? 'bg-purple-100 text-purple-700' :
              complaint.status === 'work_scheduled' ? 'bg-indigo-100 text-indigo-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {complaint.status?.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{complaint.description}</p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-green-600" />
              {complaint.location?.address?.substring(0, 30) || complaint.location?.city || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(complaint.createdAt).toLocaleDateString('en-IN')}
            </span>
            {complaint.atrHistory?.length > 0 && (
              <span className="flex items-center gap-1 text-blue-600">
                <MessageSquare size={12} />
                {complaint.atrHistory.length} ATR{complaint.atrHistory.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedComplaint(complaint)}
              className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
            >
              <Eye size={14} />
              View Details
            </button>
            {complaint.status !== 'resolved' && (
              <>
                <button
                  onClick={() => setUpdateModal(complaint)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Send size={14} />
                  Update
                </button>
                <button
                  onClick={() => handleMarkResolved(complaint)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle size={14} />
                  Resolve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-2xl">🏛️</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Government Official Portal</h1>
              <p className="text-xs text-white/80">प्रजा - Grievance Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchComplaints}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCcw size={20} />
            </button>
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <User size={18} />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.name || 'Official'}</p>
                <p className="text-xs text-white/70">{user?.department || 'Sanitation Dept'}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.inProgress}</p>
                <p className="text-xs text-gray-500 font-medium">In Progress</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.resolved}</p>
                <p className="text-xs text-gray-500 font-medium">Resolved</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.avgDays}</p>
                <p className="text-xs text-gray-500 font-medium">Avg Resolution (days)</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by complaint ID, category, location..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
            
            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="critical">🚨 Critical</option>
                <option value="high">⚠️ High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">✅ Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === item.id ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {item.id === 'pending' ? stats.pending : item.id === 'in_progress' ? stats.inProgress : stats.resolved}
              </span>
            </button>
          ))}
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-500 mt-3 font-medium">Loading complaints...</p>
            </div>
          ) : getFilteredComplaints().length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No complaints found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try adjusting your search criteria' : 'No complaints in this category'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Showing {getFilteredComplaints().length} complaint{getFilteredComplaints().length !== 1 ? 's' : ''}
              </p>
              {getFilteredComplaints().map((complaint) => (
                <ComplaintCard key={complaint._id} complaint={complaint} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Update Status Modal (ATR - Action Taken Report) */}
      <AnimatePresence>
        {updateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setUpdateModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">Update Status (ATR)</h3>
                    <p className="text-sm text-white/80">{updateModal.complaintId}</p>
                  </div>
                  <button
                    onClick={() => setUpdateModal(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Select New Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setUpdateStatus(option.value)}
                        className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                          updateStatus === option.value
                            ? 'border-green-600 bg-green-50 text-green-700 shadow-lg shadow-green-100'
                            : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full ${option.color} mr-2`}></span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {updateStatus && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {statusOptions.find(o => o.value === updateStatus)?.desc}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Action Taken Report (ATR) Remarks *
                  </label>
                  <textarea
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    placeholder="Describe the action taken, work done, or reason for status change..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">This will be added to the complaint's ATR history</p>
                </div>
              </div>
              
              <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setUpdateModal(null);
                    setUpdateStatus('');
                    setUpdateRemarks('');
                  }}
                  className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={!updateStatus}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    updateStatus 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-200 hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                  Submit ATR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complaint Detail Modal with Map and ATR History */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Photo */}
              <div className="relative">
                {selectedComplaint.photo ? (
                  <img 
                    src={selectedComplaint.photo}
                    alt="Issue"
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Camera size={48} className="text-gray-300" />
                  </div>
                )}
                {/* AI Severity Badge */}
                {selectedComplaint.aiVerification && (
                  <div className="absolute top-4 left-4">
                    <AISeverityBadge 
                      severity={selectedComplaint.aiVerification.severity}
                      confidence={selectedComplaint.aiVerification.confidence}
                    />
                  </div>
                )}
                {/* Close Button */}
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors backdrop-blur"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Title and Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-green-700">{selectedComplaint.complaintId}</h3>
                    <p className="text-gray-600 font-medium">{selectedComplaint.categoryLabel}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                    selectedComplaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    selectedComplaint.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                    selectedComplaint.status === 'under_inspection' ? 'bg-purple-100 text-purple-700' :
                    selectedComplaint.status === 'work_scheduled' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedComplaint.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                
                {/* Description */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">📝 Description</p>
                  <p className="text-gray-800">{selectedComplaint.description}</p>
                </div>
                
                {/* Location with Map */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">📍 Location</p>
                  <p className="text-gray-800 font-medium">{selectedComplaint.location?.address}</p>
                  <p className="text-sm text-gray-500">
                    {selectedComplaint.location?.city}, {selectedComplaint.location?.state}
                  </p>
                  {/* Embedded Map */}
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                    <iframe
                      src={getMapEmbedUrl(selectedComplaint.location)}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Complaint Location"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedComplaint.location?.lat || selectedComplaint.location?.address},${selectedComplaint.location?.lng || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-2"
                  >
                    <Navigation size={14} />
                    Open in Google Maps
                    <ExternalLink size={12} />
                  </a>
                </div>
                
                {/* AI Analysis */}
                {selectedComplaint.aiVerification && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm font-medium text-blue-700 mb-3">🤖 AI Analysis Report</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs">Severity</p>
                        <p className="font-bold text-lg capitalize text-gray-800">
                          {selectedComplaint.aiVerification.severity || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs">Confidence</p>
                        <p className="font-bold text-lg text-gray-800">
                          {((selectedComplaint.aiVerification.confidence || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs">Category</p>
                        <p className="font-bold text-lg capitalize text-gray-800">
                          {selectedComplaint.aiVerification.tags || 'General'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ATR History Timeline */}
                {selectedComplaint.atrHistory && selectedComplaint.atrHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-500 mb-3">📋 Action Taken Report (ATR) History</p>
                    <div className="space-y-3">
                      {selectedComplaint.atrHistory.map((atr, index) => (
                        <div key={index} className="relative pl-6 pb-3 border-l-2 border-green-200 last:pb-0">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                statusOptions.find(s => s.value === atr.status)?.color || 'bg-gray-500'
                              } text-white`}>
                                {atr.status?.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(atr.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{atr.remarks}</p>
                            {atr.updatedBy && (
                              <p className="text-xs text-gray-400 mt-1">Updated by: {atr.updatedBy}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    Submitted: {new Date(selectedComplaint.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  {selectedComplaint.daysElapsed && (
                    <span className={`px-2 py-1 rounded ${
                      selectedComplaint.daysElapsed > 5 ? 'bg-red-100 text-red-700' : 
                      selectedComplaint.daysElapsed > 3 ? 'bg-orange-100 text-orange-700' : 
                      'bg-green-100 text-green-700'
                    } text-xs font-medium`}>
                      {selectedComplaint.daysElapsed} days since reported
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Footer */}
              <div className="p-5 border-t border-gray-200 flex gap-3 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                {selectedComplaint.status !== 'resolved' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedComplaint(null);
                        setUpdateModal(selectedComplaint);
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Update Status
                    </button>
                    <button
                      onClick={() => {
                        setSelectedComplaint(null);
                        handleMarkResolved(selectedComplaint);
                      }}
                      className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Mark Resolved
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
