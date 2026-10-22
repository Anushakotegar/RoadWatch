import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { ComplaintCategory, SeverityLevel } from '../types';
import { 
  Camera, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  UploadCloud, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Navigation,
  Check,
  Info
} from 'lucide-react';
import { WardMap } from '../components/maps/WardMap';

interface ReportIssueProps {
  onSuccess: (newId: string) => void;
  onCancel: () => void;
}

export const ReportIssue: React.FC<ReportIssueProps> = ({ onSuccess, onCancel }) => {
  const { currentUser, showToast, refreshComplaints } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<ComplaintCategory>('Potholes');
  const [severity, setSeverity] = useState<SeverityLevel>('High');
  const [description, setDescription] = useState<string>('Deep road depression spanning across lane. Severe hazard for two-wheelers.');
  const [locationName, setLocationName] = useState<string>('Outer Ring Road, Near Ecospace, Bellandur, Bengaluru');
  const [ward, setWard] = useState<string>('Ward 150 · BBMP Mahadevapura');
  const [lat, setLat] = useState<number>(12.9260);
  const [lng, setLng] = useState<number>(77.6830);
  const [photoUrl, setPhotoUrl] = useState<string>('/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg');
  const [aiAccepted, setAiAccepted] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const categories: ComplaintCategory[] = [
    'Potholes',
    'Streetlights',
    'Drainage',
    'Open Manholes',
    'Water Leaks',
    'Debris & Floods'
  ];

  const handleSimulateGPS = () => {
    // Simulated GPS lock with realistic coordinates
    setLat(12.9716);
    setLng(77.6412);
    setLocationName('14th Main Rd, Indiranagar, Ward 150, Bengaluru');
    setWard('Ward 150 · BBMP East');
    showToast('GPS coordinates locked: 12.9716° N, 77.6412° E (±4m accuracy)', 'info');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      showToast('Image uploaded. Simulated AI vision scan initiated...', 'info');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const newRecord = await complaintService.createComplaint({
        title: `${severity === 'Critical' || severity === 'High' ? 'Severe' : 'Reported'} ${category} Hazard`,
        category,
        description,
        severity,
        ward,
        locationName,
        coordinates: { lat, lng },
        citizenName: currentUser?.name || 'Citizen Ananya S.',
citizenPhoneMasked: currentUser?.phone || '+91 9845X XXXXX',
        evidence: {
          beforePhotoUrl: photoUrl,
          beforeTimestamp: new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          beforeCoordinates: {
            lat,
            lng,
            address: locationName
          }
        },
        aiSuggested: {
          category,
          severity,
          confidencePercent: 94,
          rationale: 'In-browser smart scan detected depth depression exceeding standard threshold.'
        }
      });

      await refreshComplaints();
      setSubmittedId(newRecord.id);
      showToast(`Complaint #${newRecord.id} generated in demo sandbox!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error creating report in demo store', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Report Logged Successfully</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your demonstration complaint has been created in the local civic sandbox and routed to the ward review queue.
          </p>

          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg inline-block text-left w-full max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs text-slate-500 font-semibold">Complaint Docket ID:</span>
              <span className="font-mono text-sm font-bold text-slate-900">#{submittedId}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-500">Jurisdiction:</span>
              <span className="font-medium text-slate-800">{ward}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500">Category & Priority:</span>
              <span className="font-medium text-slate-800">{category} ({severity})</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 text-left mb-6">
            <strong>Demonstration Notice:</strong> This is a local prototype report. No actual dispatch to municipal authorities occurs. You can immediately inspect, assign, or repair this docket using the role switcher or tracking page.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onSuccess(submittedId)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              Track Complaint Docket #{submittedId}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedId(null);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                currentStep === 1 ? 'text-[#0D9488]' : 'text-slate-500'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 1 ? 'bg-[#0D9488] text-white' : currentStep > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>1. Defect Details</span>
            </button>
            <span className="h-0.5 w-12 bg-slate-200" />

            <button
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                currentStep === 2 ? 'text-[#0D9488]' : 'text-slate-500'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 2 ? 'bg-[#0D9488] text-white' : currentStep > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>2. Location & Ward</span>
            </button>
            <span className="h-0.5 w-12 bg-slate-200" />

            <button
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                currentStep === 3 ? 'text-[#0D9488]' : 'text-slate-500'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 3 ? 'bg-[#0D9488] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </span>
              <span>3. Review & Submit</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Form + AI Assistant Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            
            {/* STEP 1: DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Step 1: Incident Description & Photo</h2>
                  <p className="text-xs text-slate-500 mt-1">Upload a clear photo of the infrastructure defect to initiate automated triage assistance.</p>
                </div>

                {/* Photo Upload Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Defect Photo (Mandatory for Geotag Validation)
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center hover:bg-slate-100/70 transition-colors">
                    {photoUrl ? (
                      <div className="relative inline-block max-h-64 rounded overflow-hidden shadow-sm">
                        <img src={photoUrl} alt="Complaint preview" className="max-h-60 rounded object-cover" />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          EXIF Geotag: 12.9260° N, 77.6830° E
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-600 font-medium">Drag & drop photo here, or browse files</p>
                        <p className="text-[11px] text-slate-400">JPEG, PNG, HEIC up to 15MB • Automatic EXIF Geolocation Extraction</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  {photoUrl && (
                    <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sample image loaded. EXIF metadata matched to municipal grid.
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Civic Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 text-left rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          category === cat
                            ? 'border-[#0D9488] bg-teal-50/60 text-[#0F766E] ring-1 ring-[#0D9488]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Estimated Urgency / Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Low', 'Medium', 'High'] as SeverityLevel[]).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-2 text-center text-xs font-semibold rounded border transition-colors cursor-pointer ${
                          severity === sev
                            ? sev === 'High'
                              ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                              : 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Detailed Citizen Notes
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific dimensions, landmarks, safety risks for commuters..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Next: Incident Location
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 font-display">Step 2: Incident Location</h2>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                      GPS Locked
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Confirm the incident location. We automatically detect your ward and assign the responsible local field team.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Street Address or Landmark
                    </label>
                    <button
                      type="button"
                      onClick={handleSimulateGPS}
                      className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Use Current Location
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                    />
                  </div>
                </div>

                {/* Ward Detected Badge */}
                <div className="p-3 bg-slate-100 rounded border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Detected Municipal Jurisdiction:</span>
                    <span className="font-semibold text-slate-900 ml-2">{ward}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600">
                    GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                  </span>
                </div>

                {/* Interactive Map */}
                <div>
                  <WardMap
                    center={[lat, lng]}
                    zoom={15}
                    height="280px"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Review & Submit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & SUBMIT */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Step 3: Review Complaint Dossier</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please inspect the information prior to submitting to the ward infrastructure dispatch system.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div>
                    <img
                      src={photoUrl}
                      alt="Review intake"
                      className="w-full h-48 object-cover rounded-md border border-slate-200"
                    />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Civic Category:</span>
                      <span className="font-bold text-slate-900 text-sm">{category}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Estimated Urgency:</span>
                      <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                        severity === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {severity} Priority
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Ward Jurisdiction:</span>
                      <span className="font-medium text-slate-900">{ward}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Location Landmark:</span>
                      <span className="font-medium text-slate-800">{locationName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Citizen Description:</span>
                      <p className="text-slate-700 italic mt-0.5">"{description}"</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Simulation Submission Notice:</strong> Submitting will create a simulated ticket in the local dataset with a generated Complaint ID. No live government notification is transmitted.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Location
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {submitting ? 'Generating Docket...' : 'Submit Report →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* AI Assistant Sidebar Panel (Matches Image 7) (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#0D9488] font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Assistant</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  94% Match
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                In-browser smart scan: Analyzes your photo to suggest category and severity before submission. You can edit or override anytime.
              </p>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  SUGGESTED CLASSIFICATION
                </span>
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-slate-900 text-sm">Severe Pothole</h4>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  Detected road depression exceeding 10cm depth across commuter lane.
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded text-xs text-slate-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Nearest report: 450m away on 27 Feb</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Helps prevent duplicate tickets for the same defect within your neighborhood.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Potholes');
                    setSeverity('High');
                    setAiAccepted(true);
                    showToast('AI suggestions accepted (Category: Potholes, Severity: High)', 'success');
                  }}
                  className={`w-full py-2.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    aiAccepted ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Accept Suggestion
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 text-center transition-colors cursor-pointer"
                >
                  Edit Details
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                Simulated AI Vision Scan • Subject to Human Ward Sign-off
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
