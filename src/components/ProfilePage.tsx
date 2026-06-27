import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Save, BookOpen, Users, Heart, Eye } from 'lucide-react';
import { useStore } from '../store';

interface ProfilePageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { currentUser, updateUser, getNovelsByAuthor, novels } = useStore();
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [saving, setSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const myNovels = getNovelsByAuthor(currentUser.id);
  const followingNovels = novels.filter(n => n.followers.includes(currentUser.id));
  const favoriteNovels = novels.filter(n => n.favorites.includes(currentUser.id));
  
  const totalViews = myNovels.reduce((sum, n) => sum + n.views, 0);
  const totalLikes = myNovels.reduce((sum, n) => sum + n.likes.length, 0);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSaving(true);
    updateUser({
      displayName,
      bio,
      avatar
    });
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white">Profile</h1>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold cursor-pointer overflow-hidden"
            >
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {currentUser.role === 'author' && (
            <>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <BookOpen className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{myNovels.length}</p>
                <p className="text-xs text-gray-400">Novels</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{totalViews}</p>
                <p className="text-xs text-gray-400">Views</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{totalLikes}</p>
                <p className="text-xs text-gray-400">Likes</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{currentUser.followers.length}</p>
                <p className="text-xs text-gray-400">Followers</p>
              </div>
            </>
          )}
          {currentUser.role === 'reader' && (
            <>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{followingNovels.length}</p>
                <p className="text-xs text-gray-400">Following</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center">
                <Heart className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{favoriteNovels.length}</p>
                <p className="text-xs text-gray-400">Favorites</p>
              </div>
            </>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={currentUser.username}
              disabled
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white">
              {currentUser.role === 'author' ? '✍️ Author' : '📖 Reader'}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Member Since</label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-gray-500">
              {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
