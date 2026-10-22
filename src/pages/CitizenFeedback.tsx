import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { Complaint, CitizenFeedbackData } from '../types';
import { 
  CheckCircle2, 
  Star, 
  Upload, 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft,
  FileCheck,
  Check,
  Building,
  Info
} from 'lucide-react';

interface CitizenFeedbackProps {
  complaintId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const CitizenFeedback: React.FC<CitizenFeedbackProps> = ({ 
  complaintId = 'RW-2025-8492', 
  onBack,
  onSuccess 
}) => {
  const { complaints, showToast, refreshComplaints } = useApp();
  
  const targetComplaint = complaints.find(c => c.id === complaintId) || complaints[0];

  // Step 1: Status verification
  const [resolutionStatus, setResolutionStatus] = useState<'fully_repaired' | 'partially_repaired' | 'not_repaired'>('fully_repaired');
  
  // Step 2: Quality & Timeliness
  const [rating, setRating] = useState<number>(5);
  const [durability, setDurability] = useState<CitizenFeedbackData['durability']>('High Standard');
  const [turnaroundSla, setTurnaroundSla] = useState<CitizenFeedbackData['turnaroundSla']>('On-Time (Target Met)');
  const [smsClarity, setSmsClarity] = useState<CitizenFeedbackData['smsClarity']>('Clear & Informative');

  // Step 3: Photo
  const [citizenPhotoUrl, setCitizenPhotoUrl] = useState<string>('');

  // Step 4: Remarks & Testimonial
  const [testimonialText, setTestimonialText] = useState<string>(
    'Asphalt was laid flush with the stormwater drain edge. Barricades were cleared before school bus traffic began. Appreciate the fast turnaround Crew Bravo!'
  );
  const [publishPublicly, setPublishPublicly] = useState<boolean>(true);
  const [nominateCrew, setNominateCrew] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCitizenPhotoUrl(URL.createObjectURL(file));
      showToast('Citizen verification photo staged with simulated EXIF stamp', 'info');
    }
  };

  const handleSubmitFeedback = async (isReopenRequest: boolean = false) => {
    setSubmitting(true);
    try {
      const payload: CitizenFeedbackData = {
        resolutionStatus: isReopenRequest ? 'not_repaired' : resolutionStatus,
        rating: isReopenRequest ? 1 : rating,
        durability: isReopenRequest ? 'Needs Rework' : durability,
        turnaroundSla,
        smsClarity,
        followUpPhotoUrl: citizenPhotoUrl || undefined,
        testimonialText: isReopenRequest ? `Re-inspection requested: ${testimonialText}` : testimonialText,
        publishPublicly,
        nominateCrew: isReopenRequest ? false : nominateCrew,
        submittedAt: new Date().toLocaleString('en-IN')
      };

      await complaintService.submitFeedback(targetComplaint.id, payload);
      await refreshComplaints();

      if (isReopenRequest) {
        showToast(`Re-inspection request recorded for #${targetComplaint.id}. Ticket flagged for audit.`, 'error');
      } else {
        showToast(`Citizen sign-off recorded for #${targetComplaint.id}! Contractor rating recalibrated.`, 'success');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Error saving feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb & Top Bar */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <button onClick={onBack} className="hover:text-slate-800 flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="w-3 h-3" />
              My Reports
            </button>
            <span>›</span>
            <span>Complaint #{targetComplaint.id}</span>
            <span>›</span>
            <span className="font-semibold text-slate-800">Resolution Feedback</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                Ward Quality Sign-Off & Escrow Assurance
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1">
                Citizen Feedback & Resolution Review
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Your verification directly authenticates municipal contractor execution. Contractor invoice clearance is bound to this citizen evaluation score.
              </p>
            </div>

            {/* Top Right Status Badge Card */}
            <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">#{targetComplaint.id}</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                    ● Repaired
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {targetComplaint.title} · 24 May 2025 (48h Turnaround)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Repair Comparison matching Image 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              Physical Repair Comparison
            </h3>
            <span className="text-xs text-slate-500">
              Compare official field evidence against your baseline submission
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reported */}
            <div className="space-y-1.5">
              <div className="relative h-56 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={targetComplaint.evidence.beforePhotoUrl}
                  alt="Original intake"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-mono">
                  Reported: May 22, 2025
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <span>📍</span> 14th Main Rd, Indiranagar (Ward 150)
                </span>
                <span>GPS: 12.9716° N, 77.5946° E</span>
              </div>
            </div>

            {/* Work Done */}
            <div className="space-y-1.5">
              <div className="relative h-56 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={targetComplaint.evidence.afterPhotoUrl || '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg'}
                  alt="Repair completed"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-emerald-700 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Work Done: May 24, 2025
                </div>
                <div className="absolute bottom-2.5 right-2.5 bg-black/75 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                  Seal ID: #ASPH-W150-84
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-slate-700">Executed by Crew Bravo (BBMP Zone East)</span>
                <span className="text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded text-[10px]">
                  Cold-Mix Bitumen Seal
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-200">
            Helper: Review both visual records. If the repair has uneven settlement, standing water pooling, or loose grit, please note this in Question 1.
          </p>
        </div>

        {/* 2-Column Split: Feedback Wizard + Accountability Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main 4-Step Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* STEP 1: STATUS VERIFICATION */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  STEP 1 OF 4 • STATUS VERIFICATION
                </span>
                <span className="text-red-600 font-semibold text-[11px]">* Mandatory</span>
              </div>

              <h3 className="font-display font-bold text-slate-900 text-base">
                Is the road defect completely resolved?
              </h3>
              <p className="text-xs text-slate-500">
                Select whether the reported hazard is completely safe for normal vehicular flow and pedestrian transit.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Option 1 */}
                <button
                  type="button"
                  onClick={() => setResolutionStatus('fully_repaired')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                    resolutionStatus === 'fully_repaired'
                      ? 'border-[#0D9488] bg-teal-50/40 ring-1 ring-[#0D9488]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
                    {resolutionStatus === 'fully_repaired' && (
                      <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Yes, fully repaired</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Smooth, level, safe surface</p>
                </button>

                {/* Option 2 */}
                <button
                  type="button"
                  onClick={() => setResolutionStatus('partially_repaired')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                    resolutionStatus === 'partially_repaired'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    {resolutionStatus === 'partially_repaired' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Partially repaired</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Uneven surface or debris left</p>
                </button>

                {/* Option 3 */}
                <button
                  type="button"
                  onClick={() => setResolutionStatus('not_repaired')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                    resolutionStatus === 'not_repaired'
                      ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-5 h-5 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center font-bold text-xs">✕</div>
                    {resolutionStatus === 'not_repaired' && (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">No, persists / poor</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Defect remains hazardous</p>
                </button>
              </div>
            </div>

            {/* STEP 2: QUALITY ASSESSMENT */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  STEP 2 OF 4 • QUALITY ASSESSMENT
                </span>
                <span className="text-teal-800 font-semibold text-[11px]">Ward SLA Impact</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Rate the Quality & Timeliness of Resolution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These ratings directly influence the Ward 150 Contractor Performance Scorecard and municipal audit flags.
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Overall Experience Rating</span>
                  <span className="text-[11px] text-slate-500">Tap stars to calibrate your satisfaction level</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer p-0.5"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono ml-2">
                    {rating}.0 / 5.0 ({rating === 5 ? 'Excellent' : rating >= 4 ? 'Good' : 'Needs Work'})
                  </span>
                </div>
              </div>

              {/* Surface Durability */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Surface Durability & Finish</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Needs Rework', 'Passable', 'High Standard', 'Flawless Grade'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDurability(option)}
                      className={`py-2 text-center text-xs font-medium rounded border transition-colors cursor-pointer ${
                        durability === option
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turnaround */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Dispatch & Execution Turnaround (48h Standard SLA)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['Behind Schedule', 'On-Time (Target Met)', 'Ahead of Schedule (<30h)'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTurnaroundSla(option)}
                      className={`py-2 text-center text-xs font-medium rounded border transition-colors cursor-pointer ${
                        turnaroundSla === option
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* SMS Notification */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">SMS Notification Clarity & Site Barricading</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['Unclear / Delayed SMS', 'Clear & Informative', 'Proactive Updates'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSmsClarity(option)}
                      className={`py-2 text-center text-xs font-medium rounded border transition-colors cursor-pointer ${
                        smsClarity === option
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 3: CITIZEN INDEPENDENT VERIFICATION */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  STEP 3 OF 4 • CITIZEN INDEPENDENT VERIFICATION
                </span>
                <span className="text-teal-700 font-semibold text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Unlocks 'Citizen Confirmed' Badge
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Upload Citizen Follow-up Photo (Optional)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Take or upload a recent photo of the repaired spot. Geotagged smartphone photos match against coordinate 12.9716° N automatically.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center relative hover:bg-slate-100/70 transition-colors">
                {citizenPhotoUrl ? (
                  <div className="relative inline-block max-h-48 rounded overflow-hidden">
                    <img src={citizenPhotoUrl} alt="Citizen verification" className="max-h-48 rounded object-cover" />
                    <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      EXIF Geotag Matched
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-8 h-8 text-teal-600 mx-auto" />
                    <p className="text-xs text-slate-700 font-medium">Drop photo here, or click to browse files</p>
                    <p className="text-[11px] text-slate-400">JPEG, PNG, HEIC up to 15MB • Automatic EXIF Geolocation Extraction</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>All user photos are stamped with verifiable SHA-256 cryptographic hashes for the open municipal registry.</span>
              </div>
            </div>

            {/* STEP 4: REMARKS & RECOGNITION */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  STEP 4 OF 4 • REMARKS & RECOGNITION
                </span>
                <span className="text-slate-500 font-semibold text-[11px]">Civic Voice</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Citizen Notes & Public Testimonial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share details regarding contractor conduct, safety cones, clean-up, or transit convenience.
                </p>
              </div>

              <textarea
                rows={4}
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
              />

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishPublicly}
                    onChange={(e) => setPublishPublicly(e.target.checked)}
                    className="w-4 h-4 text-[#0D9488] rounded border-slate-300"
                  />
                  <span>Publish my feedback and rating anonymously on the <strong>Ward 150 Public Feed</strong> to inform neighboring commuters.</span>
                </label>

                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nominateCrew}
                    onChange={(e) => setNominateCrew(e.target.checked)}
                    className="w-4 h-4 text-[#0D9488] rounded border-slate-300"
                  />
                  <span>Nominate Field Crew Bravo for the <strong>Civic Service Spot Recognition</strong> municipal award.</span>
                </label>
              </div>
            </div>

            {/* Submit / Reopen Action Buttons matching Image 1 */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitFeedback(false)}
                  className="w-full sm:flex-1 py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Feedback & Confirm Resolution'}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitFeedback(true)}
                  className="w-full sm:w-auto px-5 py-3 border border-red-300 hover:bg-red-50 text-red-700 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Request Re-Inspection (Substandard Work)
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Notice: Feedback submissions are locked into immutable civic ledger logs. Ward 150 Executive Engineer receives audit copies upon click.
              </p>
            </div>

          </div>

          {/* Right Sidebar: Accountability Pipeline + Ward 150 Civic Pulse (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Accountability Pipeline Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#0D9488]" />
                Accountability Pipeline
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                How your review drives contractor billing and institutional accountability:
              </p>

              <div className="space-y-4 text-xs pt-1">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">Citizen On-Site Verification</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">Active Stage</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">You verify physical defect eradication on 14th Main Rd.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">Contractor Scorecard Recalibration</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Star ratings adjust public vendor ranking and tender eligibility quotas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">Ward Escrow Fund Clearance</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Invoice escrow releases only once citizen approval threshold (≥80%) is satisfied.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ward 150 Civic Pulse (May 2025) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-900 text-sm">Ward 150 Civic Pulse</h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">MAY 2025</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-14 h-14 rounded-full border-4 border-[#0D9488] flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-900 font-display">94%</span>
                  <span className="text-[8px] uppercase text-slate-500">Approval</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Citizen Approval Index</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Based on 148 verified road repair completions across Indiranagar this cycle.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Avg Resolution SLA</span>
                  <span className="font-display font-bold text-slate-900 text-sm">32.4 Hours</span>
                  <span className="text-emerald-600 text-[10px] block mt-0.5">▼ 15h under cap</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Citizen Rating</span>
                  <span className="font-display font-bold text-slate-900 text-sm">4.8 ★ / 5.0</span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">Top 10% Citywide</span>
                </div>
              </div>
            </div>

            {/* Section 4(1)(b) RTI Compliant notice */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-2.5">
              <Building className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Section 4(1)(b) RTI Compliant</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Public inspection of contractor satisfaction metrics is mandated under the Municipal Public Disclosure Act. Your feedback ensures community integrity.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
