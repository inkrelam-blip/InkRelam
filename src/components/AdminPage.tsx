import { useState, useRef } from 'react';
import { 
  ArrowLeft, Download, Upload, Database, Users, BookOpen, 
  Heart, MessageSquare, Search, Shield,
  CheckCircle, AlertTriangle, ChevronDown, TrendingUp,
  Calendar, Clock, Globe, Activity, BarChart3
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (page: string, data?: any) => void;
}

// Visitor tracking
interface VisitorData {
  totalVisits: number;
  dailyVisits: { [date: string]: number };
  monthlyVisits: { [month: string]: number };
  lastVisit: string;
  uniqueVisitors: string[];
}

function getVisitorData(): VisitorData {
  const saved = localStorage.getItem('novelNestVisitors');
  if (saved) return JSON.parse(saved);
  return { totalVisits: 0, dailyVisits: {}, monthlyVisits: {}, lastVisit: '', uniqueVisitors: [] };
}

function recordVisit() {
  const data = getVisitorData();
  const today = new Date().toISOString().split('T')[0]; // 2026-01-15
  const month = today.substring(0, 7); // 2026-01
  
  data.totalVisits += 1;
  data.dailyVisits[today] = (data.dailyVisits[today] || 0) + 1;
  data.monthlyVisits[month] = (data.monthlyVisits[month] || 0) + 1;
  data.lastVisit = new Date().toISOString();
  
  // Track unique visitors by random ID
  let visitorId = localStorage.getItem('novelNestVisitorId');
  if (!visitorId) {
    visitorId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('novelNestVisitorId', visitorId);
  }
  if (!data.uniqueVisitors.includes(visitorId)) {
    data.uniqueVisitors.push(visitorId);
  }
  
  localStorage.setItem('novelNestVisitors', JSON.stringify(data));
}

// Record visit on page load
recordVisit();

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'novels' | 'backup'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeData = JSON.parse(localStorage.getItem('novelNestStore') || '{}');
  const allUsers = storeData.users || [];
  const allNovels = storeData.novels || [];
  const allNotifications = storeData.notifications || [];
  const allMessages = storeData.messages || [];
  const visitorData = getVisitorData();

  // Stats

  const totalChapters = allNovels.reduce((s: number, n: any) => s + (n.chapters?.length || 0), 0);
  const totalComments = allNovels.reduce((s: number, n: any) => 
    s + (n.chapters?.reduce((cs: number, c: any) => cs + (c.comments?.length || 0), 0) || 0), 0);
  const totalLikes = allNovels.reduce((s: number, n: any) => s + (n.likes?.length || 0), 0);

  // Daily analytics - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  // Monthly analytics - last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().substring(0, 7);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visitorData.dailyVisits[todayStr] || 0;
  const thisMonth = new Date().toISOString().substring(0, 7);
  const thisMonthVisits = visitorData.monthlyVisits[thisMonth] || 0;

  // Max values for bar chart scaling
  const maxDaily = Math.max(...last7Days.map(d => visitorData.dailyVisits[d] || 0), 1);
  const maxMonthly = Math.max(...last6Months.map(m => visitorData.monthlyVisits[m] || 0), 1);

  const filteredUsers = allUsers.filter((u: any) =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNovels = allNovels.filter((n: any) =>
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportData = () => {
    const data = localStorage.getItem('novelNestStore');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inkrealm-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          JSON.parse(data);
          localStorage.setItem('novelNestStore', data);
          setImportSuccess(true);
          setTimeout(() => { window.location.reload(); }, 2000);
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getUserNovels = (userId: string) => allNovels.filter((n: any) => n.authorId === userId);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <style>{`
        html{scroll-behavior:smooth}
        *{scrollbar-width:thin;scrollbar-color:rgba(168,85,247,0.3) transparent}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(168,85,247,0.3);border-radius:10px}
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-red-500/20">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          </div>
          <button onClick={handleExportData}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center gap-1"
          >
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 overflow-x-auto">
          {(['overview', 'analytics', 'users', 'novels', 'backup'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' : tab === 'analytics' ? '📈 Visitors' : tab === 'users' ? '👥 Users' : tab === 'novels' ? '📚 Novels' : '💾 Backup'}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 sm:px-6 py-6">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'Total Visits', value: visitorData.totalVisits, icon: Globe, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5' },
                { label: 'Today', value: todayVisits, icon: Activity, color: 'text-green-400', bg: 'from-green-500/20 to-green-500/5' },
                { label: 'This Month', value: thisMonthVisits, icon: Calendar, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-cyan-500/5' },
                { label: 'Unique Visitors', value: visitorData.uniqueVisitors.length, icon: Users, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5' },
                { label: 'Users', value: allUsers.length, icon: Users, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-500/5' },
                { label: 'Novels', value: allNovels.length, icon: BookOpen, color: 'text-pink-400', bg: 'from-pink-500/20 to-pink-500/5' },
                { label: 'Likes', value: totalLikes, icon: Heart, color: 'text-red-400', bg: 'from-red-500/20 to-red-500/5' },
                { label: 'Comments', value: totalComments, icon: MessageSquare, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-500/5' },
              ].map(stat => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-xl p-3 sm:p-4 border border-slate-700/30`}>
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-xl sm:text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Mini Daily Chart */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" /> Daily Visits (Last 7 Days)
              </h3>
              <div className="flex items-end gap-2 h-32">
                {last7Days.map(day => {
                  const count = visitorData.dailyVisits[day] || 0;
                  const height = maxDaily > 0 ? (count / maxDaily) * 100 : 0;
                  const isToday = day === todayStr;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400">{count}</span>
                      <div className="w-full rounded-t-lg transition-all duration-500" style={{ 
                        height: `${Math.max(height, 4)}%`,
                        background: isToday 
                          ? 'linear-gradient(to top, #a855f7, #ec4899)' 
                          : 'linear-gradient(to top, rgba(168,85,247,0.4), rgba(236,72,153,0.2))'
                      }} />
                      <span className={`text-[10px] ${isToday ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                        {getDayName(day)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Users & Novels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Recent Users</h3>
                <div className="space-y-2">
                  {allUsers.slice(-5).reverse().map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{u.displayName}</p>
                        <p className="text-gray-500 text-xs truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'author' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{u.role}</span>
                    </div>
                  ))}
                  {allUsers.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No users yet</p>}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-pink-400" /> Recent Novels</h3>
                <div className="space-y-2">
                  {allNovels.slice(-5).reverse().map((n: any) => (
                    <div key={n.id} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                      <div className="w-10 h-14 rounded bg-slate-700 overflow-hidden flex-shrink-0">
                        {n.coverImage ? <img src={n.coverImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-gray-500" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{n.title}</p>
                        <p className="text-gray-500 text-xs">{n.authorName} • {n.chapters?.length || 0} ch • {n.views || 0} views</p>
                      </div>
                    </div>
                  ))}
                  {allNovels.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No novels yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Visitor Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                <Globe className="w-6 h-6 text-emerald-400 mb-2" />
                <p className="text-3xl font-bold text-white">{visitorData.totalVisits.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Total Visits (All Time)</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-4 border border-green-500/20">
                <Activity className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-3xl font-bold text-white">{todayVisits.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Today's Visits</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl p-4 border border-cyan-500/20">
                <Calendar className="w-6 h-6 text-cyan-400 mb-2" />
                <p className="text-3xl font-bold text-white">{thisMonthVisits.toLocaleString()}</p>
                <p className="text-xs text-gray-400">This Month</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                <Users className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-3xl font-bold text-white">{visitorData.uniqueVisitors.length.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Unique Visitors</p>
              </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" /> Daily Visits — Last 7 Days
              </h3>
              <div className="flex items-end gap-3 h-48">
                {last7Days.map(day => {
                  const count = visitorData.dailyVisits[day] || 0;
                  const height = maxDaily > 0 ? (count / maxDaily) * 100 : 0;
                  const isToday = day === todayStr;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-xs text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div className={`w-full rounded-xl transition-all duration-500 cursor-pointer group-hover:opacity-80 ${isToday ? 'shadow-lg shadow-purple-500/30' : ''}`}
                        style={{ 
                          height: `${Math.max(height, 6)}%`,
                          background: isToday 
                            ? 'linear-gradient(to top, #7c3aed, #ec4899)' 
                            : 'linear-gradient(to top, rgba(124,58,237,0.5), rgba(236,72,153,0.25))'
                        }} 
                      />
                      <div className="text-center">
                        <p className={`text-xs font-medium ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>{getDayName(day)}</p>
                        <p className="text-[10px] text-gray-600">{day.substring(5)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Chart */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Monthly Visits — Last 6 Months
              </h3>
              <div className="flex items-end gap-3 h-48">
                {last6Months.map(month => {
                  const count = visitorData.monthlyVisits[month] || 0;
                  const height = maxMonthly > 0 ? (count / maxMonthly) * 100 : 0;
                  const isThisMonth = month === thisMonth;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-xs text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div className={`w-full rounded-xl transition-all duration-500 cursor-pointer group-hover:opacity-80 ${isThisMonth ? 'shadow-lg shadow-cyan-500/30' : ''}`}
                        style={{
                          height: `${Math.max(height, 6)}%`,
                          background: isThisMonth
                            ? 'linear-gradient(to top, #06b6d4, #3b82f6)'
                            : 'linear-gradient(to top, rgba(6,182,212,0.4), rgba(59,130,246,0.2))'
                        }}
                      />
                      <div className="text-center">
                        <p className={`text-xs font-medium ${isThisMonth ? 'text-cyan-400' : 'text-gray-400'}`}>{getMonthName(month)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Daily Data Table */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" /> All Daily Records
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-gray-400 py-2 px-3">Date</th>
                      <th className="text-left text-gray-400 py-2 px-3">Day</th>
                      <th className="text-right text-gray-400 py-2 px-3">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(visitorData.dailyVisits)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 30)
                      .map(([date, count]) => (
                      <tr key={date} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="text-white py-2 px-3">{date}</td>
                        <td className="text-gray-400 py-2 px-3">{getDayName(date)}</td>
                        <td className="text-right text-white py-2 px-3 font-medium">{(count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Object.keys(visitorData.dailyVisits).length === 0 && (
                  <p className="text-gray-500 text-center py-6">No visit data recorded yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700/30">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search users by name, email, username..."
                  className="bg-transparent text-white placeholder-gray-500 focus:outline-none flex-1 text-sm"
                />
              </div>
              <span className="text-sm text-gray-400 whitespace-nowrap">{filteredUsers.length} users</span>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user: any) => {
                const userNovels = getUserNovels(user.id);
                const isExpanded = expandedUser === user.id;
                return (
                  <div key={user.id} className="bg-slate-800/50 rounded-xl border border-slate-700/30 overflow-hidden">
                    <button onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          : user.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium">{user.displayName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'author' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span>
                        </div>
                        <p className="text-gray-400 text-sm truncate">@{user.username} • {user.email}</p>
                        <p className="text-gray-600 text-xs">Joined: {formatDate(user.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white text-sm">{userNovels.length} novels</p>
                        <ChevronDown className={`w-4 h-4 text-gray-500 mx-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-700/30 bg-slate-800/30">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                          {[
                            { label: 'Followers', value: user.followers?.length || 0 },
                            { label: 'Following', value: user.following?.length || 0 },
                            { label: 'Fav Novels', value: user.favoriteNovels?.length || 0 },
                            { label: 'Following Novels', value: user.followingNovels?.length || 0 },
                          ].map(s => (
                            <div key={s.label} className="bg-slate-700/30 rounded-lg p-2">
                              <p className="text-xs text-gray-500">{s.label}</p>
                              <p className="text-white font-bold">{s.value}</p>
                            </div>
                          ))}
                        </div>
                        {userNovels.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-2">Novels:</p>
                            <div className="space-y-1">
                              {userNovels.map((novel: any) => (
                                <div key={novel.id} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                                  <div className="w-8 h-11 rounded bg-slate-600 overflow-hidden flex-shrink-0">
                                    {novel.coverImage ? <img src={novel.coverImage} alt="" className="w-full h-full object-cover" /> : null}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs truncate">{novel.title}</p>
                                    <p className="text-gray-500 text-[10px]">{novel.chapters?.length || 0} ch • {novel.views || 0} views • {novel.likes?.length || 0} likes</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 p-2 bg-slate-700/20 rounded-lg">
                          <p className="text-xs text-gray-500">Bio: <span className="text-gray-400">{user.bio || 'No bio set'}</span></p>
                          <p className="text-xs text-gray-500 mt-1">Last Login: <span className="text-gray-400">{formatDate(user.lastLoginAt)}</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NOVELS */}
        {activeTab === 'novels' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700/30">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search novels by title, author..."
                  className="bg-transparent text-white placeholder-gray-500 focus:outline-none flex-1 text-sm"
                />
              </div>
              <span className="text-sm text-gray-400 whitespace-nowrap">{filteredNovels.length} novels</span>
            </div>

            <div className="space-y-3">
              {filteredNovels.map((novel: any) => (
                <div key={novel.id} className="flex gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="w-16 h-22 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                    {novel.coverImage ? <img src={novel.coverImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-6 h-6 text-gray-500" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{novel.title}</h4>
                    <p className="text-gray-400 text-sm">by {novel.authorName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {novel.categories?.map((c: string) => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded">{c}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>{novel.chapters?.length || 0} chapters</span>
                      <span>{novel.views || 0} views</span>
                      <span>{novel.likes?.length || 0} likes</span>
                      <span>{novel.followers?.length || 0} followers</span>
                      <span>{novel.isPublished ? '✅ Published' : '📝 Draft'}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">Created: {formatDate(novel.createdAt)}</p>
                  </div>
                </div>
              ))}
              {filteredNovels.length === 0 && <p className="text-gray-500 text-center py-8">No novels found</p>}
            </div>
          </div>
        )}

        {/* BACKUP */}
        {activeTab === 'backup' && (
          <div className="max-w-lg mx-auto space-y-6">
            {importSuccess ? (
              <div className="text-center py-12">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Data Restored! ✅</h3>
                <p className="text-gray-400">Reloading page...</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <Database className="w-16 h-16 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-1">Data Backup & Recovery</h3>
                  <p className="text-gray-400 text-sm">Complete database: {allUsers.length} users, {allNovels.length} novels, {totalChapters} chapters, {allNotifications.length} notifications, {allMessages.length} messages.</p>
                </div>

                <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><Download className="w-5 h-5" /> Export Full Database</h4>
                  <p className="text-gray-400 text-sm mb-3">Downloads complete backup as JSON file.</p>
                  <button onClick={handleExportData}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  ><Download className="w-5 h-5" /> Download Complete Backup</button>
                </div>

                <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2"><Upload className="w-5 h-5" /> Import & Restore</h4>
                  <p className="text-gray-400 text-sm mb-3">Upload backup file to restore all data.</p>
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  ><Upload className="w-5 h-5" /> Upload Backup File</button>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Warning:</strong> Importing will overwrite ALL existing data permanently. Always download a backup first.</span>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
