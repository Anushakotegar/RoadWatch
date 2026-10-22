
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface SignInProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
}

export const SignIn: React.FC<SignInProps> = ({
  onSuccess,
  onNavigateToSignUp,
}) => {
  const { showToast, setCurrentUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showToast('Please enter your email address and password.', 'error');
      return;
    }

    setLoading(true);

    try {
      const user = await authService.signIn(email, password);

      setCurrentUser(user);
      showToast(`Welcome to RoadWatch, ${user.name}!`, 'success');
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.';

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    showToast(
      'Password reset is not configured yet. Please contact the application administrator if you cannot sign in.',
      'info'
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12 rounded bg-[#0D9488] flex items-center justify-center text-white mx-auto shadow-sm">
          <Shield className="w-6 h-6 fill-white text-[#0D9488]" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 font-display">
          Sign In to RoadWatch
        </h2>

        <p className="mt-1 text-center text-xs text-slate-500">
          Civic infrastructure reporting, tracking, and municipal review
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address
              </label>

              <input
                id="signin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="signin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] pr-8 disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs text-[#0D9488] font-semibold hover:underline cursor-pointer disabled:opacity-60"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded transition-colors cursor-pointer shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              disabled={loading}
              className="text-[#0D9488] font-semibold hover:underline cursor-pointer disabled:opacity-60"
            >
              Sign Up
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Sign-in requests are verified by the RoadWatch server. Your password
            is never saved in browser local storage.
          </p>
        </div>
      </div>
    </div>
  );
};
