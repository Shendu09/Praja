import { useState, useEffect } from 'react';
import { FileText, CheckCircle, RefreshCw } from 'lucide-react';
import TealHeader from '../TealHeader';
import { useNotificationsStore } from '../../store';

export default function NotificationsScreen() {
  const [tab, setTab] = useState('unread');
  const { notifications, unreadCount, fetchNotifications, isLoading, markAllAsRead, markAsRead } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
    // Poll every 8 s so official updates appear faster
    const interval = setInterval(() => fetchNotifications(), 8000);
    // Also re-fetch when tab becomes visible again (user switches back from official portal)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNotifications(); };
    document.addEventListener('visibilitychange', onVisible);
    // Re-fetch on localStorage change (official wrote a demo notification in another tab)
    const onStorage = (e) => { if (e.key === 'praja_demo_notifications') fetchNotifications(); };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const filteredNotifications = tab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.isRead);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setTab('read');
  };

  const handleTap = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  const getIcon = (type) => {
    if (type === 'complaint_resolved') return <CheckCircle size={20} className="text-green-500" />;
    if (type === 'complaint_update') return <RefreshCw size={20} className="text-blue-500" />;
    return <FileText size={20} className="text-teal" />;
  };

  const getIconBg = (type) => {
    if (type === 'complaint_resolved') return 'bg-green-100';
    if (type === 'complaint_update') return 'bg-blue-100';
    return 'bg-teal-100';
  };

  return (
    <div className="flex-1 flex flex-col">
      <TealHeader title="Notifications" />

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 gap-1.5 mx-3.5 mt-2.5 rounded-xl">
        {['unread', 'read'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg border-none font-semibold text-sm cursor-pointer transition-all ${
              tab === t ? 'bg-teal text-white' : 'bg-transparent text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t === 'unread' ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'Previously read'}
          </button>
        ))}
      </div>

      {/* Mark all as read */}
      {tab === 'unread' && unreadCount > 0 && (
        <button
          onClick={handleMarkAllRead}
          className="mx-3.5 mt-2 text-sm text-teal font-semibold text-right hover:underline"
        >
          Mark all as read
        </button>
      )}

      {/* Notifications List or Empty State */}
      {isLoading && notifications.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal border-t-transparent rounded-full" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="flex-1 overflow-y-auto pb-20 mt-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleTap(notification)}
              className={`mx-3.5 mb-2 p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform ${
                notification.isRead ? 'bg-white' : 'bg-teal-50 border-l-4 border-teal'
              } shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">
                    {notification.title}
                  </div>
                  <div className="text-gray-500 text-xs mt-1 leading-relaxed">
                    {notification.message}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-2">
                    {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-teal mt-1 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3.5 text-gray-400 pb-20">
          <div className="text-7xl opacity-40">📄</div>
          <div className="text-[15px] font-semibold text-gray-400">
            No {tab === 'unread' ? 'unread ' : ''}notifications
          </div>
        </div>
      )}
    </div>
  );
}
