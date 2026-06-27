import { ArrowLeft, BookOpen, Eye, Heart, MessageSquare, Users, PenTool, Trash2 } from 'lucide-react';
import { useStore } from '../store';

interface DashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { currentUser, getNovelsByAuthor, deleteNovel } = useStore();
  
  if (!currentUser) return null;
  
  const myNovels = getNovelsByAuthor(currentUser.id);
  
  // Calculate stats
  const totalViews = myNovels.reduce((sum, n) => sum + n.views, 0);
  const totalLikes = myNovels.reduce((sum, n) => sum + n.likes.length, 0);
  const totalChapters = myNovels.reduce((sum, n) => sum + n.chapters.length, 0);
  const totalComments = myNovels.reduce((sum, n) => 
    sum + n.chapters.reduce((cSum, c) => cSum + c.comments.length, 0), 0
  );
  const totalFollowers = myNovels.reduce((sum, n) => sum + n.followers.length, 0);
  const avgViews = myNovels.length > 0 ? Math.round(totalViews / myNovels.length) : 0;

  const handleDeleteNovel = (novelId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      deleteNovel(novelId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white">My Dashboard</h1>
          
          <button
            onClick={() => onNavigate('write')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Write Novel</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalViews}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm">Avg Views</span>
            </div>
            <p className="text-2xl font-bold text-white">{avgViews}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-pink-400 mb-2">
              <Heart className="w-5 h-5" />
              <span className="text-sm">Total Likes</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalLikes}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Comments</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalComments}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Followers</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalFollowers}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">Chapters</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalChapters}</p>
          </div>
        </div>

        {/* My Novels */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">My Novels ({myNovels.length})</h2>
          
          {myNovels.length === 0 ? (
            <div className="text-center py-16 bg-slate-800 rounded-xl">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't written any novels yet</p>
              <button
                onClick={() => onNavigate('write')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Start Writing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myNovels.map(novel => {
                const novelComments = novel.chapters.reduce((sum, c) => sum + c.comments.length, 0);
                return (
                  <div
                    key={novel.id}
                    className="flex gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Cover */}
                    <div className="w-20 h-28 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                      {novel.coverImage ? (
                        <img src={novel.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white truncate">{novel.title}</h3>
                          <p className="text-sm text-gray-400">
                            {novel.chapters.filter(c => c.status === 'published').length} published • 
                            {novel.chapters.filter(c => c.status === 'draft').length} drafts
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          novel.isPublished 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {novel.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {novel.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" /> {novel.likes.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> {novelComments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {novel.followers.length}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onNavigate('write', { editNovel: novel })}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNovel(novel.id, novel.title)}
                          className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
