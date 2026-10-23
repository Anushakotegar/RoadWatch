import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Eye,
  EyeOff,
  UserRound,
  Building2,
  HardHat,
  Settings,
  CheckCircle2,
} from 'lucide-react';

interface SignUpProps {
  onSuccess: () => void;
  onNavigateToSignIn: () => void;
}

type RegistrationRole = 'citizen' | 'authority';

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
  const [role, setRole] = useState<RegistrationRole>('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    if (password.length < 8 || password.length > 72) {
      showToast(
        'Password must be between 8 and 72 characters.',
        'error',
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          ward,
          phone: phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.user) {
        throw new Error(
          result.message || 'Registration failed. Please try again.',
        );
      }

      const user = result.user;
      const returnedRole = String(user.role ?? '').toLowerCase();

      if (returnedRole !== role) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // Do not continue if the returned role is unexpected.
        }

        showToast(
          'The server returned a different account role. Please try again.',
          'error',
        );
        return;
      }

      setCurrentUser(user);

      showToast(
        role === 'authority'
          ? `Demo Municipal Authority account created. Welcome, ${user.name}!`
          : `Your citizen account has been created. Welcome, ${user.name}!`,
        'success',
      );

      onSuccess();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="w-12 h-12 rounded-xl bg-[#0D9488] flex items-center justify-center text-white mx-auto shadow-sm">
          <Shield className="w-6 h-6" />
        </div>

        <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          Join RoadWatch
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Create an account to use the RoadWatch platform.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg">
        <section className="bg-white py-7 px-5 sm:px-8 shadow-sm rounded-xl border border-slate-200 space-y-6">
          <div className="rounded-lg border border-[#99F6E4] bg-teal-50 p-4">
            <div className="flex items-start gap-3">
              {role === 'authority' ? (
                <Building2 className="w-5 h-5 mt-0.5 text-[#0D9488] shrink-0" />
              ) : (
                <UserRound className="w-5 h-5 mt-0.5 text-[#0D9488] shrink-0" />
              )}

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {role === 'authority'
                    ? 'Municipal Authority Demo Account'
                    : 'Citizen Registration'}
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {role === 'authority'
                    ? 'For local RoadWatch testing: review complaints, assign repair crews, update statuses, and review repair evidence.'
                    : 'Report potholes, damaged streetlights, drainage problems, and track complaint progress.'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signup-role"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Account type *
              </label>

              <select
                id="signup-role"
                name="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as RegistrationRole)
                }
                disabled={loading}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
              >
                <option value="citizen">Citizen</option>
                <option value="authority">
                  Municipal Authority (Demo)
                </option>
              </select>

              {role === 'authority' && (
                <p className="mt-1.5 text-xs leading-relaxed text-amber-700">
                  Demo access only. Do not use public authority
                  registration for a real municipal deployment.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full name *
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
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address *
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
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signup-phone"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Mobile number
              </label>

              <input
                id="signup-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                placeholder="Optional"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="signup-ward"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Primary ward
              </label>

              <select
                id="signup-ward"
                name="ward"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
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

            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password *
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
                  className="w-full px-3 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Use at least 8 characters and avoid reusing another password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              {loading
                ? 'Creating account...'
                : role === 'authority'
                  ? 'Create Demo Authority Account'
                  : 'Create Citizen Account'}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Other RoadWatch stakeholders
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Municipal Authority
                  </p>
                  <p className="text-xs text-slate-500">
                    Reviews complaints and verifies repair evidence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <HardHat className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Field Crew
                  </p>
                  <p className="text-xs text-slate-500">
                    Handles assigned repairs and uploads evidence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Settings className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Administrator
                  </p>
                  <p className="text-xs text-slate-500">
                    Manages authorized accounts and system access.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#0D9488] shrink-0" />
              Municipal Authority registration is intended for demo testing.
              Field Crew and Administrator accounts remain restricted.
            </p>
          </div>

          <div className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToSignIn}
              disabled={loading}
              className="text-[#0D9488] font-semibold hover:underline disabled:opacity-60"
            >
              Sign in
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            RoadWatch sends registration requests to its server. Passwords
            are securely hashed before storage.
          </p>
        </section>
      </div>
    </main>
  );
};