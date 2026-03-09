import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ThumbsUp, MapPin, Clock, AlertTriangle, CheckCircle2, 
  Flame, Trophy, Medal, Star, TrendingUp, Users, Filter, ChevronRight,
  MessageCircle, Share2, Flag, Eye, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Demo complaints with upvotes
const demoComplaints = [
  {
    id: 'CMP001',
    title: 'Large Pothole on Main Road',
    category: 'Road',
    description: 'Deep pothole causing accidents near bus stop. Multiple vehicles damaged.',
    location: 'Main Road, Sector 5',
    coords: { lat: 17.385, lng: 78.486 },
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
    status: 'in-progress',
    priority: 'high',
    upvotes: 47,
    comments: 12,
    views: 234,
    reportedBy: 'Rahul S.',
    reportedAt: '2 days ago',
    aiCategory: 'Infrastructure - Road Damage',
    aiSeverity: 'High',
    hasUpvoted: false,
  },
  {
    id: 'CMP002',
    title: 'Garbage Dump Overflowing',
    category: 'Sanitation',
    description: 'Public garbage bin not cleared for a week. Causing health hazard.',
    location: 'Market Square, Ward 12',
    coords: { lat: 17.390, lng: 78.490 },
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    status: 'pending',
    priority: 'high',
    upvotes: 32,
    comments: 8,
    views: 156,
    reportedBy: 'Priya K.',
    reportedAt: '1 day ago',
    aiCategory: 'Sanitation - Waste Management',
    aiSeverity: 'High',
    hasUpvoted: false,
  },
  {
    id: 'CMP003',
    title: 'Street Light Not Working',
    category: 'Electricity',
    description: 'Street light pole damaged. Area completely dark at night.',
    location: 'Colony Road, Sector 8',
    coords: { lat: 17.382, lng: 78.482 },
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    status: 'pending',
    priority: 'medium',
    upvotes: 18,
    comments: 5,
    views: 89,
    reportedBy: 'Amit V.',
    reportedAt: '3 days ago',
    aiCategory: 'Electricity - Street Lighting',
    aiSeverity: 'Medium',
    hasUpvoted: false,
  },
  {
    id: 'CMP004',
    title: 'Water Pipeline Leaking',
    category: 'Water',
    description: 'Major water leak from underground pipeline. Water wastage ongoing.',
    location: 'Hospital Road, Ward 5',
    coords: { lat: 17.388, lng: 78.485 },
    image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400',
    status: 'in-progress',
    priority: 'high',
    upvotes: 56,
    comments: 15,
    views: 312,
    reportedBy: 'Sunita M.',
    reportedAt: '4 days ago',
    aiCategory: 'Water Supply - Pipeline Damage',
    aiSeverity: 'Critical',
    hasUpvoted: true,
  },
];

// Leaderboard data
const leaderboardData = [
  { rank: 1, name: 'Rajesh Kumar', xp: 2450, complaints: 34, badge: '🏆', level: 'Civic Champion' },
  { rank: 2, name: 'Priya Sharma', xp: 2180, complaints: 28, badge: '🥈', level: 'Guardian' },
  { rank: 3, name: 'Amit Patel', xp: 1920, complaints: 25, badge: '🥉', level: 'Protector' },
  { rank: 4, name: 'Sunita Devi', xp: 1650, complaints: 22, badge: '⭐', level: 'Advocate' },
  { rank: 5, name: 'Mohammed Ali', xp: 1420, complaints: 18, badge: '⭐', level: 'Advocate' },
  { rank: 6, name: 'Lakshmi N.', xp: 1280, complaints: 16, badge: '🌟', level: 'Contributor' },
  { rank: 7, name: 'Venkat R.', xp: 1150, complaints: 14, badge: '🌟', level: 'Contributor' },
  { rank: 8, name: 'Deepa S.', xp: 980, complaints: 12, badge: '💫', level: 'Active Citizen' },
];

export default function CommunityScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('trending'); // trending, nearby, leaderboard
  const [complaints, setComplaints] = useState(demoComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filter, setFilter] = useState('all');

  // Handle upvote
  const handleUpvote = (id) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        const newUpvoted = !c.hasUpvoted;
        toast.success(newUpvoted ? '+5 XP for supporting!' : 'Support removed');
        return {
          ...c,
          hasUpvoted: newUpvoted,
          upvotes: newUpvoted ? c.upvotes + 1 : c.upvotes - 1
        };
      }
      return c;
    }));
  };

  // Sort complaints
  const sortedComplaints = [...complaints].sort((a, b) => {
    if (activeTab === 'trending') return b.upvotes - a.upvotes;
    return 0;
  });

  const filteredComplaints = filter === 'all' 
    ? sortedComplaints 
    : sortedComplaints.filter(c => c.status === filter);

  // Status badge
  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
    };
    const icons = {
      pending: <Clock size={12} />,
      'in-progress': <Zap size={12} />,
      resolved: <CheckCircle2 size={12} />,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${styles[status]}`}>
        {icons[status]} {status.replace('-', ' ')}
      </span>
    );
  };

  // Priority badge
  const PriorityBadge = ({ priority }) => {
    const styles = {
      high: 'text-red-600',
      medium: 'text-amber-600',
      low: 'text-green-600',
    };
    return priority === 'high' ? (
      <span className={`flex items-center gap-1 text-xs font-medium ${styles[priority]}`}>
        <Flame size={14} /> Urgent
      </span>
    ) : null;
  };

  // Render complaint card
  const ComplaintCard = ({ complaint }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-200">
        <img src={complaint.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={complaint.status} />
        </div>
        <div className="absolute top-3 right-3">
          <PriorityBadge priority={complaint.priority} />
        </div>
        {/* AI Tag */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
          <Zap size={12} className="text-yellow-400" /> AI: {complaint.aiSeverity}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 line-clamp-1">{complaint.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{complaint.description}</p>
        
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <MapPin size={14} />
          <span className="line-clamp-1">{complaint.location}</span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            {/* Upvote button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleUpvote(complaint.id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                complaint.hasUpvoted 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              <ThumbsUp size={16} className={complaint.hasUpvoted ? 'fill-indigo-600' : ''} />
              <span className="font-semibold">{complaint.upvotes}</span>
            </button>
            
            <span className="flex items-center gap-1 text-gray-400 text-sm">
              <MessageCircle size={14} /> {complaint.comments}
            </span>
            <span className="flex items-center gap-1 text-gray-400 text-sm">
              <Eye size={14} /> {complaint.views}
            </span>
          </div>
          
          <button
            onClick={() => setSelectedComplaint(complaint)}
            className="text-indigo-600 font-medium text-sm flex items-center gap-1 hover:underline"
          >
            Details <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Render leaderboard
  const renderLeaderboard = () => (
    <div className="p-4 space-y-4">
      {/* Your rank */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Your Rank</p>
            <p className="text-3xl font-bold">#12</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Total XP</p>
            <p className="text-3xl font-bold">850</p>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div className="bg-white rounded-full h-2 w-3/4"></div>
        </div>
        <p className="text-xs text-white/70 mt-2">150 XP to reach Active Citizen level</p>
      </div>

      {/* Leaderboard list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            Civic Heroes Leaderboard
          </h3>
          <p className="text-sm text-gray-500">Top contributors this month</p>
        </div>
        
        <div className="divide-y">
          {leaderboardData.map((user) => (
            <div key={user.rank} className={`p-4 flex items-center gap-4 ${user.rank <= 3 ? 'bg-amber-50/50' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                user.rank === 1 ? 'bg-amber-400 text-white' :
                user.rank === 2 ? 'bg-gray-300 text-white' :
                user.rank === 3 ? 'bg-amber-600 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {user.rank <= 3 ? user.badge : user.rank}
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.level} • {user.complaints} reports</p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-indigo-600">{user.xp.toLocaleString()}</p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to earn XP */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
        <h4 className="font-bold text-emerald-800 mb-3">💡 How to Earn XP</h4>
        <div className="space-y-2 text-sm text-emerald-700">
          <div className="flex justify-between"><span>Report a complaint</span><span className="font-bold">+20 XP</span></div>
          <div className="flex justify-between"><span>Rate a public service</span><span className="font-bold">+10 XP</span></div>
          <div className="flex justify-between"><span>Upvote an issue</span><span className="font-bold">+5 XP</span></div>
          <div className="flex justify-between"><span>Complaint gets resolved</span><span className="font-bold">+50 XP</span></div>
          <div className="flex justify-between"><span>Complete civic quiz</span><span className="font-bold">+15 XP</span></div>
        </div>
      </div>
    </div>
  );

  // Render complaint detail
  const renderComplaintDetail = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto"
    >
      {/* Header image */}
      <div className="relative h-64">
        <img src={selectedComplaint.image} alt="" className="w-full h-full object-cover" />
        <button
          onClick={() => setSelectedComplaint(null)}
          className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <StatusBadge status={selectedComplaint.status} />
          <PriorityBadge priority={selectedComplaint.priority} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{selectedComplaint.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <MapPin size={16} />
            {selectedComplaint.location}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-800 flex items-center gap-2">
            <Zap className="text-purple-500" size={18} /> AI Analysis
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="font-medium text-gray-800">{selectedComplaint.aiCategory}</p>
            </div>
            <div>
              <span className="text-gray-500">Severity:</span>
              <p className={`font-medium ${
                selectedComplaint.aiSeverity === 'Critical' ? 'text-red-600' :
                selectedComplaint.aiSeverity === 'High' ? 'text-orange-600' :
                'text-amber-600'
              }`}>{selectedComplaint.aiSeverity}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
          <p className="text-gray-600">{selectedComplaint.description}</p>
        </div>

        {/* Reporter */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
            {selectedComplaint.reportedBy.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{selectedComplaint.reportedBy}</p>
            <p className="text-sm text-gray-500">Reported {selectedComplaint.reportedAt}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{selectedComplaint.upvotes}</p>
            <p className="text-xs text-gray-500">Upvotes</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{selectedComplaint.comments}</p>
            <p className="text-xs text-gray-500">Comments</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{selectedComplaint.views}</p>
            <p className="text-xs text-gray-500">Views</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleUpvote(selectedComplaint.id)}
            className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
              selectedComplaint.hasUpvoted
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            <ThumbsUp size={20} className={selectedComplaint.hasUpvoted ? 'fill-white' : ''} />
            {selectedComplaint.hasUpvoted ? 'Supported' : 'Support This Issue'}
          </button>
          <button className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600">
            <Share2 size={20} />
          </button>
        </div>

        {/* Duplicate warning demo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={18} /> Similar Issue Nearby
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            2 similar complaints found within 100m radius. Consider supporting existing reports instead of creating duplicates.
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Community Hub</h1>
            <p className="text-xs text-white/70">Support issues that matter to you</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'nearby', label: 'Nearby', icon: MapPin },
            { id: 'leaderboard', label: 'Leaders', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'leaderboard' ? (
          renderLeaderboard()
        ) : (
          <>
            {/* Filter */}
            <div className="p-4 flex gap-2 overflow-x-auto hide-scrollbar">
              {['all', 'pending', 'in-progress', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {f === 'all' ? 'All Issues' : f.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Complaints grid */}
            <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && renderComplaintDetail()}
      </AnimatePresence>
    </div>
  );
}
