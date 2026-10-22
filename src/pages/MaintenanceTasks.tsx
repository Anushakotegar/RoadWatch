import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { Complaint } from '../types';
import { 
  Wrench, 
  Camera, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  QrCode, 
  Plus, 
  Navigation,
  Check,
  ArrowRight
} from 'lucide-react';

interface MaintenanceTasksProps {
  onNavigateToEvidenceGuard: (complaintId: string) => void;
}

export const MaintenanceTasks: React.FC<MaintenanceTasksProps> = ({
  onNavigateToEvidenceGuard
}) => {
  const { complaints, refreshComplaints, showToast } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string>('RW-2025-8492');
  const [taskFilter, setTaskFilter] = useState<'All' | 'High' | 'Pending' | 'In Progress'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active docket form state
  const [workType, setWorkType] = useState('Cold-Mix Bitumen Patch & Compaction');
  const [sealId, setSealId] = useState('#ASPH-W150-84');
  const [crewNotes, setCrewNotes] = useState(
    'Excavated loose debris, applied hot tack coat, laid 80mm asphalt mix, compacted with 3-ton roller. Barricades placed until curing completes at 18:00.'
  );
  const [repairPhotoUrl, setRepairPhotoUrl] = useState<string>('/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeTask = complaints.find(c => c.id === selectedTaskId) || complaints[0];

  const filteredTasks = complaints.filter(task => {
    if (taskFilter === 'High' && task.severity !== 'High' && task.severity !== 'Critical') return false;
    if (taskFilter === 'Pending' && task.status !== 'Evidence Submitted') return false;
    if (taskFilter === 'In Progress' && task.status !== 'In Progress') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return task.id.toLowerCase().includes(q) || task.title.toLowerCase().includes(q) || task.locationName.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRepairPhotoUrl(URL.createObjectURL(file));
      showToast('Field photo captured with simulated hardware EXIF timestamp', 'info');
    }
  };

  const handleSubmitEvidence = async () => {
    setSubmitting(true);
    try {
      await complaintService.submitEvidence(activeTask.id, {
        afterPhotoUrl: repairPhotoUrl,
        afterCoordinates: {
          lat: activeTask.coordinates.lat,
          lng: activeTask.coordinates.lng,
          offsetDistanceMeters: 11
        },
        sealId,
        materialUsed: workType,
        crewName: 'Squad #14 (Bravo Maintenance)'
      }, crewNotes);

      await refreshComplaints();
      showToast(`Repair evidence for #${activeTask.id} logged to EvidenceGuard! Ready for engineer audit.`, 'success');
      onNavigateToEvidenceGuard(activeTask.id);
    } catch (err) {
      console.error(err);
      showToast('Error saving repair evidence', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb & Header matching Image 17 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Field Operations</span>
              <span>›</span>
              <span>Maintenance Crew Workspace</span>
              <span>›</span>
              <span className="font-semibold text-slate-800">Task Board</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              Maintenance Team Tasks
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Assigned field tickets, on-site inspection logging, and tamper-proof photographic repair evidence upload.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md text-xs font-semibold text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Crew Squad #14 (Bravo)</span>
              <span className="text-amber-700 font-normal">· BBMP East Div · Active Shift</span>
            </div>
            <button
              onClick={() => showToast('All offline task dockets synchronized with ward database', 'success')}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
              Sync Offline Tasks (All synced)
            </button>
          </div>
        </div>

        {/* 4 Task KPIs matching Image 17 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b-2 sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Assigned Today</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">6 Tasks</span>
            </div>
            <span className="text-[11px] text-red-600 font-medium">▲ 3 high priority road hazards</span>
          </div>

          <div className="border-b-2 sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">In Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">2 Tasks</span>
            </div>
            <span className="text-[11px] text-slate-500">Under active patch & compaction</span>
          </div>

          <div className="border-r border-slate-100 pr-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Awaiting Proof</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">1 Task</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Work done, needs post-repair photo</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Verified & Cleared</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-display tabular-nums">18 Tasks</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">7-day turnaround SLA: 98.4%</span>
          </div>
        </div>

        {/* 2-Column Split: Task Queue (5 cols), Active Work Docket (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Tasks List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search & Tabs */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, road, ward..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
              />

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
                {(['All', 'High', 'Pending', 'In Progress'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTaskFilter(tab)}
                    className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      taskFilter === tab
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'All' ? 'All (6)' : tab === 'High' ? 'High Urgency (3)' : tab === 'Pending' ? 'Pending Photo (1)' : 'In Progress (2)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks Cards */}
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const isSelected = activeTask?.id === task.id;
                const isCritical = task.severity === 'Critical' || task.severity === 'High';
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all shadow-sm ${
                      isSelected
                        ? 'border-[#0D9488] ring-1 ring-[#0D9488] bg-teal-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-slate-800">#{task.id}</span>
                      {isCritical && (
                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                          ● High Hazard (4h 15m SLA)
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{task.locationName}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        ● {task.status}
                      </span>
                      <span className="text-xs font-semibold text-[#0D9488] flex items-center gap-0.5">
                        {isSelected ? 'Active Docket →' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Route Optimization Box matching Image 17 bottom */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-teal-400" />
                <div>
                  <h4 className="font-bold text-xs">Route Optimization Ready</h4>
                  <p className="text-[11px] text-slate-400">Saves 24 mins between Domlur and Indiranagar tasks.</p>
                </div>
              </div>
              <button
                onClick={() => showToast('Optimized GIS route loaded to crew GPS terminal', 'success')}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded cursor-pointer"
              >
                Apply
              </button>
            </div>

          </div>

          {/* Right Column: Active Work Docket & Proof Upload (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                  #{activeTask.id} ACTIVE WORK DOCKET
                </span>
                <h2 className="text-lg font-bold text-slate-900 font-display mt-1">
                  {activeTask.title}
                </h2>
                <p className="text-xs text-slate-500">{activeTask.locationName}</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
                ● Repaired (Photo Required)
              </span>
            </div>

            {/* Lifecycle Progress nodes */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="text-emerald-700 font-semibold">
                <div className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] mb-1">✓</div>
                Assigned
              </div>
              <div className="text-emerald-700 font-semibold">
                <div className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] mb-1">✓</div>
                En Route
              </div>
              <div className="text-emerald-700 font-semibold">
                <div className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] mb-1">✓</div>
                In Progress
              </div>
              <div className="text-[#0D9488] font-bold">
                <div className="w-5 h-5 mx-auto rounded-full bg-[#0D9488] text-white flex items-center justify-center text-[10px] mb-1">📷</div>
                Upload Photo
              </div>
              <div className="text-slate-400">
                <div className="w-5 h-5 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] mb-1">5</div>
                QC Inspection
              </div>
            </div>

            {/* Reported Issue Dossier */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase text-[11px]">REPORTED ISSUE DOSSIER</span>
                <span className="font-mono text-[11px] text-slate-500">GPS: 12.9716° N, 77.5946° E</span>
              </div>
              <div className="flex gap-4 items-start">
                <img
                  src={activeTask.evidence.beforePhotoUrl}
                  alt="Citizen report"
                  className="w-28 h-20 object-cover rounded border border-slate-200 shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="text-slate-800 italic leading-relaxed">
                    "{activeTask.description}"
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-teal-700 pt-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    EvidenceGuard Integrity Verified • Logged 08:32 AM
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1 of 2: Field Work Record & Material Telemetry */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#0D9488]" />
                  Field Work Record & Material Telemetry
                </h3>
                <span className="text-slate-500 font-mono text-[11px]">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Work Type Executed</label>
                  <input
                    type="text"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Asphalt Batch / Seal ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sealId}
                      onChange={(e) => setSealId(e.target.value)}
                      className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900"
                    />
                    <QrCode className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs">Inspector / Crew Lead Operational Notes</label>
                <textarea
                  rows={3}
                  value={crewNotes}
                  onChange={(e) => setCrewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span>Crew Members On-Site: <strong>R. Kulkarni (Lead), S. Kumar, P. Anthony</strong></span>
                <button 
                  onClick={() => showToast('Simulated crew member badge scanned via RFID', 'info')}
                  className="text-teal-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add Crew Tag
                </button>
              </div>
            </div>

            {/* Step 2 of 2: Post-Repair Photographic Evidence */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#0D9488]" />
                  Post-Repair Photographic Evidence
                </h3>
                <span className="text-slate-500 font-mono text-[11px]">Step 2 of 2</span>
              </div>
              <p className="text-xs text-slate-500">Mandatory tamper-proof proof required prior to closing maintenance cycle.</p>

              {/* Upload or Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative h-44 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={repairPhotoUrl}
                    alt="Work Done Proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Ready for Verification
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                      <span>EXIF Geotag: Verified</span>
                      <span className="text-emerald-700">11m match</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Today 16:12 IST</span>

                    <div className="mt-2 text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 truncate">
                      SHA-256: #a8f9c298fe04b86214...
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      Metadata match confirmed: Camera bearing 142° SE aligns with citizen photo reference angle. Anti-spoofing check cleared.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <label className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      Re-take Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitEvidence}
                  className="w-full sm:flex-1 py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {submitting ? 'Signing Evidence...' : 'Submit Repair Evidence & Mark Completed'}
                </button>

                <button
                  type="button"
                  onClick={() => showToast('Draft field inspection notes saved locally', 'info')}
                  className="w-full sm:w-auto px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded transition-colors cursor-pointer"
                >
                  Save Draft Notes
                </button>

                <button
                  type="button"
                  onClick={() => showToast('Escalation ticket sent to Structural Engineering Division', 'error')}
                  className="w-full sm:w-auto px-3 py-3 text-red-600 hover:text-red-700 text-xs font-semibold cursor-pointer"
                >
                  Escalate
                </button>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded text-xs text-teal-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <span>
                  Upon submission, this evidence is cryptographically signed, logged to <strong>EvidenceGuard</strong>, and immediately transmitted to the ward engineer and citizen for final public sign-off.
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
