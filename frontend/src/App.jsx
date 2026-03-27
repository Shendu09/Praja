import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore, useComplaintsStore } from './store';
import NotificationPopup from './components/NotificationPopup';

// Lazy-load MobileRatingScreen — keeps the /rate/:serviceId bundle tiny
// so phones scanning QR codes don't need to download the whole app
const MobileRatingScreen = lazy(() => import('./components/screens/MobileRatingScreen'));

// Screens
import SplashScreen from './components/screens/SplashScreen';
import RoleSelectionScreen from './components/screens/RoleSelectionScreen';
import OTPAuthScreen from './components/screens/OTPAuthScreen';
const AdminPortal = lazy(() => import('./components/screens/AdminPortal'));
const OfficialPortal = lazy(() => import('./components/screens/OfficialPortal'));

// Citizen Portal Components
import PhoneShell from './components/PhoneShell';
import HomeScreen from './components/screens/HomeScreen';
import CategoryScreen from './components/screens/CategoryScreen';
import ComplaintFormScreen from './components/screens/ComplaintFormScreen';
import NotificationsScreen from './components/screens/NotificationsScreen';
import ComplaintsScreen from './components/screens/ComplaintsScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import HelpSupportScreen from './components/screens/HelpSupportScreen';
import RateServiceScreen, { PublicRatingPage } from './components/screens/RateServiceScreen';
import CommunityScreen from './components/screens/CommunityScreen';
import QuizScreen from './components/screens/QuizScreen';
import BottomNav from './components/BottomNav';

// Main App Component (handles state-based navigation)
function MainApp() {
  const { checkAuth, isAuthenticated, user, setUser, logout } = useAuthStore();
  const { currentScreen, showAuthModal, setShowAuthModal, switchRoleRequested, clearSwitchRoleRequest } = useUIStore();
  const { fetchCategories, fetchMyComplaints } = useComplaintsStore();

  // App flow states
  const [showSplash, setShowSplash] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [appScreen, setAppScreen] = useState('splash'); // splash, roleSelect, auth, portal, publicRating
  const [publicRatingServiceId, setPublicRatingServiceId] = useState(null);

  // Check for public rating URL parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rateServiceId = urlParams.get('rate');
    
    if (rateServiceId) {
      // Set public rating mode
      setPublicRatingServiceId(rateServiceId);
      setShowSplash(false);
      setAppScreen('publicRating');
    }
  }, []);

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
        case 'settings':
          return <SettingsScreen onBack={() => useUIStore.getState().setScreen('profile')} />;
        case 'help':
          return <HelpSupportScreen onBack={() => useUIStore.getState().setScreen('profile')} />;
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
    // Show public rating page if accessed via QR code URL
    if (appScreen === 'publicRating' && publicRatingServiceId) {
      return (
        <PublicRatingPage 
          serviceId={publicRatingServiceId} 
          onClose={() => {
            // Clear URL parameter and go to home
            window.history.replaceState({}, document.title, window.location.pathname);
            setPublicRatingServiceId(null);
            setShowSplash(false);
            setAppScreen('roleSelect');
          }}
        />
      );
    }

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
          return (
            <Suspense fallback={<RatingLoadingFallback />}>
              <AdminPortal user={user} onLogout={handleLogout} />
            </Suspense>
          );
        }
        
        if (role === 'official') {
          return (
            <Suspense fallback={<RatingLoadingFallback />}>
              <OfficialPortal user={user} onLogout={handleLogout} />
            </Suspense>
          );
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
      
      {/* Real-time Notification Popups */}
      <NotificationPopup />
      
      <AnimatePresence mode="wait">
        {renderApp()}
      </AnimatePresence>
    </div>
  );
}

// Lightweight loading fallback for the QR rating page on mobile
function RatingLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8FAFC, #E2E8F0)',
      fontFamily: "'Inter', 'Nunito', sans-serif"
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }}>⏳</div>
        <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Loading rating page...</div>
        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }`}</style>
      </div>
    </div>
  );
}

// Error boundary for the QR rating route
class RatingErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(err, info) { console.error('Rating page error:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#FFF5F5', padding: 24,
          fontFamily: "'Inter', 'Nunito', sans-serif"
        }}>
          <div style={{ textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#DC2626', marginBottom: 12 }}>Something went wrong</div>
            <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
              {String(this.state.error?.message || 'Failed to load rating page')}
            </div>
            <button onClick={() => window.location.reload()} style={{
              padding: '12px 28px', background: '#0D4F44', color: '#fff',
              border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer'
            }}>Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main App with Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* QR Code Rating Route - Standalone lazy-loaded page for mobile scanning */}
        <Route path="/rate/:serviceId" element={
          <RatingErrorBoundary>
            <Suspense fallback={<RatingLoadingFallback />}>
              <MobileRatingScreen />
            </Suspense>
          </RatingErrorBoundary>
        } />
        
        {/* Main App Route - All other paths */}
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
