
import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Search,
  MapPin,
  FileText,
  CheckCircle2,
  Clock3,
  Heart,
  Info,
} from 'lucide-react';

interface CitizenDashboardProps {
  onNavigate: (tab: string, complaintId?: string) => void;
}

type DashboardComplaint = {
  id: string;
  title: string;
  category: string;
  description?: string;
  status: string;
  ward?: string;
  locationName: string;
  reportedAt?: string;
  reportedByUserId?: string;
  isDemoData?: boolean;
  endorsementsCount?: number;
  citizenVerified?: boolean;
  verifiedByCitizen?: boolean;
  verificationStatus?: string;
  evidence: {
    beforePhotoUrl?: string;
  };
};

const ACTIVE_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Evidence Submitted',
  'Awaiting Verification',
];

function isAwaitingVerification(item: DashboardComplaint): boolean {
  return (
    item.status === 'Awaiting Verification' ||
    item.status === 'Evidence Submitted' ||
    item.verificationStatus === 'Awaiting Verification'
  );
}

function isResolvedAndVerified(item: DashboardComplaint): boolean {
  const status = item.status.toLowerCase();

  const isResolved =
    status === 'resolved' ||
    status === 'resolved & verified' ||
    status === 'verified';

  const isVerified =
    item.citizenVerified === true ||
    item.verifiedByCitizen === true ||
    item.verificationStatus === 'Verified' ||
    status === 'resolved & verified' ||
    status === 'verified';

  return isResolved && isVerified;
}

function formatDate(value?: string): string {
  if (!value) return 'Date not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date not available';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onNavigate,
}) => {
  const {
    currentUser,
    complaints,
    setSelectedComplaintId,
  } = useApp();

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

  // Backend complaint records contain ownership and demo-data fields.
  const allComplaints =
    complaints as unknown as DashboardComplaint[];

  // Only real reports belonging to this signed-in citizen count as "my reports".
  const myComplaints = allComplaints.filter(
    (item) =>
      item.reportedByUserId === currentUser.id &&
      item.isDemoData !== true,
  );

  const activeReports = myComplaints.filter(
    (item) => ACTIVE_STATUSES.includes(item.status),
  );

  const awaitingVerification = myComplaints.filter(
    isAwaitingVerification,
  );

  const resolvedAndVerified = myComplaints.filter(
    isResolvedAndVerified,
  );

  const communityEndorsements = myComplaints.reduce(
    (total, item) =>
      total +
      (Number.isFinite(item.endorsementsCount)
        ? Math.max(0, item.endorsementsCount ?? 0)
        : 0),
    0,
  );

  // Demo reports are shown separately and never included in personal totals.
  const demoReports = allComplaints
    .filter((item) => item.isDemoData === true)
    .slice(0, 4);

  const recentReports = [...myComplaints]
    .sort((a, b) => {
      const dateA = a.reportedAt
        ? new Date(a.reportedAt).getTime()
        : 0;
      const dateB = b.reportedAt
        ? new Date(b.reportedAt).getTime()
        : 0;

      return dateB - dateA;
    })
    .slice(0, 4);

  const handleInspect = (id: string) => {
    setSelectedComplaintId(id);
    onNavigate('track-complaint', id);
  };

  const handleFeedback = (id: string) => {
    setSelectedComplaintId(id);
    onNavigate('citizen-feedback', id);
  };

  const renderComplaint = (
    item: DashboardComplaint,
    isDemo = false,
  ) => {
    const resolved =
      item.status.toLowerCase().includes('resolved') ||
      item.status === 'Verified';

    const canReview =
      item.status === 'Evidence Submitted' ||
      item.status === 'Awaiting Verification';

    return (
      <div
        key={item.id}
        className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4 min-w-0">
          {item.evidence?.beforePhotoUrl ? (
            <img
              src={item.evidence.beforePhotoUrl}
              alt={item.title}
              className="w-20 h-16 object-cover rounded border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-20 h-16 rounded border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-900">
                #{item.id}
              </span>

              {isDemo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  DEMO DATA
                </span>
              )}

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  resolved
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {item.status}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm mt-1">
              {item.title}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {item.category}
            </p>

            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {item.locationName}
            </p>

            <p className="text-[11px] text-slate-400 mt-1">
              Reported: {formatDate(item.reportedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {!isDemo && canReview && (
            <button
              onClick={() => handleFeedback(item.id)}
              className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              Review Repair
            </button>
          )}

          <button
            onClick={() => handleInspect(item.id)}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            Track Report →
          </button>
        </div>
      </div>
    );
  };

  const summaryCards = [
    {
      label: 'My Active Reports',
      count: activeReports.length,
      note: 'Your reports still in progress',
      icon: FileText,
      color: 'text-slate-900',
    },
    {
      label: 'Awaiting Verification',
      count: awaitingVerification.length,
      note: 'Your reports awaiting sign-off',
      icon: Clock3,
      color: 'text-amber-600',
    },
    {
      label: 'Resolved & Verified',
      count: resolvedAndVerified.length,
      note: 'Reports with recorded verification',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      label: 'Community Endorsements',
      count: communityEndorsements,
      note: 'Recorded endorsements on your reports',
      icon: Heart,
      color: 'text-slate-900',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Citizen Portal
              </span>
              {currentUser.ward && (
                <>
                  <span>·</span>
                  <span>{currentUser.ward}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 font-display">
              Namaste, {currentUser.name}
            </h1>

            <p className="text-xs text-slate-600 mt-1">
              Track your own reports, review repair updates, and explore
              community reports in your area.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    {card.label}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                <div
                  className={`text-2xl font-bold font-display mt-2 tabular-nums ${card.color}`}
                >
                  {card.count}
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                My Recent Reports
              </h2>
              <p className="text-xs text-slate-500">
                Only reports linked to your signed-in account appear here.
              </p>
            </div>

            <button
              onClick={() => onNavigate('community-feed')}
              className="text-xs font-semibold text-[#0D9488] hover:underline shrink-0"
            >
              Explore community →
            </button>
          </div>

          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((item) => renderComplaint(item))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">
                No personal reports yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Reports you submit while signed in will appear here. Demo
                complaints and other citizens' reports are not counted as yours.
              </p>
              <button
                onClick={() => onNavigate('report-issue')}
                className="mt-4 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded cursor-pointer"
              >
                Submit Your First Report
              </button>
            </div>
          )}
        </div>

        {demoReports.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Example Community Reports
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  These illustrative records help demonstrate RoadWatch.
                  They are synthetic data, not verified live municipal
                  complaints, and are excluded from your personal totals.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {demoReports.map((item) => renderComplaint(item, true))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
