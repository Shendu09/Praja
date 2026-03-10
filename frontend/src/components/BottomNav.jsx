import { useEffect } from 'react';
import { Home, Bell, ClipboardList, User, Plus } from 'lucide-react';
import { useUIStore, useAuthStore, useNotificationsStore } from '../store';

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'complaints', icon: ClipboardList, label: 'Complaints' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, setScreen, setShowAuthModal } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();

  // Poll notifications every 15s so the badge stays live
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleTabClick = (tabId) => {
    if ((tabId === 'notifications' || tabId === 'complaints' || tabId === 'profile') && !isAuthenticated) {
      setShowAuthModal(true, 'login');
      return;
    }
    setActiveTab(tabId);
  };

  const handleFabClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true, 'login');
      return;
    }
    setScreen('category');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-around px-2 py-2 pb-4 z-50 shadow-[0_-4px_20px_rgba(79,70,229,0.3)]">
      {/* First two tabs */}
      {tabs.slice(0, 2).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === 'notifications' && unreadCount > 0;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex flex-col items-center gap-0.5 min-w-[56px] px-2 py-1 transition-all duration-200 border-b-2 ${
              isActive ? 'text-white border-white' : 'text-white/70 border-transparent'
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {showBadge && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">{tab.label}</span>
          </button>
        );
      })}

      {/* FAB Button */}
      <button
        onClick={handleFabClick}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white text-white flex items-center justify-center shadow-xl -mt-10 transition-all hover:scale-110 active:scale-95"
      >
        <Plus size={30} strokeWidth={2.5} />
      </button>

      {/* Last two tabs */}
      {tabs.slice(2).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center gap-0.5 min-w-[56px] px-2 py-1 transition-all duration-200 border-b-2 ${
              isActive ? 'text-white border-white' : 'text-white/70 border-transparent'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
