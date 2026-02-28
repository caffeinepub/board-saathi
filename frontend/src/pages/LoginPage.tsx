import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, User, Lock, Mail, School, BookOpen, Loader2 } from 'lucide-react';
import { useRegister, useGetCallerUserProfile, storeUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import MadeByDevBadge from '../components/MadeByDevBadge';

// suppress unused import warnings
void Eye; void EyeOff;

type AuthMode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, loginStatus, identity, clear } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const registerMutation = useRegister();

  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    school: '',
    studentClass: '10',
  });
  const [error, setError] = useState('');

  const isLoggingIn = loginStatus === 'logging-in';
  const isAuthenticated = !!identity;

  // If authenticated and profile loaded, redirect
  if (isAuthenticated && profileFetched && !profileLoading) {
    if (userProfile) {
      storeUser({ name: userProfile.name, username: userProfile.username });
      navigate({ to: '/dashboard' });
    }
  }

  const handleLogin = async () => {
    setError('');
    try {
      await login();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      } else {
        setError(message);
      }
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!formData.username || !formData.name || !formData.school) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isAuthenticated) {
      setError('Please login with Internet Identity first.');
      return;
    }
    try {
      await registerMutation.mutateAsync({
        username: formData.username,
        name: formData.name,
        school: formData.school,
        studentClass: BigInt(formData.studentClass),
      });
      storeUser({ name: formData.name, username: formData.username });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleGuestMode = () => {
    storeUser({ name: 'Guest Student', username: 'guest' });
    navigate({ to: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex flex-col items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/assets/generated/board-saathi-logo.dim_256x256.png"
              alt="Board Saathi"
              className="w-20 h-20 rounded-2xl shadow-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/generated/board-saathi-icon.dim_512x512.png';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Board Saathi</h1>
          <p className="text-gray-500 text-sm mt-1">Your CBSE Class 10 Study Companion</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {(['login', 'register'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  mode === m
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User size={28} className="text-teal-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Sign in securely with</p>
                <p className="text-base font-semibold text-gray-800">Internet Identity</p>
                <p className="text-xs text-gray-400 mt-1">No password needed — secure & private</p>
              </div>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Sign In with Internet Identity
                  </>
                )}
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">or</div>
              </div>
              <button
                onClick={handleGuestMode}
                className="w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Continue as Guest
              </button>
              <button
                onClick={() => setMode('forgot')}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Forgot your identity? Get help →
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-4">
              {!isAuthenticated && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <strong>Step 1:</strong> First sign in with Internet Identity, then complete your profile below.
                </div>
              )}
              {!isAuthenticated && (
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  {isLoggingIn ? 'Connecting...' : 'Connect Internet Identity'}
                </button>
              )}
              {isAuthenticated && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Identity connected! Complete your profile below.
                </div>
              )}
              <div className="space-y-3">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Username *"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
                <div className="relative">
                  <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="School Name *"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.studentClass}
                    onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                  >
                    <option value="10">Class 10</option>
                    <option value="9">Class 9</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleRegister}
                disabled={registerMutation.isPending || !isAuthenticated}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                <Lock size={28} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Recover Internet Identity</h3>
                <p className="text-sm text-gray-500">
                  Internet Identity uses your device's biometrics or security key. If you've lost access, visit{' '}
                  <a
                    href="https://identity.ic0.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 underline"
                  >
                    identity.ic0.app
                  </a>{' '}
                  to recover your identity.
                </p>
              </div>
              <button
                onClick={() => setMode('login')}
                className="text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Made by DEV badge */}
        <div className="flex justify-center mt-6">
          <MadeByDevBadge />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'board-saathi')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
