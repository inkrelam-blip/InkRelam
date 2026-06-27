import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Novel, Message, Conversation, Chapter, Comment, AppNotification } from './types';

interface StoreState {
  currentUser: User | null;
  users: User[];
  novels: Novel[];
  notifications: AppNotification[];
  conversations: Conversation[];
  messages: Message[];
}

interface StoreContextType extends StoreState {
  login: (email: string, password: string) => boolean;
  signup: (email: string, username: string, password: string, role: 'reader' | 'author') => boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  createNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'followers' | 'favorites' | 'chapters'>) => Novel;
  updateNovel: (novelId: string, updates: Partial<Novel>) => void;
  deleteNovel: (novelId: string) => void;
  getNovelById: (novelId: string) => Novel | undefined;
  getNovelsByAuthor: (authorId: string) => Novel[];
  getPublishedNovels: () => Novel[];
  addChapter: (novelId: string, chapter: Omit<Chapter, 'id' | 'novelId' | 'createdAt' | 'updatedAt' | 'views' | 'comments'>) => void;
  updateChapter: (novelId: string, chapterId: string, updates: Partial<Chapter>) => void;
  publishChapter: (novelId: string, chapterId: string) => void;
  likeNovel: (novelId: string) => void;
  followNovel: (novelId: string) => void;
  favoriteNovel: (novelId: string) => void;
  likeCharacter: (novelId: string, characterId: string) => void;
  addComment: (novelId: string, chapterId: string, content: string) => void;
  likeComment: (novelId: string, chapterId: string, commentId: string) => void;
  viewChapter: (novelId: string, chapterId: string) => void;
  getUnreadNotifications: () => AppNotification[];
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  requestNotificationPermission: () => void;
  sendMessage: (receiverId: string, content: string) => void;
  getConversations: () => Conversation[];
  getMessages: (conversationId: string) => Message[];
  markMessageRead: (messageId: string) => void;
  followUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
const SESSION_EXPIRY_DAYS = 3;

// Send browser notification
function sendBrowserNotification(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (_e) {
      // Silent fail for environments that don't support notifications
    }
  }
}

// Create a notification helper
function createNotif(
  userId: string,
  type: AppNotification['type'],
  title: string,
  message: string,
  relatedNovelId?: string,
  relatedChapterId?: string,
  relatedUserId?: string
): AppNotification {
  return {
    id: generateId(),
    userId,
    type,
    title,
    message,
    relatedNovelId,
    relatedChapterId,
    relatedUserId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    const saved = localStorage.getItem('novelNestStore');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currentUser) {
        const lastLogin = new Date(parsed.currentUser.lastLoginAt);
        const diffDays = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > SESSION_EXPIRY_DAYS) parsed.currentUser = null;
      }
      return parsed;
    }
    return { currentUser: null, users: [], novels: [], notifications: [], conversations: [], messages: [] };
  });

  useEffect(() => {
    localStorage.setItem('novelNestStore', JSON.stringify(state));
  }, [state]);

  const requestNotificationPermission = useCallback(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const login = useCallback((email: string, _password: string): boolean => {
    const user = state.users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
      setState(prev => ({
        ...prev,
        currentUser: updatedUser,
        users: prev.users.map(u => u.id === user.id ? updatedUser : u)
      }));
      return true;
    }
    return false;
  }, [state.users]);

  const signup = useCallback((email: string, username: string, _password: string, role: 'reader' | 'author'): boolean => {
    if (state.users.some(u => u.email === email || u.username === username)) return false;
    const newUser: User = {
      id: generateId(), email, username, displayName: username, bio: '', avatar: '', role,
      createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
      followingNovels: [], favoriteNovels: [], followers: [], following: []
    };
    setState(prev => ({ ...prev, currentUser: newUser, users: [...prev.users, newUser] }));
    return true;
  }, [state.users]);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, currentUser: null }));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const updatedUser = { ...prev.currentUser, ...updates };
      return {
        ...prev,
        currentUser: updatedUser,
        users: prev.users.map(u => u.id === prev.currentUser!.id ? updatedUser : u)
      };
    });
  }, []);

  const createNovel = useCallback((novelData: Omit<Novel, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'followers' | 'favorites' | 'chapters'>): Novel => {
    const novel: Novel = {
      ...novelData, id: generateId(), chapters: [], views: 0, likes: [], followers: [], favorites: [],
      isPublished: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    setState(prev => ({ ...prev, novels: [...prev.novels, novel] }));
    return novel;
  }, []);

  const updateNovel = useCallback((novelId: string, updates: Partial<Novel>) => {
    setState(prev => ({
      ...prev,
      novels: prev.novels.map(n => n.id === novelId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
    }));
  }, []);

  const deleteNovel = useCallback((novelId: string) => {
    setState(prev => ({ ...prev, novels: prev.novels.filter(n => n.id !== novelId) }));
  }, []);

  const getNovelById = useCallback((novelId: string) => state.novels.find(n => n.id === novelId), [state.novels]);
  const getNovelsByAuthor = useCallback((authorId: string) => state.novels.filter(n => n.authorId === authorId), [state.novels]);
  const getPublishedNovels = useCallback(() => state.novels.filter(n => n.isPublished && n.chapters.some(c => c.status === 'published')), [state.novels]);

  const addChapter = useCallback((novelId: string, chapterData: Omit<Chapter, 'id' | 'novelId' | 'createdAt' | 'updatedAt' | 'views' | 'comments'>) => {
    const chapter: Chapter = {
      ...chapterData, id: generateId(), novelId, views: 0, comments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };

    setState(prev => {
      const newNotifications = [...prev.notifications];
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          const updatedNovel = { ...n, chapters: [...n.chapters, chapter], updatedAt: new Date().toISOString() };
          
          if (chapterData.status === 'published') {
            updatedNovel.isPublished = true;
            // Notify all followers about new chapter
            n.followers.forEach(followerId => {
              const notif = createNotif(followerId, 'new_chapter', '📖 New Chapter!',
                `"${n.title}" released: ${chapterData.title}`, novelId, chapter.id);
              newNotifications.push(notif);
              sendBrowserNotification(notif.title, notif.message);
            });
          }
          return updatedNovel;
        }
        return n;
      });
      return { ...prev, novels: updatedNovels, notifications: newNotifications };
    });
  }, []);

  const updateChapter = useCallback((novelId: string, chapterId: string, updates: Partial<Chapter>) => {
    setState(prev => ({
      ...prev,
      novels: prev.novels.map(n => n.id === novelId ? {
        ...n, chapters: n.chapters.map(c => c.id === chapterId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c),
        updatedAt: new Date().toISOString()
      } : n)
    }));
  }, []);

  const publishChapter = useCallback((novelId: string, chapterId: string) => {
    setState(prev => {
      const newNotifications = [...prev.notifications];
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          const chapter = n.chapters.find(c => c.id === chapterId);
          // Notify followers
          n.followers.forEach(followerId => {
            const notif = createNotif(followerId, 'new_chapter', '📖 New Chapter!',
              `"${n.title}" released: ${chapter?.title || 'New chapter'}`, novelId, chapterId);
            newNotifications.push(notif);
            sendBrowserNotification(notif.title, notif.message);
          });
          return {
            ...n, isPublished: true, updatedAt: new Date().toISOString(),
            chapters: n.chapters.map(c => c.id === chapterId ? { ...c, status: 'published' as const, publishedAt: new Date().toISOString() } : c)
          };
        }
        return n;
      });
      return { ...prev, novels: updatedNovels, notifications: newNotifications };
    });
  }, []);

  const likeNovel = useCallback((novelId: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const uid = prev.currentUser.id;
      const newNotifications = [...prev.notifications];
      
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          const isLiked = n.likes.includes(uid);
          // Send notification to author when LIKED (not unliked)
          if (!isLiked && n.authorId !== uid) {
            const notif = createNotif(n.authorId, 'novel_like', '❤️ Novel Liked!',
              `${prev.currentUser!.displayName} liked "${n.title}"`, novelId, undefined, uid);
            newNotifications.push(notif);
            sendBrowserNotification(notif.title, notif.message);
          }
          return { ...n, likes: isLiked ? n.likes.filter(id => id !== uid) : [...n.likes, uid] };
        }
        return n;
      });
      return { ...prev, novels: updatedNovels, notifications: newNotifications };
    });
  }, []);

  const followNovel = useCallback((novelId: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const uid = prev.currentUser.id;
      const newNotifications = [...prev.notifications];
      
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          const isFollowing = n.followers.includes(uid);
          if (!isFollowing && n.authorId !== uid) {
            const notif = createNotif(n.authorId, 'novel_follow', '👥 New Follower!',
              `${prev.currentUser!.displayName} followed "${n.title}"`, novelId, undefined, uid);
            newNotifications.push(notif);
            sendBrowserNotification(notif.title, notif.message);
          }
          return { ...n, followers: isFollowing ? n.followers.filter(id => id !== uid) : [...n.followers, uid] };
        }
        return n;
      });
      
      const updatedUsers = prev.users.map(u => {
        if (u.id === uid) {
          const isFollowing = u.followingNovels.includes(novelId);
          return { ...u, followingNovels: isFollowing ? u.followingNovels.filter(id => id !== novelId) : [...u.followingNovels, novelId] };
        }
        return u;
      });
      const updatedCurrentUser = updatedUsers.find(u => u.id === uid);
      return { ...prev, novels: updatedNovels, users: updatedUsers, currentUser: updatedCurrentUser || prev.currentUser, notifications: newNotifications };
    });
  }, []);

  const favoriteNovel = useCallback((novelId: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const uid = prev.currentUser.id;
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          const isFav = n.favorites.includes(uid);
          return { ...n, favorites: isFav ? n.favorites.filter(id => id !== uid) : [...n.favorites, uid] };
        }
        return n;
      });
      const updatedUsers = prev.users.map(u => {
        if (u.id === uid) {
          const isFav = u.favoriteNovels.includes(novelId);
          return { ...u, favoriteNovels: isFav ? u.favoriteNovels.filter(id => id !== novelId) : [...u.favoriteNovels, novelId] };
        }
        return u;
      });
      const updatedCurrentUser = updatedUsers.find(u => u.id === uid);
      return { ...prev, novels: updatedNovels, users: updatedUsers, currentUser: updatedCurrentUser || prev.currentUser };
    });
  }, []);

  const likeCharacter = useCallback((novelId: string, characterId: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const uid = prev.currentUser.id;
      return {
        ...prev,
        novels: prev.novels.map(n => n.id === novelId ? {
          ...n, characters: n.characters.map(c => c.id === characterId ? {
            ...c, likes: c.likes.includes(uid) ? c.likes.filter(id => id !== uid) : [...c.likes, uid]
          } : c)
        } : n)
      };
    });
  }, []);

  const addComment = useCallback((novelId: string, chapterId: string, content: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const comment: Comment = {
        id: generateId(), chapterId, userId: prev.currentUser!.id,
        userName: prev.currentUser!.displayName, userAvatar: prev.currentUser!.avatar,
        content, likes: [], createdAt: new Date().toISOString()
      };
      
      const newNotifications = [...prev.notifications];
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          // Notify author about new comment
          if (n.authorId !== prev.currentUser!.id) {
            const chapter = n.chapters.find(c => c.id === chapterId);
            const notif = createNotif(n.authorId, 'comment', '💬 New Comment!',
              `${prev.currentUser!.displayName} commented on "${chapter?.title || 'your chapter'}"`,
              novelId, chapterId, prev.currentUser!.id);
            newNotifications.push(notif);
            sendBrowserNotification(notif.title, notif.message);
          }
          return { ...n, chapters: n.chapters.map(c => c.id === chapterId ? { ...c, comments: [...c.comments, comment] } : c) };
        }
        return n;
      });
      return { ...prev, novels: updatedNovels, notifications: newNotifications };
    });
  }, []);

  const likeComment = useCallback((novelId: string, chapterId: string, commentId: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const uid = prev.currentUser.id;
      const newNotifications = [...prev.notifications];
      
      const updatedNovels = prev.novels.map(n => {
        if (n.id === novelId) {
          return {
            ...n, chapters: n.chapters.map(c => {
              if (c.id === chapterId) {
                return {
                  ...c, comments: c.comments.map(comment => {
                    if (comment.id === commentId) {
                      const isLiked = comment.likes.includes(uid);
                      if (!isLiked && comment.userId !== uid) {
                        const notif = createNotif(comment.userId, 'comment_like', '👍 Comment Liked!',
                          `${prev.currentUser!.displayName} liked your comment`, novelId, chapterId, uid);
                        newNotifications.push(notif);
                        sendBrowserNotification(notif.title, notif.message);
                      }
                      return { ...comment, likes: isLiked ? comment.likes.filter(id => id !== uid) : [...comment.likes, uid] };
                    }
                    return comment;
                  })
                };
              }
              return c;
            })
          };
        }
        return n;
      });
      return { ...prev, novels: updatedNovels, notifications: newNotifications };
    });
  }, []);

  const viewChapter = useCallback((novelId: string, chapterId: string) => {
    setState(prev => {
      // Don't count view if author is viewing their own novel
      const novel = prev.novels.find(n => n.id === novelId);
      if (novel && prev.currentUser && novel.authorId === prev.currentUser.id) return prev;
      
      return {
        ...prev,
        novels: prev.novels.map(n => n.id === novelId ? {
          ...n, views: n.views + 1,
          chapters: n.chapters.map(c => c.id === chapterId ? { ...c, views: c.views + 1 } : c)
        } : n)
      };
    });
  }, []);

  const getUnreadNotifications = useCallback(() => {
    if (!state.currentUser) return [];
    return state.notifications.filter(n => n.userId === state.currentUser!.id && !n.isRead);
  }, [state.currentUser, state.notifications]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      return {
        ...prev,
        notifications: prev.notifications.map(n => n.userId === prev.currentUser!.id ? { ...n, isRead: true } : n)
      };
    });
  }, []);

  const addNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const notification: AppNotification = { ...notificationData, id: generateId(), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, notifications: [...prev.notifications, notification] }));
    sendBrowserNotification(notification.title, notification.message);
  }, []);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const message: Message = {
        id: generateId(), senderId: prev.currentUser.id, receiverId, content,
        isRead: false, createdAt: new Date().toISOString()
      };
      let conversation = prev.conversations.find(c =>
        c.participants.includes(prev.currentUser!.id) && c.participants.includes(receiverId)
      );
      const updatedConversations = conversation
        ? prev.conversations.map(c => c.id === conversation!.id ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() } : c)
        : [...prev.conversations, { id: generateId(), participants: [prev.currentUser!.id, receiverId], lastMessage: message, updatedAt: new Date().toISOString() }];
      return { ...prev, messages: [...prev.messages, message], conversations: updatedConversations };
    });
  }, []);

  const getConversations = useCallback(() => {
    if (!state.currentUser) return [];
    return state.conversations.filter(c => c.participants.includes(state.currentUser!.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.currentUser, state.conversations]);

  const getMessages = useCallback((conversationId: string) => {
    const conv = state.conversations.find(c => c.id === conversationId);
    if (!conv) return [];
    return state.messages.filter(m => conv.participants.includes(m.senderId) && conv.participants.includes(m.receiverId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [state.conversations, state.messages]);

  const markMessageRead = useCallback((messageId: string) => {
    setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === messageId ? { ...m, isRead: true } : m) }));
  }, []);

  const followUser = useCallback((userId: string) => {
    setState(prev => {
      if (!prev.currentUser || prev.currentUser.id === userId) return prev;
      const isFollowing = prev.currentUser.following.includes(userId);
      const newNotifications = [...prev.notifications];
      
      if (!isFollowing) {
        const notif = createNotif(userId, 'follow', '👥 New Follower!',
          `${prev.currentUser.displayName} started following you`, undefined, undefined, prev.currentUser.id);
        newNotifications.push(notif);
        sendBrowserNotification(notif.title, notif.message);
      }
      
      const updatedUsers = prev.users.map(u => {
        if (u.id === prev.currentUser!.id) {
          return { ...u, following: isFollowing ? u.following.filter(id => id !== userId) : [...u.following, userId] };
        }
        if (u.id === userId) {
          return { ...u, followers: isFollowing ? u.followers.filter(id => id !== prev.currentUser!.id) : [...u.followers, prev.currentUser!.id] };
        }
        return u;
      });
      return { ...prev, users: updatedUsers, currentUser: updatedUsers.find(u => u.id === prev.currentUser!.id) || prev.currentUser, notifications: newNotifications };
    });
  }, []);

  const getUserById = useCallback((userId: string) => state.users.find(u => u.id === userId), [state.users]);

  return (
    <StoreContext.Provider value={{
      ...state, login, signup, logout, updateUser,
      createNovel, updateNovel, deleteNovel, getNovelById, getNovelsByAuthor, getPublishedNovels,
      addChapter, updateChapter, publishChapter,
      likeNovel, followNovel, favoriteNovel, likeCharacter, addComment, likeComment, viewChapter,
      getUnreadNotifications, markNotificationRead, markAllNotificationsRead, addNotification,
      requestNotificationPermission,
      sendMessage, getConversations, getMessages, markMessageRead,
      followUser, getUserById
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
