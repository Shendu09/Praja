import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store';
import api from '../services/api';

const NotificationPopup = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      return;
    }

    const socketURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    const newSocket = io(socketURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io');
      // Join user's personal notification room
      newSocket.emit('join_user_room', user._id);
    });

    newSocket.on('new_notification', (notification) => {
      console.log('📬 Received notification:', notification);
      
      // Add to popup notifications (auto-dismiss after 5 seconds)
      const notifWithId = { ...notification, id: notification.id || Date.now() };
      setNotifications(prev => [...prev, notifWithId]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notifWithId.id));
      }, 5000);

      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  // Fetch unread notifications on mount
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        const unread = response.data.data?.filter(n => !n.isRead) || [];
        setUnreadCount(unread.length);
        setAllNotifications(response.data.data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user?._id]);

  // Mark notification as read
  const markAsRead = async (notificationId, complaintId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setAllNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      if (complaintId) {
        // Navigate to complaint detail
        window.location.href = `/complaints/${complaintId}`;
      }

      setShowBellMenu(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Get icon and color based on notification type
  const getNotificationStyle = (type) => {
    const styles = {
      success: {
        icon: '✅',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-900',
        titleColor: 'text-green-700'
      },
      error: {
        icon: '❌',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-900',
        titleColor: 'text-red-700'
      },
      warning: {
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-900',
        titleColor: 'text-yellow-700'
      },
      info: {
        icon: '🔔',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-900',
        titleColor: 'text-blue-700'
      }
    };
    return styles[type] || styles.info;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => {
            const style = getNotificationStyle(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`mb-3 ${style.bgColor} border-l-4 ${style.borderColor} p-4 rounded-lg shadow-lg max-w-sm pointer-events-auto`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{style.icon}</span>
                    <div>
                      <h3 className={`font-bold ${style.titleColor}`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mt-1 ${style.textColor}`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications(prev => prev.filter(n => n.id !== notification.id))
                    }
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Notification Bell */}
      {user?.role === 'citizen' && (
        <div className="fixed bottom-20 right-6 z-40 md:hidden">
          <div className="relative">
            <button
              onClick={() => setShowBellMenu(!showBellMenu)}
              className="relative bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition"
            >
              🔔
              {unreadCount > 0 && (
                <badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </badge>
              )}
            </button>

            {/* Bell Menu Dropdown */}
            <AnimatePresence>
              {showBellMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b border-gray-200 font-bold text-gray-800">
                    Notifications ({unreadCount} unread)
                  </div>

                  {allNotifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No notifications yet
                    </div>
                  ) : (
                    <div>
                      {allNotifications.map(notif => (
                        <motion.button
                          key={notif._id}
                          onClick={() => markAsRead(notif._id, notif.data?.complaintId)}
                          className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                            notif.isRead ? 'opacity-60' : 'bg-blue-50'
                          }`}
                        >
                          <div className="font-semibold text-gray-800">{notif.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(notif.createdAt).toLocaleString()}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPopup;
