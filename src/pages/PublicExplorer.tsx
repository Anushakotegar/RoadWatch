
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Complaint } from '../types';
import { WardMap } from '../components/maps/WardMap';
import {
  Search,
  MapPin,
  ShieldCheck,
  Clock,
  ThumbsUp,
  MessageSquare,
  Share2,
  Download,
  SlidersHorizontal,
  Camera,
  AlertTriangle,
  Map as MapIcon,
  List,
  Image as ImageIcon,
} from 'lucide-react';

interface PublicExplorerProps {
  onNavigateToFeedback: (complaintId: string) => void;
  onNavigateToReport: () => void;
  onNavigateToEvidenceGuard: (complaintId: string) => void;
}

const DEMO_IMAGES = {
  pothole: '/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg',
  manhole: '/src/assets/images/open_manhole_hazard_1792346312725.jpg',
  crew: '/src/assets/images/municipal_crew_working_1792346313563.jpg',
  repairedRoad:
    '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg',
};

const DEMO_IMAGE_NAMES = Object.values(DEMO_IMAGES);

function isDemoImage(url?: string): boolean {
  if (!url) return false;
  return DEMO_IMAGE_NAMES.some((path) => url.includes(path.split('/').pop()!));
}

function getCategoryKey(category?: string): string {
  const value = (category || '').toLowerCase();

  if (value.includes('streetlight') || value.includes('street light') || value.includes('lighting')) {
    return 'streetlight';
  }

  if (value.includes('drain')) {
    return 'drainage';
  }

  if (value.includes('manhole') || value.includes('man hole')) {
    return 'manhole';
  }

  if (value.includes('pothole') || value.includes('road')) {
    return 'pothole';
  }

  return 'other';
}

function getCategoryBeforeImage(complaint: Complaint): string {
  switch (getCategoryKey(complaint.category)) {
    case 'pothole':
      return DEMO_IMAGES.pothole;
    case 'manhole':
      return DEMO_IMAGES.manhole;
    case 'streetlight':
      return DEMO_IMAGES.crew;
    case 'drainage':
      return DEMO_IMAGES.manhole;
    default:
      return DEMO_IMAGES.crew;
  }
}

function getBeforeImage(complaint: Complaint): {
  url: string;
  isSample: boolean;
} {
  const uploadedUrl = complaint.evidence?.beforePhotoUrl;

  if (uploadedUrl && !isDemoImage(uploadedUrl)) {
    return { url: uploadedUrl, isSample: false };
  }

  return {
    url: getCategoryBeforeImage(complaint),
    isSample: true,
  };
}

function getAfterImage(complaint: Complaint): {
  url: string | null;
  isSample: boolean;
} {
  const uploadedUrl = complaint.evidence?.afterPhotoUrl;

  // A genuine uploaded photo takes priority over demo assets.
  if (uploadedUrl && !isDemoImage(uploadedUrl)) {
    return { url: uploadedUrl, isSample: false };
  }

  // Use existing demo evidence only when it fits the category.
  // Never show a road-repair photo as proof for a streetlight or drain repair.
  switch (getCategoryKey(complaint.category)) {
    case 'pothole':
      if (uploadedUrl && isDemoImage(uploadedUrl)) {
        return { url: DEMO_IMAGES.repairedRoad, isSample: true };
      }
      return { url: null, isSample: false };

    case 'manhole':
      if (uploadedUrl && isDemoImage(uploadedUrl)) {
        return { url: DEMO_IMAGES.crew, isSample: true };
      }
      return { url: null, isSample: false };

    case 'streetlight':
    case 'drainage':
    default:
      return { url: null, isSample: false };
  }
}

export const PublicExplorer: React.FC<PublicExplorerProps> = ({
  onNavigateToFeedback,
  onNavigateToReport,
  onNavigateToEvidenceGuard,
}) => {
  const {
    complaints,
    selectedComplaintId,
    setSelectedComplaintId,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWard, setSelectedWard] = useState('Ward 112 (Domlur)');
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [activeCaseId, setActiveCaseId] = useState(
    selectedComplaintId || '',
  );
  const [currentPage, setCurrentPage] = useState(1);

  const filteredComplaints = complaints.filter((item) => {
    if (selectedCategory !== 'All') {
      const itemCategory = getCategoryKey(item.category);
      const filterCategory = getCategoryKey(selectedCategory);

      if (itemCategory !== filterCategory) return false;
    }

    if (selectedStatus !== 'All' && item.status !== selectedStatus) {
      return false;
    }

    if (selectedWard !== 'All Wards') {
      const wardNumber = selectedWard.match(/\d+/)?.[0];
      if (wardNumber && !item.ward.includes(wardNumber)) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      return (
        item.id.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.locationName.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const activeComplaint =
    filteredComplaints.find((item) => item.id === activeCaseId) ||
    complaints.find((item) => item.id === activeCaseId) ||
    filteredComplaints[0] ||
    complaints[0];

  const handleSelectCase = (caseItem: Complaint) => {
    setActiveCaseId(caseItem.id);
    setSelectedComplaintId(caseItem.id);
  };

  const handleEndorseActive = () => {
    if (!activeComplaint) return;

    showToast(
      'Appreciation action is a demo and has not been saved to the server.',
      'info',
    );
  };

  const handleShare = async () => {
    if (!activeComplaint) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(`Public link copied for Case #${activeComplaint.id}`, 'success');
    } catch {
      showToast('Unable to copy the link in this browser.', 'error');
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const selectedBefore = activeComplaint
    ? getBeforeImage(activeComplaint)
    : null;

  const selectedAfter = activeComplaint
    ? getAfterImage(activeComplaint)
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Public Transparency Portal
              </span>
              <span>·</span>
              <span>Demo data where indicated</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Explore Public Reports
            </h1>

            <p className="text-xs text-slate-600 max-w-2xl mt-1">
              Browse reported potholes, streetlights, drainage and open
              manholes. Sample images are clearly labelled and are not
              proof that a repair has been completed.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() =>
                setSelectedWard(
                  selectedWard === 'All Wards'
                    ? 'Ward 112 (Domlur)'
                    : 'All Wards',
                )
              }
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Refine Ward Scope
            </button>

            <button
              onClick={onNavigateToReport}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Report New Issue
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Reports in Current Data
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {complaints.length}
            </div>
          </div>

          <div className="border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              In Progress
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {
                complaints.filter((item) =>
                  ['Assigned', 'In Progress'].includes(item.status),
                ).length
              }
            </div>
          </div>

          <div className="border-r border-slate-100 pr-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Evidence Submitted
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {
                complaints.filter(
                  (item) => item.status === 'Evidence Submitted',
                ).length
              }
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Resolved Reports
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {
                complaints.filter((item) => item.status === 'Resolved').length
              }
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by issue type, report ID or location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
              />
            </div>

            <button
              onClick={() => setCurrentPage(1)}
              className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 w-full md:w-auto"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                'All',
                'Potholes',
                'Streetlights',
                'Drainage',
                'Open Manholes',
              ].map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Evidence Submitted">Evidence Submitted</option>
                <option value="Authority Review">Authority Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
                <option value="Flagged for Audit">Flagged for Audit</option>
              </select>

              <select
                value={selectedWard}
                onChange={(event) => setSelectedWard(event.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700"
              >
                <option value="Ward 112 (Domlur)">Ward 112 (Domlur)</option>
                <option value="Ward 150 (Indiranagar)">
                  Ward 150 (Indiranagar)
                </option>
                <option value="All Wards">All BBMP Wards</option>
              </select>

              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('feed')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'feed'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Feed
                </button>

                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'map'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Live Map
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-800">
                {selectedWard} Feed ({filteredComplaints.length} reports)
              </span>
              <span>{filteredComplaints.length} matching</span>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-6 text-sm text-slate-600">
                No reports match these filters. Try another category, status
                or ward.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map((item) => {
                  const isSelected = activeCaseId === item.id;
                  const isCritical = item.severity === 'Critical';
                  const isResolved = item.status === 'Resolved';
                  const isInProgress = [
                    'Assigned',
                    'In Progress',
                    'Evidence Submitted',
                    'Authority Review',
                  ].includes(item.status);
                  const beforeImage = getBeforeImage(item);

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
                      <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          #{item.id}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {isCritical && (
                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200">
                              High Hazard
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInProgress
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="relative shrink-0">
                          <img
                            src={beforeImage.url}
                            alt={`${item.category} report image`}
                            onError={(event) => {
                              event.currentTarget.src = DEMO_IMAGES.crew;
                            }}
                            className="w-16 h-12 object-cover rounded border border-slate-200"
                          />
                          {beforeImage.isSample && (
                            <span className="absolute inset-x-0 bottom-0 bg-amber-100/95 text-amber-900 text-[8px] text-center font-bold">
                              SAMPLE
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="line-clamp-1">
                              {item.locationName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Reported {item.reportedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {item.endorsementsCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {item.commentsCount}
                          </span>
                        </div>

                        <span className="font-semibold text-[#0D9488]">
                          {isSelected ? 'Selected' : 'View Docket'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>
                {filteredComplaints.length} matching report(s)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
                >
                  ‹
                </button>
                <span className="px-2.5 py-1 bg-slate-900 text-white rounded font-mono font-bold">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            {!activeComplaint ? (
              <div className="text-sm text-slate-600">
                Select a report to view its details.
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                        CASE #{activeComplaint.id}
                      </span>
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {activeComplaint.status}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                      {activeComplaint.title}
                    </h2>

                    <p className="text-xs text-slate-500">
                      {activeComplaint.locationName} ·{' '}
                      {activeComplaint.severity} severity
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={handleShare}
                      className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50"
                      title="Share Case"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        showToast(
                          'Docket export is a demo feature and has not generated a PDF.',
                          'info',
                        )
                      }
                      className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50"
                      title="Download Evidence Dossier"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between text-xs mb-2 gap-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                      Report Coordinates
                    </span>
                    <span className="font-mono text-slate-600">
                      {activeComplaint.coordinates.lat}° N,{' '}
                      {activeComplaint.coordinates.lng}° E
                    </span>
                  </div>

                  <WardMap
                    center={[
                      activeComplaint.coordinates.lat,
                      activeComplaint.coordinates.lng,
                    ]}
                    zoom={16}
                    height="200px"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                      Report and Repair Evidence
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Sample images are not verification results
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                        <span className="font-semibold">
                          Before Photo
                        </span>
                        {selectedBefore?.isSample && (
                          <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                            SAMPLE
                          </span>
                        )}
                      </div>

                      {selectedBefore && (
                        <img
                          src={selectedBefore.url}
                          alt={`Before photo for ${activeComplaint.title}`}
                          onError={(event) => {
                            event.currentTarget.src = DEMO_IMAGES.crew;
                          }}
                          className="w-full h-40 object-cover rounded border border-slate-200"
                        />
                      )}

                      {selectedBefore?.isSample && (
                        <p className="text-[11px] text-amber-800 flex gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Sample image used because this demo report does not
                          have a distinct uploaded photo.
                        </p>
                      )}

                      <div className="text-[10px] text-slate-500">
                        Reported by: {activeComplaint.citizenName}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                        <span className="font-semibold">
                          Repair / Progress Photo
                        </span>
                        {selectedAfter?.isSample && (
                          <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                            SAMPLE
                          </span>
                        )}
                      </div>

                      {selectedAfter?.url ? (
                        <img
                          src={selectedAfter.url}
                          alt={`Repair evidence for ${activeComplaint.title}`}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-40 object-cover rounded border border-slate-200"
                        />
                      ) : (
                        <div className="w-full h-40 rounded border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-500 gap-2">
                          <ImageIcon className="w-7 h-7" />
                          <span className="text-xs font-semibold">
                            No repair photo submitted
                          </span>
                          <span className="text-[10px]">
                            No repair image is available for this report.
                          </span>
                        </div>
                      )}

                      {selectedAfter?.isSample && (
                        <p className="text-[11px] text-amber-800 flex gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Demo sample only. This does not prove the repair
                          occurred.
                        </p>
                      )}

                      {!selectedAfter?.isSample && selectedAfter?.url && (
                        <div className="text-[10px] text-slate-500">
                          Submitted repair image. Authenticity and repair
                          completion have not been independently verified here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-800">
                      Report Lifecycle
                    </span>
                    <span className="text-slate-500 text-right">
                      Current status: {activeComplaint.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                    {[
                      'Reported',
                      'Assigned',
                      'In Progress',
                      'Evidence / Review',
                    ].map((step) => (
                      <div
                        key={step}
                        className="bg-white border border-slate-200 rounded p-2 text-slate-700"
                      >
                        {step}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Lifecycle stages are illustrative. The current status
                    above is taken from the selected report.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Public Timeline and Comments
                  </h4>

                  {activeComplaint.comments?.length ? (
                    <div className="space-y-2.5">
                      {activeComplaint.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-slate-50 p-3 rounded border border-slate-200 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                            <span className="font-semibold text-slate-900">
                              {comment.author}
                            </span>
                            <span className="text-slate-400">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                      No public comments have been added to this report.
                    </p>
                  )}
                </div>

                <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-200 space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Public Oversight
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Residents can share feedback or request another review.
                      Citizen feedback does not replace an authority's review
                      or approval.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() =>
                        onNavigateToFeedback(activeComplaint.id)
                      }
                      className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded"
                    >
                      Give Feedback
                    </button>

                    <button
                      onClick={() =>
                        onNavigateToEvidenceGuard(activeComplaint.id)
                      }
                      className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded"
                    >
                      Request Re-Inspection
                    </button>

                    <button
                      onClick={handleEndorseActive}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded flex items-center gap-1.5 ml-auto"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {activeComplaint.endorsementsCount} Appreciations
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0" />
            <span>
              <strong>Evidence Review Policy:</strong> Photos shown as samples
              are for demonstration only. A displayed image, timestamp or
              location does not independently establish authenticity or
              prove that a repair was completed.
            </span>
          </div>

          {activeComplaint && (
            <button
              onClick={() =>
                onNavigateToEvidenceGuard(activeComplaint.id)
              }
              className="text-[#0D9488] font-semibold hover:underline whitespace-nowrap"
            >
              Review Evidence →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
