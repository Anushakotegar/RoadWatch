import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { WardMap } from '../components/maps/WardMap';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Download, 
  Filter, 
  SlidersHorizontal,
  Camera,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Map as MapIcon,
  List
} from 'lucide-react';

interface PublicExplorerProps {
  onNavigateToFeedback: (complaintId: string) => void;
  onNavigateToReport: () => void;
  onNavigateToEvidenceGuard: (complaintId: string) => void;
}

export const PublicExplorer: React.FC<PublicExplorerProps> = ({
  onNavigateToFeedback,
  onNavigateToReport,
  onNavigateToEvidenceGuard
}) => {
  const { complaints, selectedComplaintId, setSelectedComplaintId, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedWard, setSelectedWard] = useState<string>('Ward 112 (Domlur)');
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [activeCaseId, setActiveCaseId] = useState<string>(selectedComplaintId || 'RW-2025-8488');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter complaints
  const filteredComplaints = complaints.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
    if (selectedWard !== 'All Wards' && !item.ward.includes(selectedWard.replace(' (Domlur)', '').replace('Ward ', ''))) {
      // allow partial match
      if (!item.ward.toLowerCase().includes('112') && selectedWard.includes('112')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeComplaint = complaints.find(c => c.id === activeCaseId) || complaints[0];

  const handleSelectCase = (caseItem: Complaint) => {
    setActiveCaseId(caseItem.id);
    setSelectedComplaintId(caseItem.id);
  };

  const handleEndorseActive = async () => {
    if (!activeComplaint) return;
    activeComplaint.endorsementsCount += 1;
    showToast(`Appreciation recorded for #${activeComplaint.id}`, 'success');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Public link copied for Case #${activeComplaint?.id}`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header bar matching Stitch screenshot */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Public Transparency Portal
              </span>
              <span>·</span>
              <span>Verified Real-time Ward Data (Simulation)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              Explore Public Reports
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl mt-1">
              Browse community-reported civic issues across municipal wards. Search, track public remediation progress on interactive maps, and submit feedback or request audit reviews.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() => setSelectedWard(selectedWard === 'All Wards' ? 'Ward 112 (Domlur)' : 'All Wards')}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              Refine Ward Scope
            </button>
            <button
              onClick={onNavigateToReport}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Report New Issue
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics matching Image 3 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b-2 sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Reports Filed</span>
              <span className="text-teal-600 font-bold text-xs">●</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">1,428</span>
              <span className="text-[11px] font-medium text-emerald-600">+18 today</span>
            </div>
          </div>

          <div className="border-b-2 sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Remediation In Progress</span>
              <span className="text-amber-500 font-bold text-xs">●</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">412</span>
              <span className="text-[11px] font-medium text-slate-500">Active teams</span>
            </div>
          </div>

          <div className="border-r border-slate-100 pr-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Resolved & Citizen Verified</span>
              <span className="text-emerald-600 font-bold text-xs">●</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">984</span>
              <span className="text-[11px] font-medium text-emerald-700">68.9% rate</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg. Resolution Speed</span>
              <span className="text-slate-400 font-bold text-xs">●</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">36.4 hrs</span>
              <span className="text-[11px] font-medium text-emerald-600">↓ 4.2 hrs faster</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar matching Image 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by issue type (e.g. Pothole, Streetlight, Drainage) or location (e.g. Indiranagar, Domlur)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
              />
            </div>
            <button
              onClick={() => {}}
              className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors w-full md:w-auto cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Filter Pills & Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { label: 'All', count: 142 },
                { label: 'Potholes', count: 58 },
                { label: 'Streetlights', count: 34 },
                { label: 'Drainage', count: 28 },
                { label: 'Open Manholes', count: 22 }
              ].map(pill => {
                const isSelected = selectedCategory === pill.label;
                return (
                  <button
                    key={pill.label}
                    onClick={() => setSelectedCategory(pill.label)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pill.label} ({pill.count})
                  </button>
                );
              })}
            </div>

            {/* View Mode & Selectors */}
            <div className="flex items-center gap-2 text-xs">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#0D9488]"
              >
                <option value="All">All Statuses</option>
                <option value="In Progress">In Progress (Selected)</option>
                <option value="Evidence Submitted">Evidence Submitted</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#0D9488]"
              >
                <option value="Ward 112 (Domlur)">Ward 112 (Domlur)</option>
                <option value="Ward 150 (Indiranagar)">Ward 150 (Indiranagar)</option>
                <option value="All Wards">All BBMP Wards</option>
              </select>

              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('feed')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 cursor-pointer ${
                    viewMode === 'feed' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Feed
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 cursor-pointer ${
                    viewMode === 'map' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Live Map
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Content: Left Cases List, Right Active Case Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Feed Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-800">
                {selectedWard} Feed <span className="text-emerald-700 font-semibold">({filteredComplaints.length} Active Cases)</span>
              </span>
              <span className="text-slate-400">Sorted by Urgency</span>
            </div>

            <div className="space-y-3">
              {filteredComplaints.map(item => {
                const isSelected = activeCaseId === item.id;
                const isCritical = item.severity === 'Critical';
                const isResolved = item.status === 'Resolved';
                const isInProgress = item.status === 'In Progress' || item.status === 'Evidence Submitted';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCase(item)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all shadow-sm ${
                      isSelected
                        ? 'border-[#0D9488] ring-1 ring-[#0D9488] bg-teal-50/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-700">#{item.id}</span>
                      <div className="flex items-center gap-1.5">
                        {isCritical && (
                          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-200">
                            High Hazard
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                          isResolved 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isInProgress 
                            ? 'bg-teal-100 text-teal-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          ● {item.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-slate-900 text-sm leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <img
                        src={item.evidence.beforePhotoUrl}
                        alt="Thumbnail"
                        className="w-16 h-12 object-cover rounded border border-slate-200"
                      />
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="line-clamp-1">{item.locationName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Reported {item.reportedAt.split(',')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {item.endorsementsCount} Endorsements
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {item.commentsCount} Comments
                        </span>
                      </div>
                      <span className="font-semibold text-[#0D9488] flex items-center gap-0.5">
                        {isSelected ? 'Inspecting →' : 'View Docket'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Showing 1-3 of 28 ward records</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
                >
                  ‹
                </button>
                <span className="px-2.5 py-1 bg-slate-900 text-white rounded font-mono font-bold text-xs">{currentPage}</span>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Right Case Detail & Forensic Audit Dossier (Matches Image 3) (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    CASE #{activeComplaint.id}
                  </span>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    ● {activeComplaint.status} - Evidence Uploaded
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display mt-1">
                  {activeComplaint.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeComplaint.locationName} · {activeComplaint.severity} Urgency Hazard
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button 
                  onClick={handleShare}
                  className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50 cursor-pointer"
                  title="Share Case"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => showToast('Docket audit export PDF generated (Simulated)', 'info')}
                  className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50 cursor-pointer"
                  title="Download Evidence Dossier"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Geocoded Incident Map (Pinpoint: 12th Cross & 4th Main) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  Geocoded Incident Coordinates: <span className="font-mono font-normal">{activeComplaint.coordinates.lat}° N, {activeComplaint.coordinates.lng}° E</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  25m GPS Radius Lock
                </span>
              </div>
              <WardMap
                center={[activeComplaint.coordinates.lat, activeComplaint.coordinates.lng]}
                zoom={16}
                height="200px"
              />
            </div>

            {/* Photographic Audit Evidence (Tamper-Sealed) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                  Photographic Audit Evidence (Tamper-Sealed)
                </h3>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  SHA-256 Verified EXIF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pre-repair */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold">Citizen Hazard Photo (Pre-Repair)</span>
                    <span className="font-mono text-[10px]">Feb 26, 08:39 AM</span>
                  </div>
                  <img
                    src={activeComplaint.evidence.beforePhotoUrl}
                    alt="Pre-repair intake"
                    className="w-full h-40 object-cover rounded border border-slate-200"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Uploaded by: {activeComplaint.citizenName}</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">GPS: Match (99.8%)</span>
                  </div>
                </div>

                {/* Progress / After */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold">Field Team Progress Photo (Work Underway)</span>
                    <span className="font-mono text-[10px]">Feb 28, 04:12 PM</span>
                  </div>
                  <img
                    src={activeComplaint.evidence.afterPhotoUrl || '/src/assets/images/municipal_crew_working_1792346313563.jpg'}
                    alt="Work underway"
                    className="w-full h-40 object-cover rounded border border-slate-200"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Field Crew: {activeComplaint.assignedCrew?.name || 'Squad #14'}</span>
                    <span className="text-teal-700 font-semibold bg-teal-50 px-1 rounded">GeoStamp Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remediation Lifecycle Audit bar (Step 4 of 5 Active) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Remediation Lifecycle Audit</span>
                <span className="text-slate-500 font-mono text-[11px]">Step 4 of 5 Active</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                <div className="text-emerald-800 font-semibold">
                  <div className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1">✓</div>
                  1. Reported
                </div>
                <div className="text-emerald-800 font-semibold">
                  <div className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1">✓</div>
                  2. Assigned
                </div>
                <div className="text-emerald-800 font-semibold">
                  <div className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1">✓</div>
                  3. Dispatched
                </div>
                <div className="text-slate-900 font-bold">
                  <div className="w-5 h-5 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center mb-1">4</div>
                  4. Evidence In
                </div>
                <div className="text-slate-400">
                  <div className="w-5 h-5 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mb-1">5</div>
                  5. Sign-off
                </div>
              </div>
            </div>

            {/* Official Ward Dispatch Log & Public Timeline */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Official Ward Dispatch Log & Public Timeline
              </h4>

              <div className="space-y-2.5">
                {activeComplaint.comments?.map(cmt => (
                  <div key={cmt.id} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-900">{cmt.author}</span>
                      <span className="text-slate-400 font-mono">{cmt.timestamp}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic">"{cmt.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Oversight & Citizen Sign-off Actions */}
            <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-200 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Public Oversight & Citizen Sign-Off</h4>
                <p className="text-xs text-slate-600">Citizen voice ensures accountability: Your feedback directly impacts contractor quality scores and municipal escrow payment releases.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onNavigateToFeedback(activeComplaint.id)}
                  className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  Give Feedback & Rate Repair
                </button>
                <button
                  onClick={() => onNavigateToEvidenceGuard(activeComplaint.id)}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  Request Re-Inspection
                </button>
                <button
                  onClick={handleEndorseActive}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                  {activeComplaint.endorsementsCount} Citizens Appreciated
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* EvidenceGuard Public Proof Policy Notice matching Image 3 bottom */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0" />
            <span>
              <strong>EvidenceGuard™ Public Proof Policy:</strong> All closure certificates require dual-source confirmation: field squad EXIF GPS data + minimum 3 independent ward resident affirmations.
            </span>
          </div>
          <button 
            onClick={() => onNavigateToEvidenceGuard(activeComplaint.id)}
            className="text-[#0D9488] font-semibold hover:underline whitespace-nowrap cursor-pointer"
          >
            Read Citizen Audit Charter →
          </button>
        </div>

      </div>
    </div>
  );
};
