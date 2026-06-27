import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import AuthPage from './components/AuthPage';
import HomePage from './components/HomePage';
import WritePage from './components/WritePage';
import ChapterPage from './components/ChapterPage';
import DashboardPage from './components/DashboardPage';
import FollowingPage from './components/FollowingPage';
import FavoritesPage from './components/FavoritesPage';
import InboxPage from './components/InboxPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import { Novel } from './types';

type Page = 'home' | 'write' | 'chapter' | 'dashboard' | 'following' | 'favorites' | 'inbox' | 'profile' | 'settings' | 'auth' | 'admin';

interface PageData {
  novel?: Novel;
  chapterId?: string;
  editNovel?: Novel;
  userId?: string;
}

function AppContent() {
  const { currentUser, requestNotificationPermission } = useStore();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  
  // Ask notification permission when user first logs in
  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission();
    }
  }, [currentUser, requestNotificationPermission]);
  const [pageData, setPageData] = useState<PageData>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const handleNavigate = (page: string, data?: any) => {
    const protectedPages = ['write', 'dashboard', 'following', 'favorites', 'inbox', 'profile', 'settings'];
    
    if (protectedPages.includes(page) && !currentUser) {
      setAuthMessage(page === 'write' ? 'Login to write your novel' : 'Login to access this feature');
      setShowAuthModal(true);
      return;
    }
    
    if (page === 'auth') {
      setAuthMessage('');
      setShowAuthModal(true);
      return;
    }
    
    setCurrentPage(page as Page);
    setPageData(data || {});
  };

  const requireAuth = (message: string) => {
    setAuthMessage(message);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthMessage('');
  };

  const handleAdminLogin = () => {
    closeAuthModal();
    setCurrentPage('admin');
  };

  // Admin page
  if (currentPage === 'admin') {
    return <AdminPage onNavigate={handleNavigate} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'write':
        if (!currentUser) return <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
        return <WritePage onNavigate={handleNavigate} editNovel={pageData.editNovel} />;
      case 'chapter':
        if (pageData.novel && pageData.chapterId)
          return <ChapterPage novel={pageData.novel} chapterId={pageData.chapterId} onNavigate={handleNavigate} requireAuth={requireAuth} />;
        return <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
      case 'dashboard':
        return currentUser ? <DashboardPage onNavigate={handleNavigate} /> : <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
      case 'following':
        return currentUser ? <FollowingPage onNavigate={handleNavigate} /> : <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
      case 'favorites':
        return currentUser ? <FavoritesPage onNavigate={handleNavigate} /> : <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
      case 'inbox':
        return currentUser ? <InboxPage onNavigate={handleNavigate} initialUserId={pageData.userId} /> : <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
      case 'profile': case 'settings':
        return currentUser ? <ProfilePage onNavigate={handleNavigate} /> : <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
      default:
        return <HomePage onNavigate={handleNavigate} requireAuth={requireAuth} />;
    }
  };

  return (
    <div className="relative">
      {renderPage()}
      
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuthModal} />
          <div className="relative z-10 w-full max-w-[420px] max-h-[90vh] overflow-y-auto sm:mx-4">
            {authMessage && (
              <div className="mb-2 p-2 sm:p-3 bg-purple-600 text-white text-center rounded-lg text-xs sm:text-sm mx-3 sm:mx-0">
                {authMessage}
              </div>
            )}
            <AuthPage 
              onSuccess={closeAuthModal} 
              onClose={closeAuthModal}
              isModal={true}
              onAdminLogin={handleAdminLogin}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
