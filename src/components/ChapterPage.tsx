import { useState, useEffect } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Heart, 
  MessageSquare, Send, BookOpen, Lock
} from 'lucide-react';
import { useStore } from '../store';
import { Novel } from '../types';

interface ChapterPageProps {
  novel: Novel;
  chapterId: string;
  onNavigate: (page: string, data?: any) => void;
  requireAuth?: (message: string) => void;
}

// Track chapters read by guest (stored in localStorage)
const getGuestChaptersRead = (): string[] => {
  const stored = localStorage.getItem('guestChaptersRead');
  return stored ? JSON.parse(stored) : [];
};

const addGuestChapterRead = (chapterId: string) => {
  const chapters = getGuestChaptersRead();
  if (!chapters.includes(chapterId)) {
    chapters.push(chapterId);
    localStorage.setItem('guestChaptersRead', JSON.stringify(chapters));
  }
};

const GUEST_CHAPTER_LIMIT = 5;

export default function ChapterPage({ novel, chapterId, onNavigate, requireAuth }: ChapterPageProps) {
  const { 
    currentUser, viewChapter, addComment, likeComment, getNovelById
  } = useStore();
  
  const [newComment, setNewComment] = useState('');
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const freshNovel = getNovelById(novel.id) || novel;
  const publishedChapters = freshNovel.chapters
    .filter(c => c.status === 'published')
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
  
  const currentChapter = freshNovel.chapters.find(c => c.id === currentChapterId);
  const currentIndex = publishedChapters.findIndex(c => c.id === currentChapterId);
  const prevChapter = currentIndex > 0 ? publishedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < publishedChapters.length - 1 ? publishedChapters[currentIndex + 1] : null;

  // Check if guest can read this chapter
  const guestChaptersRead = getGuestChaptersRead();
  const canGuestRead = currentUser || guestChaptersRead.length < GUEST_CHAPTER_LIMIT || guestChaptersRead.includes(currentChapterId);

  // View count only after 30 seconds + not author's own novel
  useEffect(() => {
    if (!currentChapterId || !canGuestRead) return;
    
    // Track guest chapters immediately (for free chapter limit)
    if (!currentUser) {
      addGuestChapterRead(currentChapterId);
    }
    
    // Don't count view if author viewing own novel
    const isAuthor = currentUser && freshNovel.authorId === currentUser.id;
    if (isAuthor) return;
    
    // Count view after 30 seconds
    const timer = setTimeout(() => {
      viewChapter(novel.id, currentChapterId);
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [currentChapterId]);

  // Show login prompt if guest limit reached
  useEffect(() => {
    if (!currentUser && !canGuestRead) {
      setShowLoginPrompt(true);
    }
  }, [currentUser, canGuestRead]);

  const handleSubmitComment = () => {
    if (!currentUser) {
      requireAuth?.('Login to comment');
      return;
    }
    if (!newComment.trim()) return;
    addComment(novel.id, currentChapterId, newComment.trim());
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    if (!currentUser) {
      requireAuth?.('Login to like comments');
      return;
    }
    likeComment(novel.id, currentChapterId, commentId);
  };

  const navigateToChapter = (chId: string) => {
    // Check guest limit for next chapter
    if (!currentUser) {
      const guestRead = getGuestChaptersRead();
      if (guestRead.length >= GUEST_CHAPTER_LIMIT && !guestRead.includes(chId)) {
        setShowLoginPrompt(true);
        return;
      }
    }
    setCurrentChapterId(chId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Chapter not found</p>
          <button onClick={() => onNavigate('home')} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  // Login prompt for guest limit
  if (showLoginPrompt && !currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-slate-800/50 p-8 rounded-2xl border border-purple-500/20">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You've Read {GUEST_CHAPTER_LIMIT} Free Chapters!</h2>
          <p className="text-gray-400 mb-6">Create a free account to continue reading unlimited chapters, save your progress, and join our community.</p>
          <div className="space-y-3">
            <button onClick={() => onNavigate('auth')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-purple-500/30"
            >
              Create Free Account
            </button>
            <button onClick={() => onNavigate('home')}
              className="w-full py-3 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600"
            >
              Back to Home
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Already have an account? <button onClick={() => onNavigate('auth')} className="text-purple-400 hover:underline">Sign In</button>
          </p>
        </div>
      </div>
    );
  }

  const freshChapter = freshNovel.chapters.find(c => c.id === currentChapterId) || currentChapter;
  const remainingFreeChapters = currentUser ? '∞' : Math.max(0, GUEST_CHAPTER_LIMIT - guestChaptersRead.length);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400 hover:text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-400 truncate max-w-[180px]">{freshNovel.title}</p>
            <p className="text-xs text-gray-500">Chapter {freshChapter.chapterNumber}</p>
          </div>
          {!currentUser && (
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
              {remainingFreeChapters} free left
            </span>
          )}
          {currentUser && <div className="w-16" />}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Chapter Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Chapter {freshChapter.chapterNumber}: {freshChapter.title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
          {freshChapter.views} views • {formatDate(freshChapter.publishedAt || freshChapter.createdAt)}
        </p>

        {/* Chapter Content */}
        <article className="prose prose-invert max-w-none mb-8">
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
            {freshChapter.content}
          </p>
        </article>

        {/* Author's Note */}
        {freshChapter.authorNote && (
          <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-sm text-purple-400 font-medium mb-2">📝 Author's Note:</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{freshChapter.authorNote}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => prevChapter && navigateToChapter(prevChapter.id)}
            disabled={!prevChapter}
            className="flex-1 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>
          <button onClick={() => nextChapter && navigateToChapter(nextChapter.id)}
            disabled={!nextChapter}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Section */}
        <section className="border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({freshChapter.comments.length})
          </h3>

          {/* Add Comment */}
          <div className="flex gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : currentUser ? (
                currentUser.displayName.charAt(0).toUpperCase()
              ) : '?'}
            </div>
            <div className="flex-1 flex gap-2">
              <input type="text" value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "Write a comment..." : "Login to comment..."}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                onClick={() => !currentUser && requireAuth?.('Login to comment')}
              />
              <button onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {freshChapter.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              freshChapter.comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{comment.userName}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.content}</p>
                    <button onClick={() => handleLikeComment(comment.id)}
                      className="mt-2 flex items-center gap-1 text-gray-500 hover:text-pink-400 text-sm"
                    >
                      <Heart className={`w-4 h-4 ${currentUser && comment.likes.includes(currentUser.id) ? 'fill-pink-400 text-pink-400' : ''}`} />
                      <span>{comment.likes.length}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
