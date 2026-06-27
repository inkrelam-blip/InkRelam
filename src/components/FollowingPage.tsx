import { ArrowLeft, BookOpen, Eye, Heart, Users } from 'lucide-react';
import { useStore } from '../store';

interface FollowingPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function FollowingPage({ onNavigate }: FollowingPageProps) {
  const { currentUser, novels, followNovel } = useStore();
  
  if (!currentUser) return null;
  
  const followingNovels = novels.filter(n => n.followers.includes(currentUser.id));

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white ml-4">Following</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {followingNovels.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">You're not following any novels yet</p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Discover Novels
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {followingNovels.map(novel => (
              <div
                key={novel.id}
                className="cursor-pointer group"
                onClick={() => onNavigate('novel', { novel })}
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2">
                  {novel.coverImage ? (
                    <img 
                      src={novel.coverImage} 
                      alt={novel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  
                  {/* Unfollow button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      followNovel(novel.id);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Following ✓
                  </button>
                </div>
                
                <h3 className="font-medium text-white text-sm truncate">{novel.title}</h3>
                <p className="text-xs text-gray-400 truncate">{novel.authorName}</p>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {novel.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {novel.likes.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {novel.chapters.filter(c => c.status === 'published').length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
