import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, 
  LogOut, Bell, Search, Filter, ChevronDown, CheckCircle,
  Clock, AlertTriangle, TrendingUp, Building2, MapPin,
  Eye, UserPlus, Trash2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'complaints', label: 'All Complaints', icon: FileText },
  { id: 'assign', label: 'Assign Complaints', icon: UserPlus },
  { id: 'officials', label: 'Manage Officials', icon: Users },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const departments = [
  { id: 'sanitation', name: 'Sanitation', color: 'bg-green-500' },
  { id: 'roads', name: 'Roads & Infrastructure', color: 'bg-orange-500' },
  { id: 'water', name: 'Water Supply', color: 'bg-blue-500' },
  { id: 'electricity', name: 'Electricity', color: 'bg-yellow-500' },
  { id: 'health', name: 'Public Health', color: 'bg-red-500' },
  { id: 'environment', name: 'Environment', color: 'bg-teal-500' },
];

export default function AdminPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get('/complaints?limit=100'),
        api.get('/complaints/stats'),
      ]);
      setComplaints(complaintsRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data for demo
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

  const handleAssignComplaint = async (complaintId, department, officerId) => {
    try {
      await api.patch(`/complaints/${complaintId}/assign`, {
        department,
        assignedTo: officerId,
      });
      toast.success('Complaint assigned successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign complaint');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
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
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Complaints" 
          value={stats?.total || 0} 
          icon={FileText} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Pending" 
          value={stats?.pending || 0} 
          icon={Clock} 
          color="bg-yellow-500"
          trend="+12% from yesterday"
        />
        <StatCard 
          title="In Progress" 
          value={stats?.inProgress || 0} 
          icon={AlertTriangle} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Resolved" 
          value={stats?.resolved || 0} 
          icon={CheckCircle} 
          color="bg-green-500"
          trend="85% resolution rate"
        />
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Complaints</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {complaints.slice(0, 5).map((complaint) => (
            <div key={complaint._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  complaint.status === 'resolved' ? 'bg-green-500' :
                  complaint.status === 'in_progress' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-800">{complaint.complaintId}</p>
                  <p className="text-sm text-gray-500">{complaint.categoryLabel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{complaint.location?.city}</p>
                <p className="text-xs text-gray-400">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Department Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="text-center p-4 rounded-xl bg-gray-50">
              <div className={`w-10 h-10 ${dept.color} rounded-full mx-auto mb-2`} />
              <p className="text-sm font-medium text-gray-800">{dept.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.floor(Math.random() * 20) + 5} active
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComplaints = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search complaints..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {complaints
              .filter(c => filterStatus === 'all' || c.status === filterStatus)
              .map((complaint) => (
                <tr key={complaint._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-teal">{complaint.complaintId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{complaint.categoryLabel}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{complaint.location?.city || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      complaint.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {complaint.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${
                      complaint.priority === 'high' ? 'text-red-600' :
                      complaint.priority === 'medium' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {complaint.priority?.toUpperCase() || 'NORMAL'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedComplaint(complaint)}
                        className="p-1.5 text-gray-400 hover:text-teal hover:bg-teal-50 rounded"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAssign = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Unassigned Complaints</h3>
        <div className="space-y-3">
          {complaints
            .filter(c => c.status === 'pending' && !c.assignedTo)
            .slice(0, 10)
            .map((complaint) => (
              <div 
                key={complaint._id}
                className="p-4 border border-gray-200 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800">{complaint.complaintId}</p>
                  <p className="text-sm text-gray-500">{complaint.categoryLabel}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} />
                    {complaint.location?.address?.slice(0, 50)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal"
                    onChange={(e) => handleAssignComplaint(complaint._id, e.target.value, null)}
                    defaultValue=""
                  >
                    <option value="" disabled>Assign to Dept</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          {complaints.filter(c => c.status === 'pending' && !c.assignedTo).length === 0 && (
            <p className="text-center text-gray-500 py-8">No unassigned complaints</p>
          )}
        </div>
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
        <p className="text-center text-gray-500 py-8">
          Official management functionality will be added here.
        </p>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    // Demo data for analytics
    const categoryData = [
      { name: 'Sanitation', count: 45, color: 'bg-green-500' },
      { name: 'Roads', count: 38, color: 'bg-orange-500' },
      { name: 'Water', count: 28, color: 'bg-blue-500' },
      { name: 'Electricity', count: 22, color: 'bg-yellow-500' },
      { name: 'Health', count: 15, color: 'bg-red-500' },
      { name: 'Others', count: 8, color: 'bg-gray-500' },
    ];

    const wardPerformance = [
      { ward: 'Ward 1', resolved: 85, pending: 12, avg: '2.3 days' },
      { ward: 'Ward 2', resolved: 72, pending: 18, avg: '3.1 days' },
      { ward: 'Ward 3', resolved: 91, pending: 8, avg: '1.8 days' },
      { ward: 'Ward 4', resolved: 65, pending: 25, avg: '4.2 days' },
      { ward: 'Ward 5', resolved: 78, pending: 15, avg: '2.9 days' },
    ];

    const heatmapZones = [
      { zone: 'Sector 5 - Main Road', issues: 23, type: 'Pothole', recurring: true },
      { zone: 'Ward 12 - Market', issues: 18, type: 'Garbage', recurring: true },
      { zone: 'Colony Area', issues: 12, type: 'Street Light', recurring: false },
      { zone: 'Bus Stand', issues: 15, type: 'Drainage', recurring: true },
    ];

    const maxCount = Math.max(...categoryData.map(d => d.count));

    return (
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
            <p className="text-white/70 text-sm">Avg Resolution Time</p>
            <p className="text-3xl font-bold">2.4 days</p>
            <p className="text-xs text-green-300 mt-2">↓ 18% from last month</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
            <p className="text-white/70 text-sm">Citizen Satisfaction</p>
            <p className="text-3xl font-bold">87%</p>
            <p className="text-xs text-green-300 mt-2">↑ 5% from last month</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
            <p className="text-white/70 text-sm">SLA Compliance</p>
            <p className="text-3xl font-bold">92%</p>
            <p className="text-xs text-green-300 mt-2">Target: 95%</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-5 text-white">
            <p className="text-white/70 text-sm">Reopened Cases</p>
            <p className="text-3xl font-bold">4.2%</p>
            <p className="text-xs text-green-300 mt-2">↓ 2% from last month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Category</h3>
            <div className="space-y-3">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{cat.name}</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full flex items-center justify-end pr-2`}
                      style={{ width: `${(cat.count / maxCount) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{cat.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ward Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Ward Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-3">Ward</th>
                    <th className="pb-3">Resolved</th>
                    <th className="pb-3">Pending</th>
                    <th className="pb-3">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wardPerformance.map((ward) => (
                    <tr key={ward.ward}>
                      <td className="py-3 font-medium text-gray-800">{ward.ward}</td>
                      <td className="py-3 text-green-600">{ward.resolved}%</td>
                      <td className="py-3 text-amber-600">{ward.pending}</td>
                      <td className="py-3 text-gray-600">{ward.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Predictive Heatmap / Problem Zones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">🔥 Problem Zones (AI Predicted)</h3>
              <p className="text-sm text-gray-500">Areas with recurring issues requiring infrastructure attention</p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              Needs attention
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {heatmapZones.map((zone, i) => (
              <div 
                key={i}
                className={`p-4 rounded-xl border-2 ${
                  zone.recurring ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{zone.zone}</p>
                    <p className="text-sm text-gray-500">{zone.type}</p>
                  </div>
                  <span className="text-2xl font-bold text-red-500">{zone.issues}</span>
                </div>
                {zone.recurring && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Recurring issue - Consider infrastructure upgrade
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Escalation Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">⚠️ Auto-Escalation Queue</h3>
          <p className="text-sm text-gray-500 mb-4">Complaints exceeding 21-day SLA - Will auto-escalate to higher authority</p>
          <div className="space-y-3">
            {[
              { id: 'CMP-2024-0847', days: 24, type: 'Drainage Block', ward: 'Ward 4', escalateTo: 'District Collector' },
              { id: 'CMP-2024-0832', days: 22, type: 'Road Damage', ward: 'Ward 2', escalateTo: 'PWD Commissioner' },
              { id: 'CMP-2024-0819', days: 21, type: 'Water Leak', ward: 'Ward 5', escalateTo: 'Water Board Chief' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">{item.id}</p>
                  <p className="text-sm text-gray-500">{item.type} • {item.ward}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold">{item.days} days</p>
                  <p className="text-xs text-gray-500">→ {item.escalateTo}</p>
                </div>
              </div>
            ))}
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
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'complaints' && renderComplaints()}
          {activeTab === 'assign' && renderAssign()}
          {activeTab === 'officials' && renderOfficials()}
          {activeTab === 'departments' && renderOfficials()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl p-5">Settings coming soon...</div>
          )}
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedComplaint(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-bold text-lg">{selectedComplaint.complaintId}</h3>
            </div>
            <div className="p-5 space-y-4">
              {selectedComplaint.photo && (
                <img 
                  src={selectedComplaint.photo} 
                  alt="Complaint" 
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{selectedComplaint.categoryLabel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{selectedComplaint.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{selectedComplaint.location?.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">AI Analysis</p>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                  <p>Confidence: {(selectedComplaint.aiVerification?.confidence * 100).toFixed(0)}%</p>
                  <p>Severity: {selectedComplaint.aiVerification?.severity}</p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200">
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
