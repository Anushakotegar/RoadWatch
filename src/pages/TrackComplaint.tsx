import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { Complaint } from '../types';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Users, 
  Building2, 
  ArrowRight, 
  MessageSquare, 
  AlertCircle,
  Share2,
  Lock,
  ThumbsUp,
  FileText
} from 'lucide-react';
import { WardMap } from '../components/maps/WardMap';

interface TrackComplaintProps {
  onNavigateToFeedback: (complaintId: string) => void;
  onNavigateToExplorer: () => void;
}

export const TrackComplaint: React.FC<TrackComplaintProps> = ({ 
  onNavigateToFeedback,
  onNavigateToExplorer 
}) => {
  const { selectedComplaintId, setSelectedComplaintId, showToast } = useApp();
  const [searchInput, setSearchInput] = useState<string>(selectedComplaintId || 'RW-2025-8492');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [supplementalNote, setSupplementalNote] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(true);

  const fetchRecord = async (id: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await complaintService.getComplaintById(id);
      if (data) {
        setComplaint(data);
        setSelectedComplaintId(data.id);
      } else {
        setComplaint(null);
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedComplaintId) {
      setSearchInput(selectedComplaintId);
      fetchRecord(selectedComplaintId);
    } else {
      fetchRecord('RW-2025-8492');
    }
  }, [selectedComplaintId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    fetchRecord(searchInput.trim());
  };

  const handleQuickLookup = (id: string) => {
    setSearchInput(id);
    fetchRecord(id);
  };

  const handleAddNote = async () => {
    if (!supplementalNote.trim() || !complaint) return;
    await complaintService.addComment(complaint.id, supplementalNote, 'Resident Complainant', 'Verified Reporter');
    showToast('Supplemental note added to ward audit dispatch record', 'success');
    setSupplementalNote('');
    setShowNoteModal(false);
    fetchRecord(complaint.id);
  };

  const handleEndorse = async () => {
    if (!complaint) return;
    const newCount = await complaintService.endorseComplaint(complaint.id);
    setComplaint({ ...complaint, endorsementsCount: newCount });
    showToast('Endorsement recorded in civic ledger (+1)', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb & Title */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Home</span>
            <span>›</span>
            <span>Civic Services</span>
            <span>›</span>
            <span className="font-semibold text-slate-800">Track Complaint</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">Track a Complaint</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track the real-time repair status of community-reported road issues from report to verified completion.
          </p>
        </div>

        {/* Search Bar matching Stitch screenshot */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                #
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="RW-2025-8492"
                className="w-full pl-8 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              Search Complaint
            </button>
          </form>

          {/* Recent Lookups */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Recent Lookups:</span>
            {[
              { id: 'RW-2025-8492', desc: 'Pothole • Indiranagar' },
              { id: 'RW-2025-8488', desc: 'Manhole • Domlur' },
              { id: 'RW-2025-8310', desc: 'Streetlight • Ward 150' },
            ].map(lookup => (
              <button
                key={lookup.id}
                onClick={() => handleQuickLookup(lookup.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer border ${
                  complaint?.id === lookup.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                #{lookup.id} <span className="font-sans font-normal text-slate-400">· {lookup.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Not Found States */}
        {loading && (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Querying municipal audit database...</p>
          </div>
        )}

        {notFound && !loading && (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-900 font-display">Docket Not Found</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              No complaint matching "<span className="font-mono">{searchInput}</span>" was found in this demonstration dataset. Try searching one of the sample tickets: <button onClick={() => handleQuickLookup('RW-2025-8492')} className="text-teal-700 underline font-mono">RW-2025-8492</button> or <button onClick={() => handleQuickLookup('RW-2025-8488')} className="text-teal-700 underline font-mono">RW-2025-8488</button>.
            </p>
          </div>
        )}

        {/* Active Docket View */}
        {complaint && !loading && (
          <div className="space-y-6">
            
            {/* Case Banner & SLA Card (Image 15) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded">
                    CASE #{complaint.id}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-800 border border-teal-200'
                  }`}>
                    {complaint.status}: {complaint.status === 'Resolved' ? 'Completed' : 'Bitumen Curing'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Reported {complaint.reportedAt}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  {complaint.title}
                </h2>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>{complaint.locationName} · {complaint.ward}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    Resident Verified with Photo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Assigned: {complaint.assignedCrew?.name || 'BBMP Roads Division'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {complaint.endorsementsCount} Local Residents Supported
                  </span>
                </div>
              </div>

              {/* Estimated Resolution Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[280px]">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>ESTIMATED RESOLUTION</span>
                </div>
                <p className="font-display font-bold text-slate-900 text-sm">
                  {complaint.status === 'Resolved' ? 'Resolved & Confirmed' : 'Estimated Finish: Today by 5:30 PM'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Within standard 48-hour civic SLA
                </p>
              </div>
            </div>

            {/* Lifecycle Progress Tracker (5 stages matching Image 15) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-900 text-sm">Lifecycle Progress Tracker</h3>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {complaint.status === 'Resolved' ? 'Stage 5 of 5 Complete' : 'Step 4 of 5 Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Step 1 */}
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-teal-800 uppercase mb-1">
                    <span>STEP 1 • COMPLETED</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Reported & Verified</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Citizen photo and GPS locked</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Feb 26, 08:42 AM</p>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-teal-800 uppercase mb-1">
                    <span>STEP 2 • COMPLETED</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Department Assigned</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Ward 112 Roads & Drainage</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Feb 26, 11:15 AM</p>
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-teal-800 uppercase mb-1">
                    <span>STEP 3 • COMPLETED</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Crew Dispatched</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Squad #14 (Bravo) on site</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Feb 27, 09:30 AM</p>
                </div>

                {/* Step 4 */}
                <div className={`p-3 rounded-lg border ${
                  complaint.status === 'Resolved' 
                    ? 'bg-teal-50/50 border-teal-200' 
                    : 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 uppercase mb-1">
                    <span>STEP 4 • {complaint.status === 'Resolved' ? 'COMPLETED' : 'IN PROGRESS'}</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Repair & Curing</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Hot-mix asphalt applied, curing under barricades</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Est. open: 5:30 PM</p>
                </div>

                {/* Step 5 */}
                <div className={`p-3 rounded-lg border ${
                  complaint.status === 'Resolved'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase mb-1">
                    <span>STEP 5 • {complaint.status === 'Resolved' ? 'VERIFIED' : 'UPCOMING'}</span>
                    {complaint.status === 'Resolved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Citizen Sign-off</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Complainant verification & public clearance</p>
                  <p className="text-[10px] text-slate-400 mt-1">Awaits post-cure check</p>
                </div>
              </div>
            </div>

            {/* 2-Column Section: Field Dispatch Memo & Photographic Evidence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Left: Field Dispatch Memo */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0D9488]" />
                    Field Dispatch & Operations Memo
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">Municipal Operations Log</span>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block uppercase">ASSIGNED CONTRACTOR / CREW</span>
                      <span className="font-bold text-slate-900 text-xs">{complaint.assignedCrew?.name || 'Squad #14 (Bravo)'}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      ● On-site
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Lead: {complaint.assignedCrew?.leadForeman || 'Foreman R. Kulkarni'} • Road Maintenance Division
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Work Summary & Status</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                    {complaint.workNotes || 'Repaired 9cm deep pothole cavity using hot bitumen compound. Barricades placed until 5:30 PM for asphalt hardening. Material: Grade 60/70 Bitumen Mix. Compactor: CAT-CB24B.'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Material: Grade 60/70 Bitumen Mix • Compactor: CAT-CB24B
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Exact Worksite Location</h4>
                  <WardMap
                    center={[complaint.coordinates.lat, complaint.coordinates.lng]}
                    zoom={16}
                    height="160px"
                    interactive={false}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>LAT {complaint.coordinates.lat}° N, LON {complaint.coordinates.lng}° E</span>
                    <span>BBMP Zone: East</span>
                  </div>
                </div>
              </div>

              {/* Right: Photographic Evidence */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                    Photographic Evidence
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                    Tamper-Sealed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Before */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">Before (Citizen Report)</span>
                      <span className="text-slate-400 font-mono text-[10px]">Feb 26</span>
                    </div>
                    <div className="relative h-44 bg-slate-100 rounded overflow-hidden border border-slate-200">
                      <img
                        src={complaint.evidence.beforePhotoUrl}
                        alt="Citizen intake"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        GPS: 12.9716, 77.6412
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase">
                        EXIF MATCH
                      </div>
                    </div>
                  </div>

                  {/* After / In-progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">In-Progress (Field Repair)</span>
                      <span className="text-slate-400 font-mono text-[10px]">Feb 28</span>
                    </div>
                    <div className="relative h-44 bg-slate-100 rounded overflow-hidden border border-slate-200">
                      <img
                        src={complaint.evidence.afterPhotoUrl || '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg'}
                        alt="Crew repair"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Foreman: R. Kulkarni
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 bg-teal-700 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase">
                        VERIFIED
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center justify-between">
                  <span>Photographs are GPS-verified to guarantee work was performed at the reported site.</span>
                  <button 
                    onClick={onNavigateToExplorer}
                    className="text-teal-700 font-semibold hover:underline whitespace-nowrap ml-2 text-xs cursor-pointer"
                  >
                    View Audit →
                  </button>
                </div>

                {/* Evidence Hash */}
                <div className="text-[11px] font-mono text-slate-500 bg-slate-100 p-2 rounded truncate">
                  SHA-256 Hash: {complaint.evidence.sha256Hash || 'a8f9c298fe04b862149b109e25d48721ad2f0c79...'}
                </div>
              </div>

            </div>

            {/* Citizen Actions & Oversight Section (Matches Image 15 Bottom) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">Citizen Actions & Oversight</h3>
                  <p className="text-xs text-slate-500">Stay updated, communicate with your local team, or review completed repairs.</p>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Public Oversight Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Alerts */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">SMS & WhatsApp Updates</h4>
                    <p className="text-xs text-slate-600">Receive an instant alert when curing finishes and the lane reopens.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsSubscribed(!isSubscribed);
                      showToast(isSubscribed ? 'Unsubscribed from SMS alerts' : 'Subscribed (+91 9845X XXXXX)', 'info');
                    }}
                    className={`mt-4 w-full py-2 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                      isSubscribed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSubscribed ? '✓ Subscribed (+91 9845X XXXXX)' : 'Subscribe to Phone Alerts'}
                  </button>
                </div>

                {/* 2. Supplemental Note */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">Add Supplemental Note</h4>
                    <p className="text-xs text-slate-600">Share additional details, photos, or instructions directly with the ward team.</p>
                  </div>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="mt-4 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                    Add Supplemental Note
                  </button>
                </div>

                {/* 3. Review & Feedback (Direct Action) */}
                <div className="p-4 bg-teal-50/60 rounded-lg border border-teal-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-[#0F766E] text-xs mb-1">Citizen Review & Feedback</h4>
                    <p className="text-xs text-slate-600">Rate the finished repair quality and confirm satisfaction once curing is complete.</p>
                  </div>
                  <button
                    onClick={() => onNavigateToFeedback(complaint.id)}
                    className="mt-4 w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Citizen Review & Feedback
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Endorse bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Complaints and repair logs are maintained transparently for community accountability.
                </span>
                <button
                  onClick={handleEndorse}
                  className="font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                  Endorse ({complaint.endorsementsCount})
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Supplemental Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 font-display">Add Supplemental Note to Ward Docket</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide additional site observations or commuter hazard updates. This is appended to the official dispatch ledger.
            </p>
            <textarea
              rows={4}
              value={supplementalNote}
              onChange={(e) => setSupplementalNote(e.target.value)}
              placeholder="e.g. Barricades are slightly blown by the wind, please secure with sandbags..."
              className="w-full mt-3 p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
              >
                Submit Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
