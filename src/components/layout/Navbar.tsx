
import React, { useState } from 'react';
import {
  Shield,
  Bell,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import type { UserRole } from '../../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

interface NavLink {
  id: string;
  label: string;
  roles: UserRole[];
}

const allNavLinks: NavLink[] = [
  {
    id: 'public-portal',
    label: 'Home',
    roles: ['citizen', 'authority', 'field_crew', 'admin'],
  },
  {
    id: 'report-issue',
    label: 'Report Issue',
    roles: ['citizen'],
  },
  {
    id: 'track-complaint',
    label: 'Track Complaint',
    roles: ['citizen', 'authority', 'admin'],
  },
  {
    id: 'community-feed',
    label: 'Community Feed',
    roles: ['citizen', 'authority', 'admin'],
  },
  {
    id: 'authority',
    label: 'Authority Workspace',
    roles: ['authority', 'admin'],
  },
  {
    id: 'field-team',
    label: 'Field Team',
    roles: ['field_crew', 'admin'],
  },
  {
    id: 'evidence-guard',
    label: 'Evidence Review',
    roles: ['authority', 'admin'],
  },
  {
    id: 'citizen-feedback',
    label: 'Citizen Feedback',
    roles: ['citizen', 'authority', 'admin'],
  },
  {
    id: 'citizen-dashboard',
    label: 'My Dashboard',
    roles: ['citizen'],
  },
  {
    id: 'admin',
    label: 'Admin Workspace',
    roles: ['admin'],
  },
];

const workspaceTabs: Record<UserRole, string> = {
  citizen: 'citizen-dashboard',
  authority: 'authority',
  field_crew: 'field-team',
  admin: 'admin',
};

const roleLabels: Record<UserRole, string> = {
  citizen: 'Citizen',
  authority: 'Municipal Authority',
  field_crew: 'Field Crew',
  admin: 'Administrator',
};

export function Navbar({ currentTab, onTabChange }: NavbarProps) {
  const { currentUser, setCurrentUser, setActiveNavTab, showToast } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navLinks = currentUser
    ? allNavLinks.filter((link) => link.roles.includes(currentUser.role))
    : allNavLinks.filter((link) => link.id === 'public-portal');

  const navigate = (tab: string) => {
    onTabChange(tab);
    setActiveNavTab(tab);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await authService.signOut();
      setCurrentUser(null);
      navigate('sign-in');
      showToast('You have signed out successfully.', 'success');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Unable to sign out. Please try again.',
        'error'
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <div className="bg-slate-900 px-4 py-2 text-center text-xs text-white sm:text-sm">
        <span className="inline-flex items-center justify-center gap-2">
          <AlertTriangle size={15} />
          <span>
            Demonstration prototype — sample complaints are for testing only.
          </span>
          <button
            type="button"
            onClick={() => setDemoNoticeOpen(true)}
            className="font-semibold underline underline-offset-2 hover:text-emerald-300"
          >
            Learn more
          </button>
        </span>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('public-portal')}
            className="flex shrink-0 items-center gap-2 text-left"
            aria-label="RoadWatch home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Shield size={23} />
            </span>
            <span>
              <span className="block text-xl font-bold tracking-tight text-slate-900">
                RoadWatch
              </span>
              <span className="hidden text-xs text-slate-500 sm:block">
                Civic Infrastructure Reporting
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => navigate(link.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  currentTab === link.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('track-complaint')}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Track complaints"
                  title="Track complaints"
                >
                  <Bell size={20} />
                </button>

                <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  {roleLabels[currentUser.role]}
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200"
                    aria-label="Open profile menu"
                    aria-expanded={profileMenuOpen}
                  >
                    {(currentUser.name || 'U').charAt(0).toUpperCase()}
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <div className="border-b border-slate-100 px-3 py-3">
                        <p className="font-semibold text-slate-900">
                          {currentUser.name}
                        </p>
                        <p className="break-all text-xs text-slate-500">
                          {currentUser.email}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                          {roleLabels[currentUser.role]}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(workspaceTabs[currentUser.role])}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <User size={16} />
                        Open my workspace
                      </button>

                      <button
                        type="button"
                        disabled={signingOut}
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <LogOut size={16} />
                        {signingOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('sign-in')}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => navigate('sign-up')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 xl:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 xl:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate(link.id)}
                  className={`rounded-lg px-3 py-3 text-left text-sm font-medium ${
                    currentTab === link.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="mt-3 border-t border-slate-100 pt-3">
              {currentUser ? (
                <>
                  <div className="px-3 py-2">
                    <p className="font-semibold text-slate-900">
                      {currentUser.name}
                    </p>
                    <p className="break-all text-xs text-slate-500">
                      {currentUser.email}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {roleLabels[currentUser.role]}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(workspaceTabs[currentUser.role])}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Open my workspace
                  </button>

                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={handleSignOut}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('sign-in')}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('sign-up')}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {demoNoticeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setDemoNoticeOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="roadwatch-demo-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={23} />
              </span>
              <div>
                <h2
                  id="roadwatch-demo-title"
                  className="text-lg font-bold text-slate-900"
                >
                  About this demonstration
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  RoadWatch is a prototype. Sample complaints and displayed
                  workflow information may be demonstration data. A role label
                  in this interface does not itself grant government authority
                  or replace server-side access controls.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDemoNoticeOpen(false)}
              className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              I understand
            </button>
          </section>
        </div>
      )}
    </>
  );
}
