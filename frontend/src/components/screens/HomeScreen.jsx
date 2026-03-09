import { useState, useEffect } from 'react';
import { useUIStore, useAuthStore } from '../../store';

const banners = [
  {
    bg: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    title: 'Smart City\nSmart Citizens',
    emoji: '🏙️',
    sub: 'Your voice builds better infrastructure',
    textColor: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
    title: 'Report. Track.\nTransform.',
    emoji: '🎯',
    sub: 'AI-powered civic engagement platform',
    textColor: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
    title: 'प्रजा\nसेवा',
    emoji: '🇮🇳',
    sub: 'PRAJA - Citizen Grievance Portal',
    textColor: 'text-white',
  },
];

const actionCards = [
  { 
    icon: '📋', 
    title: 'Post a Complaint', 
    sub: 'AI-powered issue reporting', 
    gradient: 'gradient-teal',
    screen: 'category' 
  },
  { 
    icon: '🏛️', 
    title: 'Rate Public Service', 
    sub: 'Rate Toilets, Transport & More', 
    gradient: 'gradient-amber',
    screen: 'rateToilet' 
  },
  { 
    icon: '👥', 
    title: 'Community Hub', 
    sub: 'Upvote & Support Issues', 
    gradient: 'gradient-green',
    screen: 'community' 
  },
  { 
    icon: '🏆', 
    title: 'Civic Quiz', 
    sub: 'Learn & Earn XP', 
    gradient: 'gradient-pink',
    screen: 'quiz' 
  },
];

export default function HomeScreen() {
  const [slide, setSlide] = useState(0);
  const { setScreen, setShowAuthModal } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleActionClick = (screen) => {
    if (!screen) return;
    if (!isAuthenticated) {
      setShowAuthModal(true, 'login');
      return;
    }
    setScreen(screen);
  };

  const banner = banners[slide];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Banner */}
      <div 
        className={`h-72 ${banner.bg} flex flex-col items-center justify-center gap-3 transition-all duration-500 relative px-6`}
      >
        <div className="text-7xl mb-2 drop-shadow-lg">{banner.emoji}</div>
        <div className={`font-extrabold text-2xl md:text-4xl ${banner.textColor || 'text-white'} text-center leading-tight whitespace-pre-line drop-shadow-lg`}>
          {banner.title}
        </div>
        <div className={`text-base ${banner.textColor || 'text-white'} text-center opacity-90`}>{banner.sub}</div>
        
        {/* Dots */}
        <div className="flex gap-2 absolute bottom-4">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === slide ? 'w-6 bg-white' : 'w-2.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Greeting Card */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="mt-5 mb-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-indigo-600 font-extrabold text-xl">
                {getGreeting()},<br />
                Welcome {isAuthenticated ? user?.name || 'Citizen' : 'Active Citizen'} 👋
              </div>
              <div className="text-gray-500 text-sm mt-1">
                Here are today's actions for you
              </div>
            </div>
            {/* XP Badge */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 rounded-xl text-white">
              <p className="text-xs">Your XP</p>
              <p className="text-xl font-bold">{user?.points || 850}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
          {actionCards.map((card, i) => (
            <div
              key={i}
              onClick={() => handleActionClick(card.screen)}
              className={`h-[170px] rounded-2xl ${card.gradient} p-5 text-white flex flex-col justify-between shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl ${
                card.screen ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="text-4xl">{card.icon}</div>
              <div>
                <div className="font-bold text-lg leading-tight">
                  {card.title}
                </div>
                <div className="text-sm opacity-90 mt-1">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pb-6">
          {[
            { value: user?.complaintsPosted || 3, label: 'Posted', icon: '📝', color: 'from-blue-500 to-indigo-500' },
            { value: user?.complaintsResolved || 2, label: 'Resolved', icon: '✅', color: 'from-emerald-500 to-teal-500' },
            { value: `#12`, label: 'Your Rank', icon: '🏆', color: 'from-amber-500 to-orange-500' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white text-center shadow-lg`}
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-bold text-2xl">{stat.value}</div>
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
