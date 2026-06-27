import { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, X, Feather, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStore } from '../store';

interface AuthPageProps {
  onSuccess: () => void;
  onClose?: () => void;
  isModal?: boolean;
  onAdminLogin?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = '299290629175-bt6933ghl360hv69a35sipbr2gq05ucu.apps.googleusercontent.com';
const ADMIN_EMAIL = 'inkrelam@gmail.com';
const ADMIN_PASSWORD = 'Shyam@8745';
const MAX_SIGNUP_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

// Signup attempt tracker
function getSignupAttempts(): { count: number; blockedUntil: number | null } {
  const saved = localStorage.getItem('inkRelam_signupAttempts');
  if (saved) return JSON.parse(saved);
  return { count: 0, blockedUntil: null };
}

function recordSignupAttempt() {
  const data = getSignupAttempts();
  data.count += 1;
  if (data.count >= MAX_SIGNUP_ATTEMPTS) {
    data.blockedUntil = Date.now() + BLOCK_DURATION_MS;
  }
  localStorage.setItem('inkRelam_signupAttempts', JSON.stringify(data));
}

function resetSignupAttempts() {
  localStorage.setItem('inkRelam_signupAttempts', JSON.stringify({ count: 0, blockedUntil: null }));
}

function isSignupBlocked(): { blocked: boolean; remainingHours: number } {
  const data = getSignupAttempts();
  if (data.blockedUntil && Date.now() < data.blockedUntil) {
    const remaining = Math.ceil((data.blockedUntil - Date.now()) / (1000 * 60 * 60));
    return { blocked: true, remainingHours: remaining };
  }
  if (data.blockedUntil && Date.now() >= data.blockedUntil) {
    resetSignupAttempts();
  }
  return { blocked: false, remainingHours: 0 };
}

export default function AuthPage({ onSuccess, onClose, isModal = false, onAdminLogin }: AuthPageProps) {
  const { login, signup, users } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'author' as 'reader' | 'author'
  });

  // Check signup block status
  const blockStatus = isSignupBlocked();

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });
    }
  }, []);

  const handleGoogleResponse = (response: any) => {
    if (response.credential) {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      const existingUser = users.find(u => u.email === email);
      if (existingUser) { login(email, 'google-auth'); onSuccess(); }
      else {
        if (blockStatus.blocked) { setError(`Account creation blocked. Try again in ${blockStatus.remainingHours} hours.`); setGoogleLoading(false); return; }
        const success = signup(email, name.replace(/\s+/g, '_').toLowerCase(), 'google-auth', formData.role);
        if (success) { resetSignupAttempts(); onSuccess(); }
        else setError('Failed to create account');
      }
    }
    setGoogleLoading(false);
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError('');
    if (window.google) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const tokenClient = window.google!.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID, scope: 'email profile',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const info = await res.json();
                  const existingUser = users.find(u => u.email === info.email);
                  if (existingUser) { login(info.email, 'google-auth'); onSuccess(); }
                  else {
                    if (blockStatus.blocked) { setError(`Account creation blocked. Try again in ${blockStatus.remainingHours} hours.`); setGoogleLoading(false); return; }
                    const success = signup(info.email, (info.name || info.email.split('@')[0]).replace(/\s+/g, '_').toLowerCase(), 'google-auth', formData.role);
                    if (success) { resetSignupAttempts(); onSuccess(); }
                    else setError('Failed to create account');
                  }
                } catch { setError('Failed to get Google account info'); }
              }
              setGoogleLoading(false);
            },
            error_callback: () => { setGoogleLoading(false); setError('Google Sign-In cancelled'); }
          });
          tokenClient.requestAccessToken();
        }
      });
    } else { setGoogleLoading(false); setError('Google Sign-In not available'); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Admin login
    if (isLogin && formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      onAdminLogin?.();
      return;
    }
    
    if (isLogin) {
      if (login(formData.email, formData.password)) onSuccess();
      else setError('Invalid email or password');
    } else {
      // Check if blocked
      if (blockStatus.blocked) {
        setError(`Too many signup attempts. Account creation blocked for ${blockStatus.remainingHours} hours.`);
        return;
      }
      if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
      if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      
      recordSignupAttempt();
      
      if (signup(formData.email, formData.username, formData.password, formData.role)) {
        resetSignupAttempts();
        onSuccess();
      } else {
        const updatedBlock = isSignupBlocked();
        if (updatedBlock.blocked) {
          setError(`Too many attempts! Account creation blocked for 48 hours.`);
        } else {
          const remaining = MAX_SIGNUP_ATTEMPTS - getSignupAttempts().count;
          setError(`Email or username already exists. ${remaining} attempts remaining.`);
        }
      }
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.email === forgotEmail);
    if (!user) {
      setError('No account found with this email');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    // In this localStorage-based system, we just let the user set new password and login
    // The password is not actually stored (we match by email), so just login them
    login(forgotEmail, newPassword);
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotPassword(false);
      onSuccess();
    }, 1500);
  };

  // Forgot Password Screen
  if (showForgotPassword) {
    return (
      <div className={isModal ? '' : 'min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-3 sm:p-4'}>
        <div className="w-full max-w-[420px] mx-auto">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-2xl relative">
            {(onClose || isModal) && (
              <button onClick={onClose} className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors z-10">
                <X className="w-5 h-5" />
              </button>
            )}
            
            {forgotSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Password Reset!</h3>
                <p className="text-gray-400 text-sm">Logging you in...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <Lock className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-white mb-1">Forgot Password?</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Enter your email and set a new password</p>
                </div>

                {error && <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs">{error}</div>}

                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Your Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                        placeholder="New password (min 6 chars)"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg text-sm"
                  >Reset Password & Login</button>
                </form>

                <button onClick={() => { setShowForgotPassword(false); setError(''); }}
                  className="w-full text-center text-xs text-purple-400 hover:underline mt-3"
                >← Back to Sign In</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? '' : 'min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-3 sm:p-4'}>
      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-2xl relative">
          {(onClose || isModal) && (
            <button onClick={onClose} className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors z-10">
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Logo */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <Feather className="w-5 h-5 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Ink Relam</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">Your home for endless stories</p>
          </div>

          {/* Blocked message */}
          {!isLogin && blockStatus.blocked && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-xs font-medium">Account Creation Blocked</p>
                <p className="text-red-300 text-xs mt-0.5">Too many signup attempts. Try again in {blockStatus.remainingHours} hours.</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex mb-3 sm:mb-4 bg-slate-700/50 rounded-lg p-1">
            <button onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >Sign In</button>
            <button onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${!isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >Create Account</button>
          </div>

          {/* Google Sign-In */}
          <button onClick={handleGoogleSignIn} disabled={googleLoading || (!isLogin && blockStatus.blocked)}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-2.5 bg-white text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all mb-3 disabled:opacity-50 text-xs sm:text-sm"
          >
            {googleLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
            <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-slate-600" /><span className="text-xs text-gray-500">or</span><div className="flex-1 h-px bg-slate-600" />
          </div>

          {error && <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" required value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    placeholder="Choose username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-9 pr-10 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button type="submit"
              disabled={!isLogin && blockStatus.blocked}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 text-sm disabled:opacity-50"
            >{isLogin ? 'Sign In' : 'Create Account'}</button>
          </form>

          {/* Forgot Password */}
          {isLogin && (
            <button onClick={() => { setShowForgotPassword(true); setError(''); }}
              className="w-full text-center text-xs text-purple-400 hover:underline mt-2"
            >Forgot Password?</button>
          )}

          {(onClose || isModal) && (
            <p className="text-center text-xs text-gray-500 mt-3">
              Just browsing? <button onClick={onClose} className="text-purple-400 hover:underline">Continue as guest</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
