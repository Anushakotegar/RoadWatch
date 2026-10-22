import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintCategory, ComplaintStatus, SeverityLevel } from '../types';
import { complaintService } from '../services/complaintService';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  MapPin, 
  Check, 
  X, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AuthorityWorkspaceProps {
  onNavigateToEvidenceGuard: (complaintId: string) => void;
  onNavigateToFeedback: (complaintId: string) => void;
}

export const AuthorityWorkspace: React.FC<AuthorityWorkspaceProps> = ({
  onNavigateToEvidenceGuard,
  onNavigateToFeedback
}) => {
  const { complaints, refreshComplaints, showToast } = useApp();
  
  const [selectedWard, setSelectedWard] = useState<string>('Ward 112 (Indiranagar)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('RW-2025-8488');
  const [selectedRows, setSelectedRows] = useState<string[]>(['RW-2025-8488']);

  const activeCase = complaints.find(c => c.id === selectedCaseId) || complaints[0];

  const filteredQueue = complaints.filter(item => {
    if (filterCategory !== 'All' && item.category !== filterCategory) return false;
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleQuickApprove = async () => {
    if (!activeCase) return;
    await complaintService.updateStatus(activeCase.id, 'Resolved', 'Approved directly by Ward Authority Engineer.');
    await refreshComplaints();
    showToast(`Complaint #${activeCase.id} marked Resolved by Municipal Authority!`, 'success');
  };

  const handleAssignRapidTeam = async () => {
    if (!activeCase) return;
    await complaintService.assignCrew(activeCase.id, {
      id: 'crew-rapid-3',
      name: 'Rapid Response Team 3',
      leadForeman: 'Suresh Murugan',
      phone: '+91 94481 02931',
      membersCount: 4
    });
    await refreshComplaints();
    showToast(`Rapid Response Team 3 assigned to #${activeCase.id}`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header matching Stitch Image 11 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 font-display">
              Authority Workspace
            </h1>
            <div className="relative">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-white border border-slate-300 rounded px-3 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0D9488]"
              >
                <option value="Ward 112 (Indiranagar)">Ward 112 (Indiranagar)</option>
                <option value="Ward 150 (Domlur)">Ward 150 (Domlur)</option>
                <option value="Ward 42 (Kothrud Link)">Ward 42 (Kothrud Link)</option>
                <option value="All Wards">All Ward Divisions</option>
              </select>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3 self-start sm:self-auto">
            <span>Ward 42 Telemetry: <strong>94.2% SLA Compliance</strong></span>
          </div>
        </div>

        {/* Search, Filter & Export Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docket (e.g. RW-2025)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">✕</button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Potholes">Potholes</option>
              <option value="Open Manholes">Open Manholes</option>
              <option value="Streetlights">Streetlights</option>
              <option value="Drainage">Drainage</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Evidence Submitted">Evidence Submitted</option>
              <option value="Resolved">Resolved</option>
            </select>

            <button
              onClick={() => showToast('Simulated CSV export downloaded for municipal auditing', 'info')}
              className="px-3.5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* 2-Column Workspace: Left Table Queue (7 cols), Right Detail Drawer (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Complaints Queue Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Complaints Queue <span className="text-slate-500 font-normal">({filteredQueue.length} active)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Filter and select complaints to batch-assign repair teams or review geocoded citizen reports.</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Severity SLA</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 w-8">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows(filteredQueue.map(q => q.id));
                          else setSelectedRows([]);
                        }}
                        checked={selectedRows.length === filteredQueue.length && filteredQueue.length > 0}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="p-3">ID</th>
                    <th className="p-3">Issue & Location</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Crew</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map(item => {
                    const isSelected = activeCase?.id === item.id;
                    const isChecked = selectedRows.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedCaseId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/40 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRow(item.id)}
                            className="rounded border-slate-300 text-[#0D9488]"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">{item.id.replace('RW-2025-', 'RW-')}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.locationName}</div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            item.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                            item.severity === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          {item.assignedCrew?.name || 'Unassigned'}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'In Progress' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredQueue.length} cases</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="px-2 py-0.5 bg-slate-900 text-white rounded">1</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">2</span>
              </div>
            </div>
          </div>

          {/* Right Case Inspection Detail Drawer (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            {activeCase ? (
              <>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {activeCase.id}
                      </span>
                      <span className="text-xs text-slate-500">· {activeCase.ward}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Full forensic citizen report with geocoded coordinates & field controls.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    activeCase.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {activeCase.severity}
                  </span>
                </div>

                {/* Photo Preview */}
                <div className="relative h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={activeCase.evidence.beforePhotoUrl}
                    alt="Active case view"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    📍 {activeCase.coordinates.lat}° N, {activeCase.coordinates.lng}° E
                  </div>
                  <div className="absolute bottom-2 right-2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-semibold">
                    Original Intake
                  </div>
                </div>

                {/* Citizen Report text */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 uppercase">CITIZEN REPORT</span>
                    <span className="font-mono">{activeCase.reportedAt}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {activeCase.description}
                  </p>
                </div>

                {/* Field Crew status */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                      R3
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        {activeCase.assignedCrew?.name || 'Rapid Response Team 3'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {activeCase.assignedCrew?.leadForeman || 'Suresh Murugan'} ({activeCase.assignedCrew?.phone || '+91 94481 02931'})
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    On Site
                  </span>
                </div>

                {/* Action Controls */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => onNavigateToEvidenceGuard(activeCase.id)}
                    className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Review in EvidenceGuard™
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleQuickApprove}
                      className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Resolve
                    </button>
                    <button
                      onClick={handleAssignRapidTeam}
                      className="py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign Team 3
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center py-12">Select a complaint from the queue.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
