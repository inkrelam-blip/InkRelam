import { useState } from 'react';
import { 
  Search, Menu, Bell, X, BookOpen, User, Heart, 
  MessageSquare, Settings, LogOut, Star, Users, 
  Eye, PenTool, ChevronRight, ChevronDown, TrendingUp,
  Clock, Sparkles, Crown, Flame, ArrowRight, Feather,
  Mail, MapPin, BookMarked, Shield, FileText, 
  HelpCircle, Send, CheckCircle, Lightbulb, AlertTriangle,
  Zap, Target, Award,
  Sword, HeartHandshake, Wand2, Ghost, Rocket, Laugh, Drama
} from 'lucide-react';
import { useStore } from '../store';
import { Novel, AppNotification, GENRES } from '../types';

interface HomePageProps {
  onNavigate: (page: string, data?: any) => void;
  requireAuth?: (message: string) => void;
}

// Genre icons mapping
const genreIcons: { [key: string]: any } = {
  'Fantasy': Wand2, 'Romance': HeartHandshake, 'Sci-Fi': Rocket, 'Mystery': Search,
  'Thriller': Zap, 'Horror': Ghost, 'Adventure': Flame, 'Comedy': Laugh,
  'Drama': Drama, 'Action': Sword, 'Historical': BookOpen, 'Slice of Life': Heart,
  'Supernatural': Sparkles, 'Isekai': Rocket, 'Martial Arts': Sword, 'Wuxia': Sword,
  'Xuanhuan': Wand2, 'Urban': MapPin, 'Sports': Award, 'Psychological': Target
};

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-60" style={{
          width: `${Math.random() * 5 + 2}px`, height: `${Math.random() * 5 + 2}px`,
          background: ['#c084fc', '#f472b6', '#fbbf24', '#60a5fa'][Math.floor(Math.random() * 4)],
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          animation: `float-particle ${Math.random() * 5 + 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }} />
      ))}
    </div>
  );
}

// Record visitor on page load
function recordPageVisit() {
  const saved = localStorage.getItem('novelNestVisitors');
  const data = saved ? JSON.parse(saved) : { totalVisits: 0, dailyVisits: {}, monthlyVisits: {}, lastVisit: '', uniqueVisitors: [] };
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);
  data.totalVisits += 1;
  data.dailyVisits[today] = (data.dailyVisits[today] || 0) + 1;
  data.monthlyVisits[month] = (data.monthlyVisits[month] || 0) + 1;
  data.lastVisit = new Date().toISOString();
  let vid = localStorage.getItem('novelNestVisitorId');
  if (!vid) { vid = Math.random().toString(36).substring(2, 15) + Date.now().toString(36); localStorage.setItem('novelNestVisitorId', vid); }
  if (!data.uniqueVisitors.includes(vid)) data.uniqueVisitors.push(vid);
  localStorage.setItem('novelNestVisitors', JSON.stringify(data));
}

// Only record once per session
if (!sessionStorage.getItem('novelNestVisitRecorded')) {
  recordPageVisit();
  sessionStorage.setItem('novelNestVisitRecorded', 'true');
}

export default function HomePage({ onNavigate, requireAuth }: HomePageProps) {
  const { 
    currentUser, logout, getPublishedNovels, getUnreadNotifications,
    markNotificationRead, markAllNotificationsRead, notifications, getNovelById
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [selectedGenre] = useState<string | null>(null);
  const [showAllTrending, setShowAllTrending] = useState(false);
  
  const [showGenreModal, setShowGenreModal] = useState<string | null>(null);
  const [showWritingTips, setShowWritingTips] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  
  const [helpFormSent, setHelpFormSent] = useState(false);
  const [helpForm, setHelpForm] = useState({ name: '', email: '', message: '' });



  const publishedNovels = getPublishedNovels();
  const unreadNotifications = currentUser ? getUnreadNotifications() : [];
  const userNotifications = currentUser 
    ? notifications.filter(n => n.userId === currentUser.id).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const trendingNovels = [...publishedNovels]
    .sort((a, b) => (b.likes.length + b.views + b.followers.length) - (a.likes.length + a.views + a.followers.length))
    .slice(0, 5);

  const mostWatchedNovels = [...publishedNovels].sort((a, b) => (b.views + b.likes.length) - (a.views + a.likes.length));

  const recentlyUpdatedNovels = [...publishedNovels].sort((a, b) => {
    const aLatest = a.chapters.filter(c => c.status === 'published').sort((x, y) => 
      new Date(y.publishedAt || y.createdAt).getTime() - new Date(x.publishedAt || x.createdAt).getTime())[0];
    const bLatest = b.chapters.filter(c => c.status === 'published').sort((x, y) => 
      new Date(y.publishedAt || y.createdAt).getTime() - new Date(x.publishedAt || x.createdAt).getTime())[0];
    return (bLatest ? new Date(bLatest.publishedAt || bLatest.createdAt).getTime() : 0) - 
           (aLatest ? new Date(aLatest.publishedAt || aLatest.createdAt).getTime() : 0);
  });

  // Top 7 genres with novels for display
  const topGenresWithNovels = GENRES.map(genre => ({
    genre,
    novels: publishedNovels.filter(n => n.categories.includes(genre))
      .sort((a, b) => (b.likes.length + b.views) - (a.likes.length + a.views))
  })).filter(g => g.novels.length > 0).slice(0, 7);

  const filteredNovels = publishedNovels.filter(novel => {
    const matchesSearch = !searchQuery || novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      novel.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || novel.categories.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationRead(notification.id);
    if (notification.relatedNovelId) {
      const novel = getNovelById(notification.relatedNovelId);
      if (novel) {
        if (notification.relatedChapterId) {
          onNavigate('chapter', { novel, chapterId: notification.relatedChapterId });
        } else {
          setSelectedNovel(novel);
        }
      }
    }
    setNotificationOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': case 'novel_follow': return <Users className="w-4 h-4 text-blue-400" />;
      case 'like': case 'novel_like': case 'comment_like': return <Heart className="w-4 h-4 text-pink-400" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'new_chapter': return <BookOpen className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  const handleProtectedAction = (action: string) => {
    if (!currentUser && requireAuth) {
      requireAuth(`Login to ${action}`);
      return false;
    }
    return true;
  };

  const handleHelpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Help request:', helpForm);
    setHelpFormSent(true);
    setTimeout(() => {
      setHelpFormSent(false);
      setHelpForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  const getGenreNovels = (genre: string) => {
    return publishedNovels.filter(n => n.categories.includes(genre))
      .sort((a, b) => (b.likes.length + b.views) - (a.likes.length + a.views));
  };



  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      <style>{`
        @keyframes float-particle { 0%,100%{transform:translateY(0) scale(1);opacity:.6} 50%{transform:translateY(-30px) scale(1.2);opacity:1} }
        @keyframes slide-trending { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes banner-glow { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.5;transform:scale(1.05)} }
        @keyframes text-glow { 0%,100%{text-shadow:0 0 20px rgba(168,85,247,.5)} 50%{text-shadow:0 0 40px rgba(236,72,153,.6)} }
        @keyframes sakura { 0%{transform:translateY(-10%) rotate(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes search-expand { 0%{width:40px;opacity:0.5} 100%{width:280px;opacity:1} }
        @keyframes dropdown-slide { 0%{opacity:0;transform:translateY(-10px)} 100%{opacity:1;transform:translateY(0)} }
        .sakura{position:absolute;width:10px;height:10px;background:radial-gradient(ellipse,#f9a8d4 0%,#f472b6 50%,transparent 70%);border-radius:50% 0 50% 0;animation:sakura linear infinite}
        .trending-scroll{animation:slide-trending 25s linear infinite}.trending-scroll:hover{animation-play-state:paused}
        .card-shine{position:relative;overflow:hidden}.card-shine::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);transition:left .5s}.card-shine:hover::after{left:100%}
        .dropdown-animate{animation:dropdown-slide 0.2s ease-out}
        .search-expanded{animation:search-expand 0.3s ease-out forwards}
        .genre-item{transition:all 0.2s ease}.genre-item:hover{background:linear-gradient(90deg,rgba(168,85,247,0.2),rgba(236,72,153,0.1));padding-left:20px}
        html{scroll-behavior:smooth}
        *{scrollbar-width:thin;scrollbar-color:rgba(168,85,247,0.3) transparent}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(168,85,247,0.3);border-radius:10px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(168,85,247,0.5)}
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-purple-500/20">
        <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Menu + Logo + Browse */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
            <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-purple-500/10 rounded-xl transition-all group">
              <Menu className="w-5 h-5 text-gray-300 group-hover:text-white" />
            </button>
            <button onClick={() => currentUser ? onNavigate('write') : requireAuth?.('Login to write novels')} className="flex items-center gap-1.5 group cursor-pointer">
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                  <Feather className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent hidden md:inline group-hover:opacity-80 transition-opacity">Ink Relam</span>
            </button>
            {/* Browse - Left side next to logo */}
            <div className="relative" onMouseEnter={() => setGenreDropdownOpen(true)} onMouseLeave={() => setGenreDropdownOpen(false)}>
              <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-300 hover:text-white rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all group">
                <BookMarked className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Browse</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${genreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {genreDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#12121f]/98 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 py-3 dropdown-animate overflow-hidden z-50">
                  <div className="px-4 pb-2 mb-2 border-b border-purple-500/20">
                    <p className="text-xs text-purple-400 font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> Explore All Genres</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto px-2">
                    {GENRES.map((genre, idx) => {
                      const IconComponent = genreIcons[genre] || BookOpen;
                      const count = publishedNovels.filter(n => n.categories.includes(genre)).length;
                      return (
                        <button key={genre} onClick={() => { setShowGenreModal(genre); setGenreDropdownOpen(false); }}
                          className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/10 transition-all group"
                          style={{ animationDelay: `${idx * 20}ms` }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30">
                            <IconComponent className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="flex-1">{genre}</span>
                          <span className="text-xs text-gray-500 bg-slate-800/50 px-2 py-0.5 rounded-full">{count}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Search Bar - Desktop/Tablet only, hidden on mobile */}
          <div className="hidden sm:flex flex-1 justify-center mx-2">
            <div className="flex items-center gap-2 w-full max-w-[200px] md:max-w-[240px] rounded-full bg-slate-800/60 px-3 py-1.5 border border-slate-700/50">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search novels"
                className="bg-transparent text-white placeholder-gray-500 focus:outline-none flex-1 text-sm min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="flex-shrink-0 p-0.5 hover:bg-white/10 rounded-full">
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Bell + User/Login - right aligned on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Bell Icon - Always visible */}
            <div className="relative">
              <button onClick={() => {
                if (!currentUser) { requireAuth?.('Login to see your notifications'); return; }
                // Ask browser notification permission on first bell click
                if (typeof window.Notification !== 'undefined' && window.Notification.permission === 'default') {
                  window.Notification.requestPermission();
                }
                setNotificationOpen(!notificationOpen);
              }} 
                className="p-2 sm:p-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-full border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 relative group">
                <Bell className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                {currentUser && unreadNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse px-1">
                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                  </span>
                )}
              </button>
              {notificationOpen && currentUser && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-[#12121f]/98 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 dropdown-animate">
                  <div className="flex items-center justify-between p-3 sm:p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-400" /> Notifications
                      <span className="text-[10px] text-gray-500 bg-slate-800 px-1.5 py-0.5 rounded-full">{userNotifications.length}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadNotifications.length > 0 && (
                        <button onClick={markAllNotificationsRead} className="text-[10px] sm:text-xs text-purple-400 hover:text-purple-300">Mark all read</button>
                      )}
                      <button onClick={() => setNotificationOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {userNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No notifications yet</p>
                        <p className="text-gray-600 text-xs mt-1">When someone likes, follows, or comments on your novels, you'll see it here.</p>
                      </div>
                    ) : userNotifications.slice(0, 20).map(notif => (
                      <button key={notif.id} onClick={() => handleNotificationClick(notif)}
                        className={`w-full p-3 flex items-start gap-2.5 hover:bg-purple-500/10 text-left border-b border-purple-500/10 transition-colors ${!notif.isRead ? 'bg-purple-500/5 border-l-2 border-l-purple-500' : ''}`}
                      >
                        <div className={`p-1.5 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!notif.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar or Login */}
            {currentUser ? (
              <button onClick={() => onNavigate('profile')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden ring-2 ring-purple-500/50 hover:ring-purple-400 transition-all"
              >
                {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" /> : currentUser.displayName?.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button onClick={() => onNavigate('auth')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SIDE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0d0d20]/98 backdrop-blur-xl border-r border-purple-500/20 shadow-2xl">
            <div className="p-5 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Feather className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Ink Relam</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {/* Mobile Search - inside menu */}
              <div className="sm:hidden mb-3">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2.5 border border-slate-700/50">
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search novels..."
                    className="bg-transparent text-white placeholder-gray-500 focus:outline-none flex-1 text-sm min-w-0"
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery) setMenuOpen(false); }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-white/10 rounded-full">
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {[
                { icon: BookOpen, label: 'Home', page: 'home', auth: false },
                { icon: PenTool, label: 'Write Novel', page: 'write', auth: true },
                { icon: Eye, label: 'My Dashboard', page: 'dashboard', auth: true },
                { icon: Users, label: 'Following', page: 'following', auth: true },
                { icon: Star, label: 'Favorites', page: 'favorites', auth: true },
                { icon: MessageSquare, label: 'Inbox', page: 'inbox', auth: true },
                { icon: User, label: 'Profile', page: 'profile', auth: true },
                { icon: Settings, label: 'Settings', page: 'settings', auth: true },
              ].map(item => (
                <button key={item.page} onClick={() => {
                  if (item.auth && !currentUser) { requireAuth?.(`Login to access ${item.label}`); }
                  else { onNavigate(item.page); }
                  setMenuOpen(false);
                }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-transparent rounded-xl transition-all duration-300 group"
                >
                  <item.icon className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                  <span>{item.label}</span>
                </button>
              ))}
              

              
              {currentUser && (
                <>
                  <hr className="border-purple-500/20 my-3" />
                  <button onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  ><LogOut className="w-5 h-5" /><span>Logout</span></button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* BANNER */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-indigo-900/60 to-pink-900/80" />
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/8390504/pexels-photo-8390504.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200')] bg-cover bg-center opacity-15" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" style={{ animation: 'banner-glow 4s infinite' }} />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-pink-500/20 rounded-full blur-[80px]" style={{ animation: 'banner-glow 5s infinite 1s' }} />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="sakura" style={{ left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 6 + 5}s`, animationDelay: `${Math.random() * 8}s` }} />
        ))}
        <FloatingParticles />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:py-12 text-center">
          <div className="flex justify-center mb-2 sm:mb-3">
            <div className="flex items-center gap-2"><div className="w-8 sm:w-10 h-px bg-gradient-to-r from-transparent to-purple-400" /><Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" /><div className="w-8 sm:w-10 h-px bg-gradient-to-l from-transparent to-purple-400" /></div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1 sm:mb-2" style={{ animation: 'text-glow 3s infinite' }}>
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">Ink</span>
            <span className="bg-gradient-to-r from-pink-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent"> Relam</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-purple-200/80 mb-1">✦ Where Stories Come Alive ✦</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-4 sm:mb-5 max-w-sm mx-auto">Discover thousands of novels from talented authors worldwide</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button onClick={() => document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-semibold rounded-full hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95"
            ><Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Explore</button>
            {currentUser ? (
              <button onClick={() => onNavigate('write')}
                className="px-5 py-2 bg-white/10 text-white text-sm font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
              ><PenTool className="w-4 h-4" /> Write</button>
            ) : (
              <button onClick={() => onNavigate('auth')}
                className="px-5 py-2 bg-white/10 text-white text-sm font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
              ><User className="w-4 h-4" /> Join Free</button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a1a] to-transparent" />
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 pb-8 w-full">
        {/* TRENDING */}
        <section id="trending-section" className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg"><TrendingUp className="w-4 h-4 text-white" /></div>
              <h2 className="text-lg font-bold text-white">🔥 Trending</h2>
            </div>
            <button onClick={() => setShowAllTrending(true)} className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              See More <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {trendingNovels.length > 0 ? (
            <div className="relative overflow-hidden rounded-xl">
              <div className="flex gap-3 trending-scroll" style={{ width: trendingNovels.length > 2 ? 'max-content' : '100%' }}>
                {[...trendingNovels, ...(trendingNovels.length > 2 ? trendingNovels : [])].map((novel, idx) => (
                  <div key={`${novel.id}-${idx}`} onClick={() => setSelectedNovel(novel)} className="flex-shrink-0 w-36 sm:w-44 md:w-48 cursor-pointer group card-shine">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2">
                      {novel.coverImage ? <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-10 h-10 text-white/40" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                        <Crown className="w-3 h-3 text-white" /><span className="text-xs font-bold text-white">#{(idx % trendingNovels.length) + 1}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-bold text-white text-sm truncate">{novel.title}</h3>
                        <p className="text-xs text-gray-300">{novel.authorName}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{novel.views}</span>
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{novel.likes.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No trending novels yet</p>
            </div>
          )}
        </section>

        {/* RECENT UPDATES */}
        <section className="py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
            <h2 className="text-lg font-bold text-white">📖 Recent Updates</h2>
          </div>
          {recentlyUpdatedNovels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentlyUpdatedNovels.slice(0, 6).map(novel => {
                const latestCh = novel.chapters.filter(c => c.status === 'published').sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())[0];
                return (
                  <div key={novel.id} onClick={() => setSelectedNovel(novel)} className="flex gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/30 cursor-pointer hover:bg-slate-800 hover:border-purple-500/30 transition-all group card-shine">
                    <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                      {novel.coverImage ? <img src={novel.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-5 h-5 text-white/50" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-purple-300">{novel.title}</h3>
                      <p className="text-xs text-gray-500">{novel.authorName}</p>
                      {latestCh && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded">New</span>
                          <span className="text-xs text-gray-400 truncate">Ch.{latestCh.chapterNumber}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-600 mt-0.5">{latestCh ? formatTimeAgo(latestCh.publishedAt || latestCh.createdAt) : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <Clock className="w-10 h-10 text-gray-600 mx-auto mb-2" /><p className="text-gray-500 text-sm">No recent updates</p>
            </div>
          )}
        </section>

        {/* 7 GENRE SECTIONS */}
        {topGenresWithNovels.map(({ genre, novels: gNovels }) => {
          const IconComponent = genreIcons[genre] || BookOpen;
          return (
            <section key={genre} className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{genre}</h2>
                  <span className="text-xs text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full">{gNovels.length} novels</span>
                </div>
                <button onClick={() => setShowGenreModal(genre)} className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {gNovels.slice(0, 6).map(novel => (
                  <div key={novel.id} onClick={() => setSelectedNovel(novel)} className="flex-shrink-0 w-28 sm:w-32 md:w-36 cursor-pointer group card-shine">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2">
                      {novel.coverImage ? <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-8 h-8 text-white/40" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-medium text-white text-xs truncate">{novel.title}</h3>
                    <p className="text-[10px] text-gray-500 truncate">{novel.authorName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{novel.views}</span>
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{novel.likes.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Search Results */}
        {searchQuery && (
          <section className="py-6">
            <h2 className="text-lg font-bold text-white mb-3">Search: "{searchQuery}"</h2>
            {filteredNovels.length === 0 ? <p className="text-gray-500 text-center py-8 text-sm">No results found</p> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredNovels.map(novel => (
                  <div key={novel.id} onClick={() => setSelectedNovel(novel)} className="cursor-pointer group card-shine">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-800 mb-1.5">
                      {novel.coverImage ? <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-8 h-8 text-white/50" /></div>}
                    </div>
                    <h3 className="font-medium text-white text-xs truncate">{novel.title}</h3>
                    <p className="text-[10px] text-gray-400 truncate">{novel.authorName}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {publishedNovels.length === 0 && !searchQuery && (
          <section className="py-12 text-center">
            <BookOpen className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Discover Your Next Adventure</h2>
            <p className="text-gray-400 mb-4 text-sm">Be the first author to publish your masterpiece!</p>
            {currentUser ? (
              <button onClick={() => onNavigate('write')} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full">✍️ Write Novel</button>
            ) : (
              <button onClick={() => onNavigate('auth')} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full">Join Free</button>
            )}
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#070712] border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Feather className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Ink Relam</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">Your home for endless stories. Discover, read, and write novels with a community of passionate storytellers.</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/inkrelam/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://x.com/SanskariCloud07" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://youtube.com/@inkrealm-x7z?si=PWbOE4DFVeHKhx8v" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-red-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setShowAllTrending(true)} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Trending</button></li>
                <li><button onClick={() => setShowGenreModal('Fantasy')} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><Wand2 className="w-3 h-3" /> Fantasy</button></li>
                <li><button onClick={() => setShowGenreModal('Romance')} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><HeartHandshake className="w-3 h-3" /> Romance</button></li>
                <li><button onClick={() => setShowGenreModal('Action')} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><Sword className="w-3 h-3" /> Action</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">For Authors</h4>
              <ul className="space-y-2">
                <li><button onClick={() => handleProtectedAction('write') && onNavigate('write')} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><PenTool className="w-3 h-3" /> Start Writing</button></li>
                <li><button onClick={() => handleProtectedAction('view dashboard') && onNavigate('dashboard')} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><Eye className="w-3 h-3" /> Dashboard</button></li>
                <li><button onClick={() => setShowWritingTips(true)} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Writing Tips</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setShowHelpCenter(true)} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Help Center</button></li>
                <li><button onClick={() => setShowPrivacyPolicy(true)} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><Shield className="w-3 h-3" /> Privacy Policy</button></li>
                <li><button onClick={() => setShowTermsOfService(true)} className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><FileText className="w-3 h-3" /> Terms of Service</button></li>
                <li><a href="mailto:inkrelam@gmail.com" className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"><Mail className="w-3 h-3" /> Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 py-4 border-t border-slate-800 mb-4">
            <a href="mailto:inkrelam@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors">
              <Mail className="w-4 h-4" /> inkrelam@gmail.com
            </a>
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4" /> India
            </span>
          </div>

          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-sm text-gray-500">© 2026 Ink Relam. All rights reserved. Made with 💜 for storytellers.</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedNovel && <NovelModal novel={selectedNovel} onClose={() => setSelectedNovel(null)} onNavigate={onNavigate} requireAuth={requireAuth} />}
      
      {/* Trending Modal */}
      {showAllTrending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAllTrending(false)} />
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/20 dropdown-animate">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
              <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /><h3 className="font-bold text-white">🔥 All Trending Novels</h3></div>
              <button onClick={() => setShowAllTrending(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-2">
              {mostWatchedNovels.map((novel, idx) => (
                <div key={novel.id} onClick={() => { setSelectedNovel(novel); setShowAllTrending(false); }}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all"
                >
                  <span className="text-xl font-black text-purple-500/50 w-8 text-center">#{idx + 1}</span>
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                    {novel.coverImage ? <img src={novel.coverImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-5 h-5 text-white/50" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{novel.title}</h4>
                    <p className="text-xs text-gray-400">{novel.authorName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{novel.views}</span>
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{novel.likes.length}</span>
                    </div>
                  </div>
                </div>
              ))}
              {mostWatchedNovels.length === 0 && <p className="text-center text-gray-500 py-6">No novels yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Genre Modal */}
      {showGenreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGenreModal(null)} />
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl dropdown-animate">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2">
                {(() => { const Icon = genreIcons[showGenreModal] || BookOpen; return <Icon className="w-5 h-5 text-purple-400" />; })()}
                <h3 className="font-bold text-white text-lg">{showGenreModal} Novels</h3>
                <span className="text-xs text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full">{getGenreNovels(showGenreModal).length} novels</span>
              </div>
              <button onClick={() => setShowGenreModal(null)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {getGenreNovels(showGenreModal).length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No {showGenreModal} novels yet</p>
                  <p className="text-gray-600 text-sm mt-2">Be the first to write one!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {getGenreNovels(showGenreModal).map(novel => (
                    <div key={novel.id} onClick={() => { setSelectedNovel(novel); setShowGenreModal(null); }} className="cursor-pointer group card-shine">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2">
                        {novel.coverImage ? <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-10 h-10 text-white/50" /></div>}
                      </div>
                      <h4 className="font-medium text-white text-sm truncate">{novel.title}</h4>
                      <p className="text-xs text-gray-400">{novel.authorName}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span><Eye className="w-3 h-3 inline" /> {novel.views}</span>
                        <span><Heart className="w-3 h-3 inline" /> {novel.likes.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Writing Tips Modal */}
      {showWritingTips && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWritingTips(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl dropdown-animate">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-400" /><h3 className="font-bold text-white">✍️ Writing Tips</h3></div>
              <button onClick={() => setShowWritingTips(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 text-gray-300">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-400" /> How to Write a Novel</h4>
                <p className="text-sm leading-relaxed">Writing a great novel starts with a clear concept. Think about what message you want to convey, what genre fits your story best, and what the main conflict will be.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-green-400" /> Essential Elements</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5" /><span><strong className="text-white">Compelling Characters:</strong> Create memorable characters with clear motivations.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5" /><span><strong className="text-white">Engaging Plot:</strong> Build with unexpected twists and rising tension.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5" /><span><strong className="text-white">Proper Pacing:</strong> Balance action with quiet moments.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5" /><span><strong className="text-white">World-Building:</strong> Create a believable setting.</span></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Pro Tips</h4>
                <ul className="text-sm space-y-2">
                  <li><span className="text-purple-400 font-bold">1.</span> <strong className="text-white">Show, Don't Tell</strong></li>
                  <li><span className="text-purple-400 font-bold">2.</span> <strong className="text-white">Write Consistently</strong></li>
                  <li><span className="text-purple-400 font-bold">3.</span> <strong className="text-white">Read Widely</strong></li>
                  <li><span className="text-purple-400 font-bold">4.</span> <strong className="text-white">Embrace Feedback</strong></li>
                  <li><span className="text-purple-400 font-bold">5.</span> <strong className="text-white">Edit Ruthlessly</strong></li>
                </ul>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30">
                <p className="text-sm text-purple-300"><Award className="w-5 h-5 inline mr-2" /><strong>Remember:</strong> Every successful author started as a beginner. Keep practicing!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Center Modal */}
      {showHelpCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHelpCenter(false)} />
          <div className="relative w-full max-w-lg bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl dropdown-animate">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-400" /><h3 className="font-bold text-white">🆘 Help Center</h3></div>
              <button onClick={() => setShowHelpCenter(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6">
              {helpFormSent ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-white mb-2">Message Sent! ✅</h4>
                  <p className="text-gray-400">We'll respond within 10 minutes to 24 hours.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-4">Having an issue? Send us a message and we'll get back to you within 10 minutes to 24 hours.</p>
                  <form onSubmit={handleHelpSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Your Name</label>
                      <input type="text" required value={helpForm.name} onChange={e => setHelpForm({...helpForm, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Your Email</label>
                      <input type="email" required value={helpForm.email} onChange={e => setHelpForm({...helpForm, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Your Message</label>
                      <textarea required rows={4} value={helpForm.message} onChange={e => setHelpForm({...helpForm, message: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPrivacyPolicy(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl dropdown-animate">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-green-500/10 to-transparent">
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">🔒 Privacy Policy</h3></div>
              <button onClick={() => setShowPrivacyPolicy(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-gray-300 text-sm">
              <p className="text-gray-500">Last Updated: January 2026</p>
              <div><h4 className="font-semibold text-white mb-1">1. Information We Collect</h4><p>Email, username, profile info, novels, and reading history.</p></div>
              <div><h4 className="font-semibold text-white mb-1">2. How We Use It</h4><p>For personalized experience, notifications, and security.</p></div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h4 className="font-semibold text-red-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> 3. No Plagiarism</h4>
                <p className="text-xs">Copying from other websites is strictly prohibited. Violations result in permanent bans.</p>
              </div>
              <div><h4 className="font-semibold text-white mb-1">4. Data Security</h4><p>Encrypted storage with industry-standard protection.</p></div>
              <div><h4 className="font-semibold text-white mb-1">5. Contact</h4><p>Email: <a href="mailto:inkrelam@gmail.com" className="text-purple-400">inkrelam@gmail.com</a></p></div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTermsOfService(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl dropdown-animate">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /><h3 className="font-bold text-white">📜 Terms of Service</h3></div>
              <button onClick={() => setShowTermsOfService(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-gray-300 text-sm">
              <p className="text-gray-500">Effective: January 2026</p>
              <div><h4 className="font-semibold text-white mb-1">1. Acceptance</h4><p>By using Ink Relam, you agree to these terms.</p></div>
              <div><h4 className="font-semibold text-white mb-1">2. Accounts</h4><p>Accurate info required. Must be 13+. One account per person.</p></div>
              <div><h4 className="font-semibold text-white mb-1">3. Content</h4><p>Original content only. No hate speech, explicit, or illegal content.</p></div>
              <div><h4 className="font-semibold text-white mb-1">4. Prohibited</h4><p>No hacking, bots, fake accounts, harassment, or plagiarism.</p></div>
              <div><h4 className="font-semibold text-white mb-1">5. Termination</h4><p>Violations result in account termination.</p></div>
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <p className="text-purple-300 text-xs">By using Ink Relam, you agree to these Terms. Happy Reading! 💜</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {notificationOpen && <div className="fixed inset-0 z-40" onClick={() => setNotificationOpen(false)} />}
    </div>
  );
}

/* NOVEL MODAL */
function NovelModal({ novel, onClose, onNavigate, requireAuth }: { novel: Novel; onClose: () => void; onNavigate: (page: string, data?: any) => void; requireAuth?: (message: string) => void }) {
  const { currentUser, likeNovel, followNovel, favoriteNovel, likeCharacter, getNovelById } = useStore();
  const [showAllChars, setShowAllChars] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);

  const fresh = getNovelById(novel.id) || novel;
  const pubChapters = fresh.chapters.filter(c => c.status === 'published');
  const isLiked = currentUser ? fresh.likes.includes(currentUser.id) : false;
  const isFollowing = currentUser ? fresh.followers.includes(currentUser.id) : false;
  const isFav = currentUser ? fresh.favorites.includes(currentUser.id) : false;

  const handleAction = (action: string, fn: () => void) => {
    if (!currentUser && requireAuth) { requireAuth(`Login to ${action}`); return; }
    fn();
  };

  const handleChapterClick = (chapterId: string) => {
    onNavigate('chapter', { novel: fresh, chapterId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#12121f] sm:rounded-2xl overflow-hidden border-t sm:border border-purple-500/30 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"><X className="w-5 h-5" /></button>
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="flex flex-col sm:flex-row gap-5 p-5">
            <div className="flex-shrink-0 w-36 mx-auto sm:mx-0">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 shadow-xl">
                {fresh.coverImage ? <img src={fresh.coverImage} alt={fresh.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600"><BookOpen className="w-12 h-12 text-white/50" /></div>}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-1">{fresh.title}</h1>
              <p className="text-gray-400 text-sm mb-3">by {fresh.authorName}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => handleAction('follow', () => followNovel(fresh.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isFollowing ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-300 border border-slate-700'}`}
                ><Users className="w-3 h-3 inline mr-1" />{isFollowing ? 'Following' : 'Follow'}</button>
                <button onClick={() => handleAction('like', () => likeNovel(fresh.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isLiked ? 'bg-pink-600 text-white' : 'bg-slate-800 text-gray-300 border border-slate-700'}`}
                ><Heart className={`w-3 h-3 inline mr-1 ${isLiked ? 'fill-current' : ''}`} />{fresh.likes.length}</button>
                <button onClick={() => handleAction('favorite', () => favoriteNovel(fresh.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isFav ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-300 border border-slate-700'}`}
                ><Star className={`w-3 h-3 inline mr-1 ${isFav ? 'fill-current' : ''}`} />Fav</button>
                <button onClick={() => handleAction('message', () => { onNavigate('inbox', { userId: fresh.authorId }); onClose(); })}
                  className="px-3 py-1.5 bg-slate-800 text-gray-300 rounded-lg text-xs border border-slate-700"
                ><MessageSquare className="w-3 h-3 inline mr-1" />Chat</button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                <span><Eye className="w-3 h-3 inline mr-1" />{fresh.views}</span>
                <span><BookOpen className="w-3 h-3 inline mr-1" />{pubChapters.length}ch</span>
                <span><Users className="w-3 h-3 inline mr-1" />{fresh.followers.length}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {fresh.categories.map(c => <span key={c} className="px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full text-[10px]">{c}</span>)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{fresh.synopsis || fresh.description}</p>
            </div>
          </div>
          {fresh.characters.length > 0 && (
            <div className="px-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">Characters</h3>
                {fresh.characters.length > 3 && <button onClick={() => setShowAllChars(true)} className="text-xs text-purple-400">See All</button>}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {fresh.characters.slice(0, 3).map(ch => (
                  <div key={ch.id} className="flex-shrink-0 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden mb-1">
                      {ch.image ? <img src={ch.image} alt={ch.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg text-gray-500">{ch.name.charAt(0)}</div>}
                    </div>
                    <p className="text-[10px] text-white">{ch.name}</p>
                    <button onClick={() => handleAction('like character', () => likeCharacter(fresh.id, ch.id))} className="text-[10px] text-gray-400">
                      <Heart className={`w-3 h-3 inline mr-0.5 ${currentUser && ch.likes.includes(currentUser.id) ? 'fill-pink-400 text-pink-400' : ''}`} />{ch.likes.length}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm">Chapters</h3>
              {pubChapters.length > 5 && <button onClick={() => setShowAllChapters(!showAllChapters)} className="text-xs text-purple-400">{showAllChapters ? 'Less' : `All (${pubChapters.length})`}</button>}
            </div>
            <div className="space-y-1.5">
              {(showAllChapters ? pubChapters : pubChapters.slice(0, 5)).map(ch => (
                <button key={ch.id} onClick={() => handleChapterClick(ch.id)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-purple-500/10 rounded-lg text-left border border-slate-700/30 hover:border-purple-500/30 transition-all"
                >
                  <span className="text-white text-xs">Ch.{ch.chapterNumber}: {ch.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              ))}
            </div>
            {pubChapters.length === 0 && <p className="text-gray-500 text-center text-xs py-4">No chapters yet</p>}
          </div>
        </div>
      </div>
      {showAllChars && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAllChars(false)} />
          <div className="relative w-full max-w-lg max-h-[70vh] bg-[#12121f] rounded-2xl overflow-hidden border border-purple-500/30">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20"><h3 className="font-semibold text-white">All Characters</h3><button onClick={() => setShowAllChars(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="p-4 overflow-y-auto max-h-[55vh] grid grid-cols-3 gap-3">
              {fresh.characters.map(ch => (
                <div key={ch.id} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-700 overflow-hidden mb-1">
                    {ch.image ? <img src={ch.image} alt={ch.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl text-gray-500">{ch.name.charAt(0)}</div>}
                  </div>
                  <p className="text-xs text-white">{ch.name}</p>
                  <button onClick={() => handleAction('like character', () => likeCharacter(fresh.id, ch.id))} className="text-[10px] text-gray-400">
                    <Heart className={`w-3 h-3 inline mr-0.5 ${currentUser && ch.likes.includes(currentUser.id) ? 'fill-pink-400 text-pink-400' : ''}`} />{ch.likes.length}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
