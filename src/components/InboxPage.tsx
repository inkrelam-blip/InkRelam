import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useStore } from '../store';

interface InboxPageProps {
  onNavigate: (page: string, data?: any) => void;
  initialUserId?: string;
}

export default function InboxPage({ onNavigate, initialUserId }: InboxPageProps) {
  const { 
    currentUser, 
    users, 
    getConversations, 
    getMessages, 
    sendMessage,
    getUserById
  } = useStore();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId || null);
  const [newMessage, setNewMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = getConversations();
  
  // Get messages for current conversation
  const currentMessages = selectedConversationId 
    ? getMessages(selectedConversationId)
    : [];
  
  // Get the other user in conversation
  const getOtherUser = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv || !currentUser) return null;
    const otherId = conv.participants.find(p => p !== currentUser.id);
    return otherId ? getUserById(otherId) : null;
  };

  const selectedUser = selectedUserId ? getUserById(selectedUserId) : null;

  // Find or create conversation with selected user
  useEffect(() => {
    if (selectedUserId && currentUser) {
      const existingConv = conversations.find(c => 
        c.participants.includes(selectedUserId) && c.participants.includes(currentUser.id)
      );
      if (existingConv) {
        setSelectedConversationId(existingConv.id);
      } else {
        setSelectedConversationId(null);
      }
    }
  }, [selectedUserId, conversations, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUserId) return;
    sendMessage(selectedUserId, newMessage.trim());
    setNewMessage('');
  };

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id &&
    (u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.username.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
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
          
          <h1 className="text-lg font-semibold text-white">Inbox</h1>
          
          <button
            onClick={() => setShowUserSearch(true)}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            New Chat
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Conversations List */}
        <div className={`w-full sm:w-80 border-r border-slate-700 ${selectedUserId ? 'hidden sm:block' : ''}`}>
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-medium text-white">Messages</h2>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {conversations.map(conv => {
                const otherUser = getOtherUser(conv.id);
                if (!otherUser) return null;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setSelectedUserId(otherUser.id);
                    }}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors text-left ${
                      selectedConversationId === conv.id ? 'bg-slate-800' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                      {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        otherUser.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white truncate">{otherUser.displayName}</p>
                        <span className="text-xs text-gray-500">
                          {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden sm:flex' : ''}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="sm:hidden text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{selectedUser.displayName}</p>
                  <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  currentMessages.map(msg => {
                    const isMine = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isMine 
                            ? 'bg-purple-600 text-white rounded-br-sm' 
                            : 'bg-slate-700 text-white rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-purple-200' : 'text-gray-400'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowUserSearch(false)} />
          <div className="relative w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white">New Conversation</h3>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setShowUserSearch(false);
                      setUserSearch('');
                    }}
                    className="w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">{user.displayName}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
