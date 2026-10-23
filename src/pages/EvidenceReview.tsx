import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import {
  ShieldCheck,
  Clock,
  FileCheck,
  Lock,
  ArrowLeft,
  Check,
  X,
  Flag,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

interface EvidenceReviewProps {
  complaintId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

const IMAGE_PATHS = {
  potholeBefore:
    '/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg',
  roadAfter:
    '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg',
  manholeBefore:
    '/src/assets/images/open_manhole_hazard_1792346312725.jpg',
  crewAfter:
    '/src/assets/images/municipal_crew_working_1792346313563.jpg',
};

function getCategoryImages(category: string) {
  const value = category.toLowerCase();

  if (value.includes('pothole') || value.includes('road')) {
    return {
      before: IMAGE_PATHS.potholeBefore,
      after: IMAGE_PATHS.roadAfter,
      demo: false,
    };
  }

  if (value.includes('manhole')) {
    return {
      before: IMAGE_PATHS.manholeBefore,
      after: IMAGE_PATHS.crewAfter,
      demo: false,
    };
  }

  if (value.includes('streetlight') || value.includes('electrical')) {
    return {
      before: IMAGE_PATHS.manholeBefore,
      after: IMAGE_PATHS.crewAfter,
      demo: true,
    };
  }

  if (value.includes('drain') || value.includes('flood')) {
    return {
      before: IMAGE_PATHS.manholeBefore,
      after: IMAGE_PATHS.crewAfter,
      demo: true,
    };
  }

  return {
    before: IMAGE_PATHS.potholeBefore,
    after: IMAGE_PATHS.crewAfter,
    demo: true,
  };
}

export const EvidenceReview: React.FC<EvidenceReviewProps> = ({
  complaintId = 'RW-2025-8488',
  onBack,
  onSuccess,
}) => {
  const { complaints, showToast, refreshComplaints } = useApp();

  const activeComplaint =
    complaints.find((complaint) => complaint.id === complaintId) ||
    complaints[0];

  const [memo, setMemo] = useState('');
  const [detailsReviewed, setDetailsReviewed] = useState(false);
  const [repairReviewed, setRepairReviewed] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!activeComplaint) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Authority Workspace
        </button>
        <p className="mt-6 text-slate-600">
          No complaint is available for evidence review.
        </p>
      </div>
    );
  }

  const evidence = activeComplaint.evidence;
  const images = getCategoryImages(activeComplaint.category);

  const beforeImage = evidence?.beforePhotoUrl || images.before;
  const afterImage = evidence?.afterPhotoUrl || images.after;

  const handleDecision = async (
    decision: 'approve' | 'flag' | 'reject'
  ) => {
    if (processing) return;

    if (decision === 'approve') {
      if (!detailsReviewed || !repairReviewed) {
        showToast(
          'Review the complaint details and repair evidence before approval.',
          'error'
        );
        return;
      }

      if (!memo.trim()) {
        showToast('Enter the inspection findings before approval.', 'error');
        return;
      }
    }

    setProcessing(true);

    try {
      await complaintService.reviewEvidence(
        activeComplaint.id,
        decision,
        memo.trim()
      );

      await refreshComplaints();

      if (decision === 'approve') {
        showToast(
          `Resolution approved for ${activeComplaint.id}.`,
          'success'
        );
      } else if (decision === 'flag') {
        showToast(
          `Complaint ${activeComplaint.id} flagged for further review.`,
          'error'
        );
      } else {
        showToast(
          `Complaint ${activeComplaint.id} rejected for further work.`,
          'error'
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Evidence review failed:', error);
      showToast('Could not record the evidence review decision.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button
                onClick={onBack}
                className="flex items-center gap-1 hover:text-slate-800"
              >
                <ArrowLeft className="h-3 w-3" />
                Authority Workspace
              </button>
              <span>›</span>
              <span>{activeComplaint.id}</span>
              <span>›</span>
              <span className="font-semibold text-slate-800">
                Evidence Review
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-teal-200 bg-teal-50 px-2.5 py-1 font-mono text-xs font-bold text-teal-800">
                {activeComplaint.id}
              </span>
              <span className="text-xs text-slate-500">
                {activeComplaint.ward}
              </span>
            </div>

            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              <ShieldCheck className="h-7 w-7 text-teal-600" />
              Evidence Verification
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              {activeComplaint.title} · {activeComplaint.category}
            </p>
          </div>

          <span className="self-start rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 sm:self-auto">
            Human review required
          </span>
        </div>

        {images.demo && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Sample images are being used</p>
              <p className="mt-1">
                The available image files do not specifically match this
                complaint category. These images are placeholders, not proof
                of the reported issue or completed repair. Do not approve
                based on these images.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-3">
                  <span className="text-xs font-bold text-slate-700">
                    Before repair
                  </span>
                  <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-800">
                    Reported issue
                  </span>
                </div>

                <div className="relative h-56 bg-slate-100">
                  <img
                    src={beforeImage}
                    alt={`Before repair: ${activeComplaint.category}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    <ImageIcon className="h-3 w-3" />
                    {images.demo ? 'Sample image' : 'Demo evidence'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400">
                      Reported at
                    </span>
                    <span className="font-semibold text-slate-800">
                      {evidence?.beforeTimestamp || activeComplaint.reportedAt}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400">
                      Location
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeComplaint.locationName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700">
                      After repair
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Submitted repair evidence
                    </p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                    Review pending
                  </span>
                </div>

                <div className="relative h-56 bg-slate-100">
                  {evidence?.afterPhotoUrl ? (
                    <img
                      src={evidence.afterPhotoUrl}
                      alt={`Submitted repair: ${activeComplaint.category}`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-slate-500">
                      <ImageIcon className="h-8 w-8" />
                      No repair photo has been submitted.
                    </div>
                  )}

                  {evidence?.afterPhotoUrl && (
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      Submitted image — not yet verified
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400">
                      Submitted at
                    </span>
                    <span className="font-semibold text-slate-800">
                      {evidence?.afterTimestamp || 'Not available'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400">
                      Assigned crew
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeComplaint.assignedCrew?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                <FileCheck className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Evidence review checks
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    These checks require human review. Automated image
                    authenticity, GPS, timestamp, and visual-comparison checks
                    are not performed by this screen.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-700">
                    Location information
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {evidence?.beforeCoordinates?.address ||
                      activeComplaint.locationName}
                  </p>
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    GPS authenticity not verified
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-700">
                    Timeline information
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Reported: {activeComplaint.reportedAt}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updated: {activeComplaint.updatedAt}
                  </p>
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Photo timestamps not independently verified
                  </p>
                </div>
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Demo data may contain sample timestamps, image paths, and
                coordinates. A stored hash alone cannot prove that a photo is
                genuine or unedited. Confirm the actual repair before approving.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Authority inspection and sign-off
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Record your actual inspection findings before making a
                  decision.
                </p>
              </div>

              <div>
                <label
                  htmlFor="inspection-memo"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Inspection findings
                </label>
                <textarea
                  id="inspection-memo"
                  rows={4}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="Enter the inspection findings and any work that remains..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-3">
                <label className="flex cursor-pointer items-start gap-3 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={detailsReviewed}
                    onChange={(event) =>
                      setDetailsReviewed(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 accent-teal-600"
                  />
                  <span>
                    I reviewed the complaint details and confirmed that the
                    evidence relates to the reported issue.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={repairReviewed}
                    onChange={(event) =>
                      setRepairReviewed(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 accent-teal-600"
                  />
                  <span>
                    I reviewed the repair evidence and have independently
                    confirmed the repair status.
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('approve')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Check className="h-4 w-4" />
                  {processing ? 'Processing...' : 'Approve resolution'}
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('flag')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 px-4 py-3 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                >
                  <Flag className="h-4 w-4" />
                  Flag for audit
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('reject')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Clock className="h-4 w-4 text-slate-500" />
              Complaint record
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-slate-400">Complaint ID</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.id}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Category</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.category}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Severity</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.severity}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Current status</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.status}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Location</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.locationName}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Reported at</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.reportedAt}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Last updated</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.updatedAt}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Assigned crew</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {activeComplaint.assignedCrew?.name || 'Not assigned'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                <Lock className="h-4 w-4" />
                Awaiting human review
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                The complaint record and sample evidence are displayed for
                review. This screen does not establish an immutable audit
                trail or independently verify image authenticity.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
