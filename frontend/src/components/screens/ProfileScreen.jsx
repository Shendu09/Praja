import { ChevronRight, FileText, Settings, HelpCircle, Info, LogOut, Users } from 'lucide-react';
import TealHeader from '../TealHeader';
import { useAuthStore, useUIStore } from '../../store';
import toast from 'react-hot-toast';

const menuItems = [
  { icon: FileText, label: 'My Complaints', screen: 'complaints' },
  { icon: Settings, label: 'Settings', screen: 'settings' },
  { icon: HelpCircle, label: 'Help & Support', screen: 'help' },
  { icon: Info, label: 'About App', screen: null },
];

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { setScreen, setActiveTab, setShowAuthModal, requestSwitchRole } = useUIStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    requestSwitchRole(); // Go back to role selection
  };

  const handleSwitchRole = () => {
    logout();
    toast('Switching role...', { icon: '🔄' });
    requestSwitchRole();
  };

  const handleMenuClick = (screen) => {
    if (screen) {
      setScreen(screen);
      setActiveTab(screen);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col">
        <TealHeader title="Profile" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 pb-20">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-5xl mb-4">
            👤
          </div>
          <h3 className="font-bold text-lg text-gray-700">Welcome to PRAJA</h3>
          <p className="text-gray-500 text-sm text-center mt-2 mb-6">
            Login or register to track your complaints and earn rewards
          </p>
          <button
            onClick={() => setShowAuthModal(true, 'login')}
            className="px-8 py-3 bg-teal text-white rounded-full font-semibold hover:bg-teal-600 transition-colors"
          >
            Login / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TealHeader title="Profile" />

      <div className="flex-1 p-5 flex flex-col gap-4 pb-20 overflow-y-auto">
        {/* Avatar Card */}
        <div className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal flex items-center justify-center text-3xl text-white">
            {user?.name?.charAt(0).toUpperCase() || '👤'}
          </div>
          <div>
            <div className="font-extrabold text-[17px] text-gray-800">
              {user?.name || 'Active Citizen'}
            </div>
            <div className="text-gray-500 text-sm">
              {user?.email || 'citizen@praja.gov.in'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          {[
            { value: user?.complaintsPosted || 0, label: 'Complaints\nPosted' },
            { value: user?.complaintsResolved || 0, label: 'Resolved' },
            { value: `⭐ ${user?.points || 0}`, label: 'Points' },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex-1 bg-white rounded-xl p-4 text-center shadow-sm"
            >
              <div className="font-extrabold text-xl text-teal">{stat.value}</div>
              <div className="text-[11px] text-gray-500 whitespace-pre-line leading-tight mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        {menuItems.map(({ icon: Icon, label, screen }, i) => (
          <div
            key={i}
            onClick={() => handleMenuClick(screen)}
            className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-gray-500" />
              <span className="font-semibold text-gray-800">{label}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        ))}

        {/* Switch Role */}
        <div
          onClick={handleSwitchRole}
          className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-blue-500" />
            <span className="font-semibold text-blue-600">Switch Role</span>
          </div>
          <ChevronRight size={18} className="text-blue-400" />
        </div>

        {/* Logout */}
        <div
          onClick={handleLogout}
          className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut size={20} className="text-red-400" />
            <span className="font-semibold text-red-400">Logout</span>
          </div>
          <ChevronRight size={18} className="text-red-300" />
        </div>
      </div>
    </div>
  );
}
