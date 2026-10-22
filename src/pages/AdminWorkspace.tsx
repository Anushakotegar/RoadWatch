
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../data/demoData';
import { complaintService } from '../services/complaintService';
import {
  ShieldAlert,
  Users,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const {
    currentUser,
    switchRole,
    refreshComplaints,
    showToast,
  } = useApp();

  const [resetConfirm, setResetConfirm] = useState(false);

  const handleResetData = () => {
    complaintService.resetDemoData();
    refreshComplaints();
    setResetConfirm(false);
    showToast('Demo dataset reset to baseline initial seed records', 'info');
  };

  // Prevent access to admin content when no user is signed in.
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
          <h1 className="text-lg font-bold text-slate-900">
            Sign in to continue
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Sign in to access the administrative workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                System Administration
              </span>
              <span>·</span>
              <span>Civic Technology Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              Administrative Control Workspace
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage prototype accounts, inspect ledger audit trails, configure ward thresholds, and reset demo data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setResetConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo Dataset
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {resetConfirm && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                Are you sure you want to restore the initial 6 demo complaint records? Any newly reported tickets will be cleared.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}

        {/* Demo Roles & System Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Demo Roles Panel */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0D9488]" />
                Configured Demonstration Profiles
              </h3>
              <span className="text-xs text-slate-400 font-mono">4 Accounts</span>
            </div>

            <div className="space-y-3">
              {DEMO_USERS.map((user) => {
                const isCurrent = currentUser.role === user.role;

                return (
                  <div
                    key={user.id}
                    className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-[#0D9488] bg-teal-50/30 ring-1 ring-[#0D9488]'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">
                          {user.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {user.email} · {user.ward}
                      </p>
                    </div>

                    <button
                      onClick={() => switchRole(user.role)}
                      className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isCurrent ? 'Active Profile' : 'Switch To'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Settings & Civic Policies */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                Civic Service Level Configurations
              </h3>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Active Policy
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">
                    Standard Pothole Clearance SLA
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Max turnaround time from intake to post-compaction
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-800 text-sm shrink-0">
                  48 Hours
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">
                    Open Manhole Emergency Response SLA
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Immediate barricade placement &amp; precast cover dispatch
                  </p>
                </div>
                <span className="font-mono font-bold text-red-700 text-sm shrink-0">
                  4 Hours
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">
                    EvidenceGuard Geotag Tolerance Window
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Allowed radial offset between citizen and crew GPS
                  </p>
                </div>
                <span className="font-mono font-bold text-teal-800 text-sm shrink-0">
                  25 Meters
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">
                    Contractor Escrow Citizen Verification Quota
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Minimum resident affirmation score for automated clearance
                  </p>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-sm shrink-0">
                  ≥ 80%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
