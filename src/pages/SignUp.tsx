
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface SignUpProps {
  onSuccess: () => void;
  onNavigateToSignIn: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({
  onSuccess,
  onNavigateToSignIn,
}) => {
  const { showToast, setCurrentUser } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('Ward 150 (Indiranagar)');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      showToast('Password must be between 8 and 72 characters.', 'error');
      return;
    }

    setLoading(true);

    try {
      const user = await authService.signUp(
        name,
        email,
        password,
        ward,
        phone
      );

      // The backend creates the account and starts the session.
      setCurrentUser(user);

      showToast(
        `Your RoadWatch citizen account has been created. Welcome, ${user.name}!`,
        'success'
      );

      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12 rounded bg-[#0D9488] flex items-center justify-center text-white mx-auto shadow-sm">
          <Shield className="w-6 h-6 fill-white text-[#0D9488]" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 font-display">
          Create RoadWatch Account
        </h2>

        <p className="mt-1 text-center text-xs text-slate-500">
          Join your municipal ward civic infrastructure reporting network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Full Name
              </label>

              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address
              </label>

              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="signup-phone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Mobile Number
                </label>

                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-ward"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Primary Ward
                </label>

                <select
                  id="signup-ward"
                  name="ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] disabled:opacity-60"
                >
                  <option value="Ward 150 (Indiranagar)">
                    Ward 150 (Indiranagar)
                  </option>
                  <option value="Ward 112 (Domlur)">
                    Ward 112 (Domlur)
                  </option>
                  <option value="Ward 42 (Kothrud Link)">
                    Ward 42 (Kothrud Link)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Create a password (8–72 characters)"
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

              <p className="mt-1 text-[10px] text-slate-500">
                Use at least 8 characters. Choose a password you have not used
                elsewhere.
              </p>
            </div>

            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">
                Account type: Citizen
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Public registration creates citizen accounts only. Authority,
                field crew, and administrator access must be assigned
                separately by an authorized administrator.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded transition-colors cursor-pointer shadow-sm"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already registered?{' '}
            <button
              type="button"
              onClick={onNavigateToSignIn}
              disabled={loading}
              className="text-[#0D9488] font-semibold hover:underline cursor-pointer disabled:opacity-60"
            >
              Sign In
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Your account is registered through the RoadWatch server. Passwords
            are hashed before storage.
          </p>
        </div>
      </div>
    </div>
  );
};
