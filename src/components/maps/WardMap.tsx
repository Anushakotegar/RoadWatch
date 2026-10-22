import React, { useEffect, useRef } from 'react';
import { Complaint } from '../../types';
import L from 'leaflet';

interface WardMapProps {
  complaints?: Complaint[];
  selectedComplaintId?: string | null;
  onSelectComplaint?: (complaint: Complaint) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

export const WardMap: React.FC<WardMapProps> = ({
  complaints = [],
  selectedComplaintId,
  onSelectComplaint,
  height = '360px',
  center = [12.9716, 77.6200], // Bengaluru default (Indiranagar / Domlur)
  zoom = 13,
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix standard leaflet icon issue
    // @ts-expect-error Leaflet default icon URL workaround
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    complaints.forEach(item => {
      if (!item.coordinates) return;

      const isSelected = selectedComplaintId === item.id;
      const isCritical = item.severity === 'Critical' || item.severity === 'High';
      const isResolved = item.status === 'Resolved';

      const color = isResolved ? '#10B981' : isCritical ? '#EF4444' : '#F59E0B';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            transition: all 0.2s ease;
          ">
            ${isResolved ? '✓' : '!'}
          </div>
        `,
        iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
        iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11]
      });

      const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <div style="font-weight: bold; color: #0F172A; margin-bottom: 2px;">${item.title}</div>
          <div style="color: #64748B; font-size: 11px;">#${item.id} • ${item.ward}</div>
          <div style="margin-top: 4px; display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${color}20; color: ${color};">
            ${item.status} (${item.severity})
          </div>
          <div style="margin-top: 6px;">
            <button id="view-btn-${item.id}" style="background: #0F172A; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">
              Open Details
            </button>
          </div>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-btn-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectComplaint) onSelectComplaint(item);
          };
        }
      });

      marker.on('click', () => {
        if (onSelectComplaint) onSelectComplaint(item);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [complaints, selectedComplaintId, onSelectComplaint]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Ward Overlay Badge */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-md shadow-sm text-xs pointer-events-none">
        <span className="font-semibold text-slate-800">BBMP East Jurisdiction</span>
        <span className="text-slate-500 ml-1.5">· Ward 112 & 150</span>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm text-[11px] flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-slate-600">Hazard / Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-600">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600">Resolved</span>
        </div>
      </div>
    </div>
  );
};
