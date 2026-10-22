import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CIVIC_CATEGORIES, DEMO_STATISTICS } from '../data/demoData';
import { WardMap } from '../components/maps/WardMap';
import { 
  ShieldCheck, 
  Search, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ThumbsUp, 
  Sparkles,
  AlertOctagon,
  Lightbulb,
  Hammer,
  Waves,
  AlertTriangle,
  Users
} from 'lucide-react';

interface PublicPortalProps {
  onNavigate: (tab: string, complaintId?: string) => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onNavigate }) => {
  const { complaints, setSelectedComplaintId } = useApp();
  const [searchId, setSearchId] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSelectedComplaintId(searchId.trim().toUpperCase());
    onNavigate('track-complaint', searchId.trim().toUpperCase());
  };

  const handleRecentClick = (id: string) => {
    setSelectedComplaintId(id);
    onNavigate('track-complaint', id);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              Live Civic Network · Municipal Ward Pilot
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              Faster Civic Repairs, <br className="hidden sm:inline" />
              <span className="text-[#0D9488]">Verified by Citizens.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Report road hazards, track municipal crew resolution in real-time, and authenticate completed infrastructure repairs using photographic evidence.
            </p>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('report-issue')}
                className="px-6 py-3.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Report an Issue
              </button>

              <form onSubmit={handleTrackSubmit} className="flex-1 flex items-center relative">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Search complaint ID (e.g. RW-2025-8492)"
                    className="w-full pl-9 pr-24 py-3 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Active Regions */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="font-semibold text-slate-700">Active Pilots:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Indiranagar (Ward 150)</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Domlur (Ward 112)</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">HAL 2nd Stage</span>
            </div>
          </div>

          {/* Right Live Dispatch Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-56 bg-slate-100">
                <img
                  src="/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg"
                  alt="Live dispatch hazard"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE DISPATCH
                </div>
                <div className="absolute top-3 right-3 bg-emerald-700 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI ASSISTED
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent p-4 text-white">
                  <p className="text-xs text-slate-300 font-medium">Ward 150, Indiranagar · 14th Main Rd</p>
                  <h4 className="font-display font-bold text-base text-white">Severe Pothole Cluster · In Progress</h4>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Curing Phase • Crew Squad #14</span>
                </div>
                <button
                  onClick={() => handleRecentClick('RW-2025-8492')}
                  className="font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer"
                >
                  Inspect Case
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Demo Metrics Row */}
      <section className="border-b border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border-b-2 border-[#0D9488] pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Logged (Demo)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tabular-nums">
                {DEMO_STATISTICS.totalReports.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-emerald-600">+18 today</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across 3 urban zones</p>
          </div>

          <div className="border-b-2 border-teal-500 pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tabular-nums">
                {DEMO_STATISTICS.resolutionRatePercent}%
              </span>
              <span className="text-xs font-medium text-slate-600">Dual-photo audited</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Citizen verified sign-offs</p>
          </div>

          <div className="border-b-2 border-amber-500 pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Turnaround</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tabular-nums">
                {DEMO_STATISTICS.avgResolutionHours}h
              </span>
              <span className="text-xs font-medium text-emerald-600">4.2h faster than SLA</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Report to clearance</p>
          </div>

          <div className="border-b-2 border-slate-700 pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Wards</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tabular-nums">
                {DEMO_STATISTICS.activeWardsCount}
              </span>
              <span className="text-xs font-medium text-slate-600">BBMP East</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Urban pilot wards</p>
          </div>
        </div>
      </section>

      {/* Resolution Process 5-Step Flow */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Accountable Lifecycle</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Civic Resolution Process</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            A straightforward, auditable path from community citizen report to certified municipal field fix.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: '1', title: 'Report', desc: 'Geotagged photo with automatic GPS coordinate lock.', icon: Camera },
            { step: '2', title: 'Classify', desc: 'Simulated AI triage assesses defect depth and urgency.', icon: Sparkles },
            { step: '3', title: 'Route', desc: 'Direct spatial routing to the assigned ward division.', icon: MapPin },
            { step: '4', title: 'Resolve', desc: 'Field crew deploys materials and logs repair proof.', icon: Hammer },
            { step: '5', title: 'Verify', desc: 'Dual-photo audit confirms completion prior to closure.', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative">
                <div className="w-7 h-7 rounded bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 text-[#0D9488]" />
                  <h3 className="font-display font-bold text-slate-900 text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Civic Categories Grid */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Directory</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Supported Civic Categories</h2>
          </div>
          <button
            onClick={() => onNavigate('community-feed')}
            className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer"
          >
            Explore all reports
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CIVIC_CATEGORIES.map(cat => {
            return (
              <button
                key={cat.name}
                onClick={() => onNavigate('community-feed')}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-teal-500 hover:shadow-sm text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded bg-teal-50 text-[#0D9488] flex items-center justify-center mb-3 group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                  {cat.name === 'Potholes' && <Hammer className="w-4 h-4" />}
                  {cat.name === 'Streetlights' && <Lightbulb className="w-4 h-4" />}
                  {cat.name === 'Drainage' && <Waves className="w-4 h-4" />}
                  {cat.name === 'Open Manholes' && <AlertOctagon className="w-4 h-4" />}
                  {cat.name === 'Debris & Floods' && <AlertTriangle className="w-4 h-4" />}
                </div>
                <h4 className="font-display font-bold text-slate-900 text-sm">{cat.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.subtitle}</p>
                <div className="mt-3 text-[11px] font-semibold text-slate-600">
                  {cat.count} reports →
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Reports Showcase */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Pilot Feed</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Recent Infrastructure Reports</h2>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Simulated Real-time Data
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {complaints.slice(0, 3).map(complaint => {
            const isResolved = complaint.status === 'Resolved';
            const isInProgress = complaint.status === 'In Progress';
            return (
              <div 
                key={complaint.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow transition-shadow flex flex-col"
              >
                <div className="relative h-44 bg-slate-100">
                  <img
                    src={complaint.evidence.beforePhotoUrl}
                    alt={complaint.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${
                      isResolved ? 'bg-emerald-600 text-white' : isInProgress ? 'bg-amber-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    {complaint.ward.split('(')[0]}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono text-[11px]">#{complaint.id}</span>
                      <span>{complaint.reportedAt.split('2025')[0] || 'Recently'}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-sm line-clamp-1">{complaint.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{complaint.description}</p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      <span>{complaint.endorsementsCount} endorsements</span>
                    </div>
                    <button
                      onClick={() => handleRecentClick(complaint.id)}
                      className="font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer"
                    >
                      View Report
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ward Activity Map Preview */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Ward Coverage</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore Ward Activity</h2>
              <p className="text-xs text-slate-500 mt-1">Track issues and crew dispatch across municipal zones in real time.</p>
            </div>
            <button
              onClick={() => onNavigate('community-feed')}
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <MapPin className="w-3.5 h-3.5" />
              Open Interactive Ward Map
            </button>
          </div>

          <WardMap 
            complaints={complaints}
            height="320px"
            onSelectComplaint={(c) => handleRecentClick(c.id)}
          />
        </div>
      </section>

      {/* Human-in-the-Loop Verification Notice */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-5 flex items-start gap-3 text-xs text-slate-700">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Human-in-the-Loop Civic Verification Standard</h4>
            <p className="mt-1 leading-relaxed text-slate-600">
              AI models provide triage assistance by analyzing citizen photo uploads to detect road depression depth and categorize defects. However, all repair sign-offs, crew dispatches, and public escrow clearances are authorized by responsible municipal ward engineers and validated by verified on-site residents.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
