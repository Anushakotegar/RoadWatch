
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { Complaint, CitizenFeedbackData } from '../types';
import {
  CheckCircle2,
  Star,
  Camera,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  FileCheck,
  MapPin,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

interface CitizenFeedbackProps {
  complaintId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

type EvidenceCategory =
  | 'Streetlights'
  | 'Potholes'
  | 'Drainage'
  | 'Open Manholes'
  | 'Water Leaks'
  | 'Debris & Floods';

const CATEGORY_KEYWORDS: Record<EvidenceCategory, string[]> = {
  Streetlights: [
    'streetlight',
    'street_light',
    'street-light',
    'street lamp',
    'streetlamp',
    'lighting',
    'light_pole',
    'light-pole',
    'exposed_wiring',
  ],
  Potholes: [
    'pothole',
    'road_repair',
    'road-repair',
    'roadrepair',
    'bitumen',
    'asphalt',
    'road_resurfacing',
  ],
  Drainage: ['drainage', 'culvert', 'stormwater', 'blocked_drain'],
  'Open Manholes': ['manhole', 'open_manhole', 'open-manhole'],
  'Water Leaks': ['water_leak', 'water-leak', 'pipe_leak', 'pipe-leak'],
  'Debris & Floods': ['debris', 'flooding', 'flood', 'rubble'],
};

function identifyEvidenceCategory(
  imageUrl?: string,
): EvidenceCategory | null {
  if (!imageUrl) return null;

  const value = decodeURIComponent(imageUrl)
    .toLowerCase()
    .replace(/%20/g, ' ');

  const matches = (Object.entries(CATEGORY_KEYWORDS) as [
    EvidenceCategory,
    string[],
  ][]).filter(([, keywords]) =>
    keywords.some((keyword) => value.includes(keyword)),
  );

  // If the filename contains ambiguous or multiple category signals,
  // do not guess which category the image belongs to.
  return matches.length === 1 ? matches[0][0] : null;
}

function getEvidenceMismatch(complaint: Complaint): string | null {
  const afterPhoto = complaint.evidence?.afterPhotoUrl;

  if (!afterPhoto) {
    return 'No authority repair photo has been attached. The repair cannot be visually reviewed yet.';
  }

  const detectedCategory = identifyEvidenceCategory(afterPhoto);

  if (!detectedCategory) {
    return null;
  }

  if (detectedCategory !== complaint.category) {
    return `The complaint is categorized as "${complaint.category}", but the repair photo filename indicates "${detectedCategory}". This is a possible evidence mismatch and needs review.`;
  }

  return null;
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

function getResolutionQuestion(category: string): string {
  const questions: Record<string, string> = {
    Streetlights: 'Is the reported streetlight problem resolved?',
    Potholes: 'Is the reported road defect completely repaired?',
    Drainage: 'Has the reported drainage problem been resolved?',
    'Open Manholes': 'Has the reported open manhole been made safe?',
    'Water Leaks': 'Has the reported water leak been fixed?',
    'Debris & Floods': 'Has the reported debris or flooding problem been addressed?',
  };

  return questions[category] || 'Has the reported problem been resolved?';
}

export const CitizenFeedback: React.FC<CitizenFeedbackProps> = ({
  complaintId,
  onBack,
  onSuccess,
}) => {
  const { complaints, showToast, refreshComplaints } = useApp();

  const targetComplaint = complaints.find(
    (complaint) => complaint.id === complaintId,
  );

  const [resolutionStatus, setResolutionStatus] =
    useState<CitizenFeedbackData['resolutionStatus']>('fully_repaired');

  const [rating, setRating] = useState(5);

  const [durability, setDurability] =
    useState<CitizenFeedbackData['durability']>('High Standard');

  const [turnaroundSla, setTurnaroundSla] =
    useState<CitizenFeedbackData['turnaroundSla']>('On-Time (Target Met)');

  const [smsClarity, setSmsClarity] =
    useState<CitizenFeedbackData['smsClarity']>('Clear & Informative');

  const [citizenPhotoUrl, setCitizenPhotoUrl] = useState('');

  const [testimonialText, setTestimonialText] = useState('');

  const [publishPublicly, setPublishPublicly] = useState(true);

  const [nominateCrew, setNominateCrew] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  if (!targetComplaint) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <h1 className="font-bold text-slate-900">
            Complaint not found
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Return to your reports and select the complaint you want to review.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-[#0D9488] text-white rounded"
          >
            Back to My Reports
          </button>
        </div>
      </div>
    );
  }

  const complaint = targetComplaint;
  const evidence = complaint.evidence;
  const evidenceMismatch = getEvidenceMismatch(complaint);

  // A known mismatch must not be approved by the citizen through this form.
  const cannotConfirmResolution =
    Boolean(evidenceMismatch) &&
    resolutionStatus === 'fully_repaired';

  const handlePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      event.target.value = '';
      return;
    }

    // Avoid loading unexpectedly large images into browser memory.
    if (file.size > 15 * 1024 * 1024) {
      showToast('Please select an image smaller than 15 MB.', 'error');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCitizenPhotoUrl(reader.result);
        showToast('Citizen follow-up photo attached.', 'success');
      }
    };

    reader.onerror = () => {
      showToast('Could not process the selected photo.', 'error');
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitFeedback = async (
    isReopenRequest = false,
  ) => {
    if (!complaint) {
      showToast('No complaint selected for feedback.', 'error');
      return;
    }

    if (
      !isReopenRequest &&
      cannotConfirmResolution
    ) {
      showToast(
        'A possible evidence mismatch must be reviewed before confirming full resolution.',
        'error',
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: CitizenFeedbackData = {
        resolutionStatus: isReopenRequest
          ? 'not_repaired'
          : resolutionStatus,

        rating: isReopenRequest ? 1 : rating,

        durability: isReopenRequest
          ? 'Needs Rework'
          : durability,

        turnaroundSla,
        smsClarity,

        followUpPhotoUrl: citizenPhotoUrl || undefined,

        testimonialText: isReopenRequest
          ? `Re-inspection requested: ${testimonialText.trim() || 'Please review the repair evidence and the reported problem.'}`
          : testimonialText.trim(),

        publishPublicly,
        nominateCrew: isReopenRequest ? false : nominateCrew,
        submittedAt: new Date().toISOString(),
      };

      await complaintService.submitFeedback(complaint.id, payload);
      await refreshComplaints();

      if (isReopenRequest) {
        showToast(
          `Re-inspection request submitted for #${complaint.id}.`,
          'success',
        );
      } else {
        showToast(
          `Feedback submitted for #${complaint.id}.`,
          'success',
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to submit citizen feedback:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Could not save feedback. Please try again.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const location =
    evidence?.beforeCoordinates?.address || complaint.locationName;

  const beforePhoto = evidence?.beforePhotoUrl;
  const afterPhoto = evidence?.afterPhotoUrl;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            My Reports
          </button>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded">
                  Citizen Portal · Resolution Review
                </span>

                <h1 className="text-2xl font-bold text-slate-900 mt-3">
                  Citizen Feedback & Resolution Review
                </h1>

                <p className="text-sm text-slate-600 mt-2">
                  Compare the original complaint with the submitted repair
                  evidence before confirming whether the problem is resolved.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 min-w-56">
                <span className="text-xs text-slate-500">Complaint ID</span>
                <p className="font-mono font-bold text-slate-900">
                  #{complaint.id}
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-2">
                  {complaint.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {complaint.category} · {complaint.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical repair comparison */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
              Physical Repair Comparison
            </h2>
            <span className="text-xs text-slate-500">
              Compare the original report and repair evidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Original complaint */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Original Complaint Photo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {complaint.category} · Reported {formatDate(complaint.reportedAt)}
                </p>
              </div>

              <div className="h-64 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                {beforePhoto ? (
                  <img
                    src={beforePhoto}
                    alt={`Original ${complaint.category} complaint`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-600 mt-2">
                      Original photo unavailable
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                {location}
              </p>

              <p className="text-xs text-slate-500">
                Reported problem: {complaint.description}
              </p>
            </div>

            {/* Repair evidence */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Authority Repair Evidence
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {evidence?.afterTimestamp
                    ? `Evidence submitted ${formatDate(evidence.afterTimestamp)}`
                    : 'Repair evidence date not available'}
                </p>
              </div>

              <div className="h-64 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                {afterPhoto ? (
                  <img
                    src={afterPhoto}
                    alt={`Submitted repair evidence for ${complaint.category} complaint`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 mt-2">
                      No repair photo available
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      A repair photo is needed for visual review.
                    </p>
                  </div>
                )}
              </div>

              {evidence?.crewName && (
                <p className="text-xs text-slate-600">
                  <strong>Reported crew:</strong> {evidence.crewName}
                </p>
              )}

              {evidence?.materialUsed && (
                <p className="text-xs text-slate-600">
                  <strong>Material used:</strong> {evidence.materialUsed}
                </p>
              )}

              {evidence?.sealId && (
                <p className="text-xs text-slate-600">
                  <strong>Evidence reference:</strong> {evidence.sealId}
                </p>
              )}
            </div>
          </div>

          {/* Evidence mismatch warning */}
          {evidenceMismatch && (
            <div
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">
                    Repair Evidence Needs Review
                  </h3>
                  <p className="text-sm text-red-800 mt-1">
                    {evidenceMismatch}
                  </p>
                  <p className="text-xs text-red-800 mt-2">
                    This check uses available evidence and filename clues only.
                    It does not establish the actual contents or authenticity
                    of an image. Request re-inspection if the evidence does
                    not show the reported problem being repaired.
                  </p>
                </div>
              </div>
            </div>
          )}

          {evidence?.verificationChecks && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-800">
                Recorded Evidence Checks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                <p>
                  Location match:{' '}
                  <strong>
                    {evidence.verificationChecks.locationMatch
                      ? 'Pass'
                      : 'Needs review'}
                  </strong>
                </p>
                <p>
                  Timeline match:{' '}
                  <strong>
                    {evidence.verificationChecks.timelineMatch
                      ? 'Pass'
                      : 'Needs review'}
                  </strong>
                </p>
                <p>
                  Visual match recorded:{' '}
                  <strong>
                    {evidence.verificationChecks.visualMatch
                      ? 'Pass'
                      : 'Not passed'}
                  </strong>
                </p>
                <p>
                  Integrity check recorded:{' '}
                  <strong>
                    {evidence.verificationChecks.integrityAuthentic
                      ? 'Pass'
                      : 'Not passed'}
                  </strong>
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                These are stored check results, not an independent re-analysis
                of the uploaded image on this page.
              </p>
            </div>
          )}
        </section>

        {/* Feedback form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1 */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-xs font-bold text-slate-500">
                STEP 1 · RESOLUTION STATUS
              </p>

              <h2 className="text-base font-bold text-slate-900">
                {getResolutionQuestion(complaint.category)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ['fully_repaired', 'Yes, fully resolved'],
                    ['partially_repaired', 'Partially resolved'],
                    ['not_repaired', 'No, problem remains'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setResolutionStatus(value)}
                    className={`p-4 rounded-lg border text-left text-sm font-semibold ${
                      resolutionStatus === value
                        ? 'border-[#0D9488] bg-teal-50 ring-1 ring-[#0D9488]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {cannotConfirmResolution && (
                <p className="text-sm text-red-700">
                  Full-resolution confirmation is disabled because the repair
                  evidence is missing or a possible category mismatch was
                  detected. Request a re-inspection after the evidence is
                  corrected and reviewed.
                </p>
              )}
            </section>

            {/* Step 2 */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <p className="text-xs font-bold text-slate-500">
                STEP 2 · QUALITY ASSESSMENT
              </p>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Rate the repair experience
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Base your rating on the actual repair and your observations.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Overall rating
                </label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} out of 5`}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-600">
                    {rating}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Repair quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'Needs Rework',
                      'Passable',
                      'High Standard',
                      'Flawless Grade',
                    ] as const
                  ).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setDurability(option)}
                      className={`p-2 rounded border text-xs ${
                        durability === option
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Turnaround
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'Behind Schedule',
                      'On-Time (Target Met)',
                      'Ahead of Schedule (<30h)',
                    ] as const
                  ).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setTurnaroundSla(option)}
                      className={`p-2 rounded border text-xs ${
                        turnaroundSla === option
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Notification clarity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'Unclear / Delayed SMS',
                      'Clear & Informative',
                      'Proactive Updates',
                    ] as const
                  ).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setSmsClarity(option)}
                      className={`p-2 rounded border text-xs ${
                        smsClarity === option
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Step 3 */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-xs font-bold text-slate-500">
                STEP 3 · CITIZEN FOLLOW-UP PHOTO
              </p>

              <h2 className="text-base font-bold text-slate-900">
                Upload a current photo (optional)
              </h2>

              <p className="text-xs text-slate-500">
                If possible, take a photo of the same location showing the
                reported problem and its current condition.
              </p>

              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-5 text-center">
                {citizenPhotoUrl ? (
                  <img
                    src={citizenPhotoUrl}
                    alt="Citizen follow-up"
                    className="max-h-56 mx-auto rounded"
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-teal-700 mx-auto" />
                    <p className="text-sm text-slate-700 mt-2">
                      Choose a follow-up photo
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Images up to 15 MB
                    </p>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  aria-label="Upload citizen follow-up photo"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </section>

            {/* Step 4 */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-xs font-bold text-slate-500">
                STEP 4 · REMARKS & FEEDBACK
              </p>

              <label className="block text-sm font-semibold text-slate-700">
                Your observations
              </label>

              <textarea
                rows={4}
                value={testimonialText}
                onChange={(event) => setTestimonialText(event.target.value)}
                placeholder={`Describe the current condition of the ${complaint.category.toLowerCase()} problem...`}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0D9488]"
              />

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={publishPublicly}
                  onChange={(event) =>
                    setPublishPublicly(event.target.checked)
                  }
                  className="mt-1"
                />
                Share my feedback publicly.
              </label>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={nominateCrew}
                  onChange={(event) => setNominateCrew(event.target.checked)}
                  className="mt-1"
                />
                Nominate the field crew for recognition.
              </label>
            </section>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={submitting || cannotConfirmResolution}
                onClick={() => void handleSubmitFeedback(false)}
                className="w-full py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting
                  ? 'Submitting...'
                  : 'Submit Feedback & Confirm Resolution'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmitFeedback(true)}
                className="w-full py-3 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Request Re-Inspection
              </button>

              <p className="text-xs text-slate-500 text-center">
                Review the evidence carefully. Your feedback records your
                assessment; it does not independently authenticate a repair.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#0D9488]" />
                Review Checklist
              </h2>

              <div className="space-y-3 text-sm text-slate-600">
                <p>1. Check that the repair addresses the original category.</p>
                <p>2. Compare the before and after photos.</p>
                <p>3. Check that both photos relate to the same location.</p>
                <p>4. Request re-inspection if evidence is missing or inconsistent.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-500" />
                Evidence limitations
              </h2>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                RoadWatch displays the evidence and recorded checks available
                for this complaint. This page does not independently run
                image recognition, validate GPS metadata, or generate a
                cryptographic hash.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
