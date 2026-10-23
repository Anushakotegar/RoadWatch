
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import {
  Shield,
  Eye,
  EyeOff,
  UserRound,
  Building2,
  HardHat,
  Settings,
} from 'lucide-react';

interface SignInProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
}

type AccountType = 'citizen' | 'authority' | 'field_crew' | 'admin';

const ACCOUNT_OPTIONS: {
  value: AccountType;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'citizen',
    title: 'Citizen',
    description: 'Report and track civic issues',
    Icon: UserRound,
  },
  {
    value: 'authority',
    title: 'Municipal Authority',
    description: 'Review complaints and repairs',
    Icon: Building2,
  },
  {
    value: 'field_crew',
    title: 'Field Crew',
    description: 'Manage assigned repair work',
    Icon: HardHat,
  },
  {
    value: 'admin',
    title: 'Administrator',
    description: 'Manage system access',
    Icon: Settings,
  },
];

function normalizeRole(role: unknown): AccountType | null {
  const value = String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (value === 'citizen' || value === 'user') return 'citizen';
  if (value === 'authority' || value === 'municipal_authority') {
    return 'authority';
  }
  if (value === 'field_crew' || value === 'crew') return 'field_crew';
  if (
    value === 'admin' ||
    value === 'administrator' ||
    value === 'super_admin'
  ) {
    return 'admin';
  }

  return null;
}

const DEMO_CREDENTIALS: Record<
  AccountType,
  { email: string; password: string; name: string }
> = {
  citizen: {
    email: 'ananya.sharma@domain.in',
    password: 'RoadWatch2025!',
    name: 'Ananya Sharma',
  },
  authority: {
    email: 's.nambiar@ward112.gov.in',
    password: 'RoadWatch2025!',
    name: 'Officer S. Nambiar',
  },
  field_crew: {
    email: 'crew.bravo@roadscorp.org',
    password: 'RoadWatch2025!',
    name: 'Foreman R. Kulkarni',
  },
  admin: {
    email: 'admin@roadwatch.demo',
    password: 'RoadWatch2025!',
    name: 'Dr. Vikramaditya Rao',
  },
};

export const SignIn: React.FC<SignInProps> = ({
  onSuccess,
  onNavigateToSignUp,
}) => {
  const { showToast, setCurrentUser } = useApp();

  const [accountType, setAccountType] = useState<AccountType>('citizen');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.citizen.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.citizen.password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role: AccountType) => {
    setAccountType(role);
    const demo = DEMO_CREDENTIALS[role];
    setEmail(demo.email);
    setPassword(demo.password);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showToast('Please enter your email address and password.', 'error');
      return;
    }

    setLoading(true);

    try {
      const user = await authService.signIn(email.trim(), password);
      const actualRole = normalizeRole(user.role);

      if (!actualRole) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // Do not grant access if the account role cannot be verified.
        }

        showToast(
          'Your account role could not be verified. Please contact the RoadWatch administrator.',
          'error'
        );
        return;
      }

      if (actualRole !== accountType) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // The role mismatch is still rejected in this interface.
        }

        const selected = ACCOUNT_OPTIONS.find(
          (option) => option.value === accountType
        );

        const actual = ACCOUNT_OPTIONS.find(
          (option) => option.value === actualRole
        );

        showToast(
          `This account belongs to ${actual?.title ?? actualRole}. Please select the correct account type: ${selected?.title ?? accountType} was selected.`,
          'error'
        );
        return;
      }

      setCurrentUser(user);
      showToast(`Welcome to RoadWatch, ${user.name}!`, 'success');
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please check your details and try again.';

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    showToast(
      'Password reset is not configured yet. Please contact the RoadWatch administrator.',
      'info'
    );
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="w-12 h-12 rounded-xl bg-[#0D9488] flex items-center justify-center text-white mx-auto shadow-sm">
          <Shield className="w-6 h-6" />
        </div>

        <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          Welcome to RoadWatch
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Select your role to access the right workspace.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg">
        <section className="bg-white py-7 px-5 sm:px-8 shadow-sm rounded-xl border border-slate-200 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Sign in as
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCOUNT_OPTIONS.map(({ value, title, description, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSelectRole(value)}
                  disabled={loading}
                  aria-pressed={accountType === value}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60 ${
                    accountType === value
                      ? 'border-[#0D9488] bg-teal-50 ring-1 ring-[#0D9488]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5 shrink-0 text-[#0D9488]" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {title}
                    </span>
                    <span className="block mt-1 text-xs leading-relaxed text-slate-500">
                      {description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {accountType !== 'citizen' ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                This workspace requires an authorized account. Demo credentials for <strong>{DEMO_CREDENTIALS[accountType].name}</strong> are pre-filled below for evaluation.
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-2.5 text-xs leading-relaxed text-teal-800">
                Demonstration citizen credentials for <strong>{DEMO_CREDENTIALS.citizen.name}</strong> are pre-filled below for evaluation.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                autoComplete="username"
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
                htmlFor="signin-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
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
                  className="w-full px-3 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((previous) => !previous)}
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
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-[#0D9488] font-semibold hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              {loading
                ? 'Signing in...'
                : `Sign In as ${ACCOUNT_OPTIONS.find((option) => option.value === accountType)?.title}`}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            Need a citizen account?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              disabled={loading}
              className="text-[#0D9488] font-semibold hover:underline disabled:opacity-60"
            >
              Sign up
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Staff accounts must be authorized separately. Your selected role
            is checked against the role returned by the RoadWatch server.
          </p>
        </section>
      </div>
    </main>
  );
};
