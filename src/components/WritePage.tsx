import { useState, useRef } from 'react';
import { 
  ArrowLeft, Upload, X, Plus, Trash2, Save, 
  Send, BookOpen
} from 'lucide-react';
import { useStore } from '../store';
import { Novel, Character, GENRES } from '../types';

interface WritePageProps {
  onNavigate: (page: string, data?: any) => void;
  editNovel?: Novel;
}

export default function WritePage({ onNavigate, editNovel }: WritePageProps) {
  const { currentUser, createNovel, updateNovel, addChapter, updateChapter, publishChapter, getNovelById } = useStore();
  
  const [step, setStep] = useState<'details' | 'chapters'>('details');
  const [saving, setSaving] = useState(false);
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(editNovel || null);
  
  // Novel Details
  const [title, setTitle] = useState(editNovel?.title || '');
  const [description, setDescription] = useState(editNovel?.description || '');
  const [synopsis, setSynopsis] = useState(editNovel?.synopsis || '');
  const [coverImage, setCoverImage] = useState(editNovel?.coverImage || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(editNovel?.categories || []);
  const [characters, setCharacters] = useState<Character[]>(editNovel?.characters || []);
  
  // Chapter Writing
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [authorNote, setAuthorNote] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const charImageInputRef = useRef<HTMLInputElement>(null);
  const [editingCharIndex, setEditingCharIndex] = useState<number | null>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newChars = [...characters];
        newChars[index].image = event.target?.result as string;
        setCharacters(newChars);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (genre: string) => {
    if (selectedCategories.includes(genre)) {
      setSelectedCategories(prev => prev.filter(g => g !== genre));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories(prev => [...prev, genre]);
    }
  };

  const addCharacter = () => {
    if (characters.length < 10) {
      setCharacters(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 15),
        name: '',
        image: '',
        description: '',
        likes: []
      }]);
    }
  };

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const newChars = [...characters];
    (newChars[index] as any)[field] = value;
    setCharacters(newChars);
  };

  const removeCharacter = (index: number) => {
    setCharacters(prev => prev.filter((_, i) => i !== index));
  };

  const saveNovelDetails = () => {
    if (!currentUser || !title.trim()) return;
    
    setSaving(true);
    
    if (currentNovel) {
      updateNovel(currentNovel.id, {
        title,
        description,
        synopsis,
        coverImage,
        categories: selectedCategories,
        characters: characters.filter(c => c.name.trim())
      });
      const updated = getNovelById(currentNovel.id);
      if (updated) setCurrentNovel(updated);
    } else {
      const novel = createNovel({
        title,
        description,
        synopsis,
        coverImage,
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        categories: selectedCategories,
        tags: [],
        status: 'ongoing',
        isPublished: false,
        characters: characters.filter(c => c.name.trim())
      });
      setCurrentNovel(novel);
    }
    
    setSaving(false);
    setStep('chapters');
  };

  const saveChapterAsDraft = () => {
    if (!currentNovel || !chapterTitle.trim()) return;
    
    const chapterNumber = currentNovel.chapters.length + 1;
    
    if (editingChapterId) {
      updateChapter(currentNovel.id, editingChapterId, {
        title: chapterTitle,
        content: chapterContent,
        authorNote,
        status: 'draft'
      });
    } else {
      addChapter(currentNovel.id, {
        title: chapterTitle,
        content: chapterContent,
        authorNote,
        chapterNumber,
        status: 'draft'
      });
    }
    
    // Refresh novel data
    const updated = getNovelById(currentNovel.id);
    if (updated) setCurrentNovel(updated);
    
    // Clear form
    setChapterTitle('');
    setChapterContent('');
    setAuthorNote('');
    setEditingChapterId(null);
  };

  const publishCurrentChapter = () => {
    if (!currentNovel || !chapterTitle.trim()) return;
    
    const chapterNumber = editingChapterId 
      ? currentNovel.chapters.find(c => c.id === editingChapterId)?.chapterNumber || currentNovel.chapters.length + 1
      : currentNovel.chapters.length + 1;
    
    if (editingChapterId) {
      updateChapter(currentNovel.id, editingChapterId, {
        title: chapterTitle,
        content: chapterContent,
        authorNote
      });
      publishChapter(currentNovel.id, editingChapterId);
    } else {
      addChapter(currentNovel.id, {
        title: chapterTitle,
        content: chapterContent,
        authorNote,
        chapterNumber,
        status: 'published',
        publishedAt: new Date().toISOString()
      });
    }
    
    // Refresh novel data
    const updated = getNovelById(currentNovel.id);
    if (updated) setCurrentNovel(updated);
    
    // Clear form
    setChapterTitle('');
    setChapterContent('');
    setAuthorNote('');
    setEditingChapterId(null);
  };

  const editChapter = (chapterId: string) => {
    const chapter = currentNovel?.chapters.find(c => c.id === chapterId);
    if (chapter) {
      setChapterTitle(chapter.title);
      setChapterContent(chapter.content);
      setAuthorNote(chapter.authorNote);
      setEditingChapterId(chapterId);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Please login to write novels</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white">
            {editNovel ? 'Edit Novel' : 'Write Novel'}
          </h1>
          
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Tabs */}
        <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setStep('details')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              step === 'details'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Novel Details
          </button>
          <button
            onClick={() => currentNovel && setStep('chapters')}
            disabled={!currentNovel}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              step === 'chapters'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            Write Chapters
          </button>
        </div>

        {step === 'details' ? (
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cover Image</label>
              <div className="flex items-start gap-4">
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="w-32 h-44 rounded-lg bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors overflow-hidden"
                >
                  {coverImage ? (
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-500">Upload</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                {coverImage && (
                  <button
                    onClick={() => setCoverImage('')}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="Enter novel title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Short Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Brief description (shown in cards)"
              />
            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Synopsis</label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Full synopsis of your novel"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Categories (Select up to 5) - {selectedCategories.length}/5
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    onClick={() => toggleCategory(genre)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategories.includes(genre)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Characters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">
                  Characters ({characters.length}/10)
                </label>
                {characters.length < 10 && (
                  <button
                    onClick={addCharacter}
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="w-4 h-4" /> Add Character
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {characters.map((char, index) => (
                  <div key={char.id} className="flex gap-3 p-3 bg-slate-800 rounded-lg">
                    <div 
                      onClick={() => {
                        setEditingCharIndex(index);
                        charImageInputRef.current?.click();
                      }}
                      className="w-16 h-16 rounded-full bg-slate-700 flex-shrink-0 cursor-pointer overflow-hidden"
                    >
                      {char.image ? (
                        <img src={char.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                        placeholder="Character Name"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="text"
                        value={char.description}
                        onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                        placeholder="Brief description"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      onClick={() => removeCharacter(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <input
                ref={charImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => editingCharIndex !== null && handleCharImageUpload(e, editingCharIndex)}
                className="hidden"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={saveNovelDetails}
              disabled={!title.trim() || saving}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : currentNovel ? 'Save Changes' : 'Save & Write Chapters'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Novel Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
              <div className="w-12 h-16 rounded bg-slate-700 overflow-hidden">
                {currentNovel?.coverImage ? (
                  <img src={currentNovel.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{currentNovel?.title}</h3>
                <p className="text-sm text-gray-400">
                  {currentNovel?.chapters.length || 0} chapters | 
                  {currentNovel?.isPublished ? ' Published' : ' Draft'}
                </p>
              </div>
            </div>

            {/* Existing Chapters */}
            {currentNovel && currentNovel.chapters.length > 0 && (
              <div>
                <h3 className="text-sm text-gray-400 mb-2">Your Chapters</h3>
                <div className="space-y-2">
                  {currentNovel.chapters.map(chapter => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                    >
                      <div>
                        <p className="text-white">Ch. {chapter.chapterNumber}: {chapter.title}</p>
                        <p className="text-xs text-gray-500">
                          {chapter.status === 'published' ? '✓ Published' : '📝 Draft'}
                        </p>
                      </div>
                      <button
                        onClick={() => editChapter(chapter.id)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter Editor */}
            <div className="space-y-4">
              <h3 className="text-sm text-gray-400">
                {editingChapterId ? 'Edit Chapter' : 'Write New Chapter'}
              </h3>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Chapter Title</label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter chapter title"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Content</label>
                <textarea
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Write your chapter content here..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Author's Note (Optional)</label>
                <textarea
                  value={authorNote}
                  onChange={(e) => setAuthorNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Add a note to your readers..."
                />
              </div>

              {/* Preview Button */}
              <button
                onClick={() => setShowPreview(true)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Preview Chapter
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={saveChapterAsDraft}
                  disabled={!chapterTitle.trim()}
                  className="flex-1 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Draft
                </button>
                <button
                  onClick={publishCurrentChapter}
                  disabled={!chapterTitle.trim() || !chapterContent.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white">Chapter Preview</h3>
              <button onClick={() => setShowPreview(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h2 className="text-xl font-bold text-white mb-4">{chapterTitle || 'Untitled'}</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{chapterContent || 'No content yet...'}</p>
              </div>
              {authorNote && (
                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-400 font-medium mb-2">Author's Note:</p>
                  <p className="text-gray-300 text-sm">{authorNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
