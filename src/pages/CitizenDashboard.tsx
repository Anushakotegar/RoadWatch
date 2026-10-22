
import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Search,
  MapPin,
} from 'lucide-react';

interface CitizenDashboardProps {
  onNavigate: (tab: string, complaintId?: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate }) => {
  const { currentUser, complaints, setSelectedComplaintId } = useApp();

  // Handle a missing user safely before accessing user properties.
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
          <h1 className="text-lg font-bold text-slate-900">
            Sign in to continue
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Your citizen dashboard is available after you sign in.
          </p>
          <button
            onClick={() => onNavigate('sign-in')}
            className="mt-4 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold rounded transition-colors cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const myComplaints = complaints.slice(0, 4);

  const handleInspect = (id: string) => {
    setSelectedComplaintId(id);
    onNavigate('track-complaint', id);
  };

  const handleFeedback = (id: string) => {
    setSelectedComplaintId(id);
    onNavigate('citizen-feedback', id);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welcome Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Citizen Portal
              </span>
              <span>·</span>
              <span>{currentUser.ward || 'Ward 150 (Indiranagar)'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">
              Namaste, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Here is your active civic dashboard. Track filed complaints, rate contractor road repairs, and review ward progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('report-issue')}
              className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Report New Issue
            </button>
            <button
              onClick={() => onNavigate('track-complaint')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Track by ID
            </button>
          </div>
        </div>

        {/* Status Summary Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">My Active Reports</span>
            <div className="text-2xl font-bold text-slate-900 font-display mt-1 tabular-nums">2</div>
            <p className="text-[11px] text-teal-700 mt-0.5 font-medium">Under repair &amp; curing</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Awaiting My Verification</span>
            <div className="text-2xl font-bold text-amber-600 font-display mt-1 tabular-nums">1</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for citizen sign-off</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Resolved &amp; Verified</span>
            <div className="text-2xl font-bold text-emerald-600 font-display mt-1 tabular-nums">1</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Escrow release confirmed</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Community Endorsements</span>
            <div className="text-2xl font-bold text-slate-900 font-display mt-1 tabular-nums">61</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Neighboring citizens supported</p>
          </div>
        </div>

        {/* My Complaints List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Recent Ward Complaints</h2>
              <p className="text-xs text-slate-500">Live demonstration records mapped to your local area.</p>
            </div>
            <button
              onClick={() => onNavigate('community-feed')}
              className="text-xs font-semibold text-[#0D9488] hover:underline"
            >
              Explore all community reports →
            </button>
          </div>

          <div className="space-y-3">
            {myComplaints.map((item) => {
              const isResolved = item.status === 'Resolved';
              const isEvidenceIn =
                item.status === 'Evidence Submitted' ||
                item.status === 'In Progress';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.evidence.beforePhotoUrl}
                      alt={item.title}
                      className="w-20 h-16 object-cover rounded border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{item.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          ● {item.status}
                        </span>
                        <span className="text-slate-400 text-xs">·</span>
                        <span className="text-xs text-slate-500">{item.category}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.locationName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {isEvidenceIn && (
                      <button
                        onClick={() => handleFeedback(item.id)}
                        className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                      >
                        Review &amp; Rate Repair
                      </button>
                    )}
                    <button
                      onClick={() => handleInspect(item.id)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors cursor-pointer"
                    >
                      Track Docket →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
