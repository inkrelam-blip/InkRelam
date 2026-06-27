// Types for NovelNEST platform

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  role: 'reader' | 'author';
  createdAt: string;
  lastLoginAt: string;
  followingNovels: string[];
  favoriteNovels: string[];
  followers: string[];
  following: string[];
}

export interface Character {
  id: string;
  name: string;
  image: string;
  description: string;
  likes: string[];
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  authorNote: string;
  chapterNumber: number;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  chapterId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: string[];
  createdAt: string;
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  synopsis: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'ongoing' | 'completed';
  isPublished: boolean;
  characters: Character[];
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: string[];
  followers: string[];
  favorites: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'comment' | 'new_chapter' | 'comment_like' | 'novel_like' | 'novel_follow';
  title: string;
  message: string;
  link?: string;
  relatedNovelId?: string;
  relatedChapterId?: string;
  relatedUserId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export const GENRES = [
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Mystery',
  'Thriller',
  'Horror',
  'Adventure',
  'Comedy',
  'Drama',
  'Action',
  'Historical',
  'Slice of Life',
  'Supernatural',
  'Isekai',
  'Martial Arts',
  'Wuxia',
  'Xuanhuan',
  'Urban',
  'Sports',
  'Psychological'
];
