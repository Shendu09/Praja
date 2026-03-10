import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore, useComplaintsStore } from './store';

// Screens
import SplashScreen from './components/screens/SplashScreen';
import RoleSelectionScreen from './components/screens/RoleSelectionScreen';
import OTPAuthScreen from './components/screens/OTPAuthScreen';
import AdminPortal from './components/screens/AdminPortal';
import OfficialPortal from './components/screens/OfficialPortal';

// Citizen Portal Components
import PhoneShell from './components/PhoneShell';
import HomeScreen from './components/screens/HomeScreen';
import CategoryScreen from './components/screens/CategoryScreen';
import ComplaintFormScreen from './components/screens/ComplaintFormScreen';
import NotificationsScreen from './components/screens/NotificationsScreen';
import ComplaintsScreen from './components/screens/ComplaintsScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import RateServiceScreen from './components/screens/RateServiceScreen';
import CommunityScreen from './components/screens/CommunityScreen';
import QuizScreen from './components/screens/QuizScreen';
import BottomNav from './components/BottomNav';

function App() {
  const { checkAuth, isAuthenticated, user, setUser, logout } = useAuthStore();
  const { currentScreen, showAuthModal, setShowAuthModal, switchRoleRequested, clearSwitchRoleRequest } = useUIStore();
  const { fetchCategories, fetchMyComplaints } = useComplaintsStore();

  // App flow states
  const [showSplash, setShowSplash] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [appScreen, setAppScreen] = useState('splash'); // splash, roleSelect, auth, portal

  // Listen for switch role requests from ProfileScreen
  useEffect(() => {
    if (switchRoleRequested) {
      setSelectedRole(null);
      setAppScreen('roleSelect');
      clearSwitchRoleRequest();
    }
  }, [switchRoleRequested, clearSwitchRoleRequest]);

  useEffect(() => {
    fetchCategories();
    
    // Check if user is already logged in (token can be stored under either key)
    const token = localStorage.getItem('token') || localStorage.getItem('praja_token');
    if (token) {
      checkAuth().then((userData) => {
        // If authenticated, skip to portal and load their complaints
        setShowSplash(false);
        setAppScreen('portal');
        if (userData?.role === 'citizen' || !userData?.role) {
          fetchMyComplaints({}, userData?._id);
        }
      }).catch(() => {
        // Token invalid, show splash
      });
    }
  }, []);

  // Handle splash complete
  const handleSplashComplete = () => {
    setShowSplash(false);
    
    // Check if already authenticated (token can be stored under either key)
    const token = localStorage.getItem('token') || localStorage.getItem('praja_token');
    if (token && isAuthenticated) {
      setAppScreen('portal');
    } else {
      setAppScreen('roleSelect');
    }
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setAppScreen('auth');
  };

  // Handle auth success
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setSelectedRole(userData.role);
    if (userData.role === 'citizen' || !userData.role) {
      // Pass userId so the store can detect a user switch and clear stale data
      fetchMyComplaints({}, userData._id);
    }
    setAppScreen('portal');
  };

  // Handle logout — do NOT clear complaints here; they must survive so the
  // citizen sees their data instantly on next login before the API responds.
  const handleLogout = () => {
    logout();
    setSelectedRole(null);
    setAppScreen('roleSelect');
  };

  // Render citizen portal (mobile app view)
  const renderCitizenPortal = () => {
    const renderScreen = () => {
      switch (currentScreen) {
        case 'home':
          return <HomeScreen />;
        case 'category':
          return <CategoryScreen />;
        case 'form':
          return <ComplaintFormScreen />;
        case 'notifications':
          return <NotificationsScreen />;
        case 'complaints':
          return <ComplaintsScreen />;
        case 'profile':
          return <ProfileScreen />;
        case 'rateToilet':
          return <RateServiceScreen onBack={() => useUIStore.getState().setScreen('home')} />;
        case 'community':
          return <CommunityScreen onBack={() => useUIStore.getState().setScreen('home')} />;
        case 'quiz':
          return <QuizScreen onBack={() => useUIStore.getState().setScreen('home')} />;
        default:
          return <HomeScreen />;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 font-nunito">
        <PhoneShell>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 pb-20">
              {renderScreen()}
            </div>
            <BottomNav />
          </div>
        </PhoneShell>
      </div>
    );
  };

  // Main render
  const renderApp = () => {
    // Show splash
    if (showSplash) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }

    switch (appScreen) {
      case 'roleSelect':
        return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
      
      case 'auth':
        return (
          <OTPAuthScreen
            role={selectedRole}
            onBack={() => setAppScreen('roleSelect')}
            onSuccess={handleAuthSuccess}
          />
        );
      
      case 'portal':
        // Render portal based on user role
        const role = user?.role || selectedRole || 'citizen';
        
        if (role === 'admin') {
          return <AdminPortal user={user} onLogout={handleLogout} />;
        }
        
        if (role === 'official') {
          return <OfficialPortal user={user} onLogout={handleLogout} />;
        }
        
        // Default: Citizen portal
        return renderCitizenPortal();
      
      default:
        return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
    }
  };

  return (
    <div className="font-nunito">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <AnimatePresence mode="wait">
        {renderApp()}
      </AnimatePresence>
    </div>
  );
}

export default App;
