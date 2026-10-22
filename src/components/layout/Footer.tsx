import React from 'react';

export const Footer: React.FC<{ onNavigateToNotice?: () => void }> = ({ onNavigateToNotice }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Brand */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
          <span className="font-display font-semibold text-slate-800 text-sm">RoadWatch India</span>
          <span className="text-slate-400">·</span>
          <span className="text-[11px] text-slate-500">Civic Infrastructure System</span>
        </div>

        {/* Center Notice */}
        <div className="text-center text-[11px] text-slate-500 max-w-xl">
          © 2024–2026 RoadWatch Civic Technologies. Independent Student Demonstration Prototype. Not affiliated with BBMP, municipal corporations, or government bodies.
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-4 text-xs">
          <button 
            onClick={onNavigateToNotice}
            className="hover:text-slate-800 transition-colors cursor-pointer underline text-[11px]"
          >
            Data Integrity & Simulation Notice
          </button>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-600">Citizen Charter (RTI 4(1)(b) Model)</span>
        </div>

      </div>
    </footer>
  );
};
