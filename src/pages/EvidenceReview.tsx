import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  FileCheck, 
  AlertTriangle, 
  Lock, 
  ArrowLeft,
  Check,
  X,
  Flag
} from 'lucide-react';

interface EvidenceReviewProps {
  complaintId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const EvidenceReview: React.FC<EvidenceReviewProps> = ({
  complaintId = 'RW-2025-8488',
  onBack,
  onSuccess
}) => {
  const { complaints, showToast, refreshComplaints } = useApp();
  
  const activeComplaint = complaints.find(c => c.id === complaintId) || complaints[0];

  const [memo, setMemo] = useState<string>(
    'Asphalt patch compaction verified against curb line. Bitumen joint sealed properly. Repair complete.'
  );
  const [curbCheck, setCurbCheck] = useState<boolean>(true);
  const [barricadeCheck, setBarricadeCheck] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);

  const handleDecision = async (decision: 'approve' | 'flag' | 'reject') => {
    setProcessing(true);
    try {
      await complaintService.reviewEvidence(activeComplaint.id, decision, memo);
      await refreshComplaints();

      if (decision === 'approve') {
        showToast(`Resolution approved for #${activeComplaint.id}. Escrow clearance authorized.`, 'success');
      } else if (decision === 'flag') {
        showToast(`Case #${activeComplaint.id} flagged for secondary forensic field audit.`, 'error');
      } else {
        showToast(`Case #${activeComplaint.id} rejected and reopened for rework.`, 'error');
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Error recording evidence review decision', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb & Header matching Image 5 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <button onClick={onBack} className="hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-3 h-3" />
                Authority Workspace
              </button>
              <span>›</span>
              <span className="font-mono">{activeComplaint.id}</span>
              <span>›</span>
              <span className="font-semibold text-slate-800">Evidence Verification</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded">
                {activeComplaint.id}
              </span>
              <span className="text-xs text-slate-500">
                {activeComplaint.ward}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1 flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-[#0D9488]" />
              Evidence Verification
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Ready for Sign-off
            </span>
          </div>
        </div>

        {/* 2-Column Split: Evidence & Checks (8 cols), Chain of Custody (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Evidence Area (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Side-by-Side Photo Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Before Card */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Before</span>
                  <span className="text-[10px] uppercase font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Reported Issue
                  </span>
                </div>
                <div className="h-56 bg-slate-100 relative">
                  <img
                    src={activeComplaint.evidence.beforePhotoUrl}
                    alt="Before repair"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Date & Time</span>
                    <span className="font-mono font-semibold text-slate-800">{activeComplaint.evidence.beforeTimestamp || '26 Feb • 08:42 AM'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Location</span>
                    <span className="font-mono font-semibold text-slate-800">{activeComplaint.coordinates.lat}° N, {activeComplaint.coordinates.lng}° E</span>
                  </div>
                </div>
              </div>

              {/* After Card */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700">Repair Submission</span>
                    <p className="text-[10px] text-slate-500">Post-intervention evidence</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Work Done
                  </span>
                </div>
                <div className="h-56 bg-slate-100 relative">
                  <img
                    src={activeComplaint.evidence.afterPhotoUrl || '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg'}
                    alt="Work Done"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
                    <span className="font-mono font-semibold text-slate-800">{activeComplaint.evidence.afterTimestamp || '28 Feb • 04:15 PM'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Team & Offset</span>
                    <span className="font-mono font-semibold text-emerald-700">Crew Bravo (Δ 11m)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Automated Verification Checks Panel (Matches Image 5) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#0D9488]" />
                    Automated Verification Checks
                  </h3>
                  <p className="text-xs text-slate-500">
                    Computer vision & metadata checks: Compares distance, timestamp window, and visual curb keypoints between both photos.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded shrink-0">
                  All 4 Checks Passed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* 1. Location */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Location Match</span>
                    <span className="font-mono font-bold text-xs text-slate-900">11m Offset</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

                {/* 2. Timeline */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Timeline</span>
                    <span className="font-mono font-bold text-xs text-slate-900">48h Elapsed</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

                {/* 3. Visual Match */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Visual Match</span>
                    <span className="font-bold text-xs text-slate-900">Verified</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

                {/* 4. Integrity */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Integrity</span>
                    <span className="font-bold text-xs text-slate-900">Authentic</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

              </div>

              <div className="text-[11px] text-slate-400 text-center pt-1">
                Demo AI analysis — not a verified authenticity result. Authority engineer human sign-off mandatory.
              </div>
            </div>

            {/* Municipal Ward Authority Sign-off Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">
                    Municipal Ward Authority Sign-off
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mandatory engineer approval memo certifying work quality before marking complaint as fully resolved.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Role: Ward Engineer
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Inspection Findings & Official Memo
                </label>
                <textarea
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={curbCheck}
                    onChange={(e) => setCurbCheck(e.target.checked)}
                    className="w-4 h-4 text-[#0D9488] rounded"
                  />
                  <span className="text-slate-700">Curb alignment matches report</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={barricadeCheck}
                    onChange={(e) => setBarricadeCheck(e.target.checked)}
                    className="w-4 h-4 text-[#0D9488] rounded"
                  />
                  <span className="text-slate-700">Safety barricades deployed properly</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('approve')}
                  className="w-full sm:flex-1 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Approve Resolution
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('flag')}
                  className="w-full sm:w-auto px-4 py-2.5 border border-amber-300 hover:bg-amber-50 text-amber-800 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Flag for Audit
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('reject')}
                  className="w-full sm:w-auto px-4 py-2.5 border border-red-300 hover:bg-red-50 text-red-700 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>

          </div>

          {/* Right: Evidence Chain of Custody Sidebar (Matches Image 5) (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Evidence Chain of Custody
            </h3>

            <div className="space-y-5 text-xs relative pl-4 border-l-2 border-slate-200 ml-2">
              
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-slate-900" />
                <span className="font-mono text-[10px] text-slate-400 block">26 Feb • 08:42</span>
                <h4 className="font-bold text-slate-900 mt-0.5">Incident Reported</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Citizen Ananya S. uploaded photo</p>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-slate-900" />
                <span className="font-mono text-[10px] text-slate-400 block">27 Feb • 10:00</span>
                <h4 className="font-bold text-slate-900 mt-0.5">Work Order Dispatched</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Assigned to Crew Bravo (Indiranagar Unit)</p>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-slate-900" />
                <span className="font-mono text-[10px] text-slate-400 block">28 Feb • 16:30</span>
                <h4 className="font-bold text-slate-900 mt-0.5">Repair Evidence Uploaded</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Submitted by Supervisor S. Patil</p>
              </div>

              {/* Event 4 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] text-slate-400 block">28 Feb • 16:45</span>
                <h4 className="font-bold text-slate-900 mt-0.5">EvidenceGuard Passed</h4>
                <p className="text-emerald-700 text-[11px] font-semibold mt-0.5">Automated checks clearance 91%</p>
              </div>

              {/* Event 5 (Current) */}
              <div className="relative">
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-mono text-[10px] text-amber-600 font-bold block uppercase">Current Stage</span>
                <h4 className="font-bold text-slate-900 mt-0.5">Pending Engineer Sign-off</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Awaiting action click above</p>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Evidence Audit Trail</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <Lock className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
