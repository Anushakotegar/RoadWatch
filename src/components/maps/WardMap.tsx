
import React, { useEffect, useRef, useState } from 'react';
import type { Complaint } from '../../types';

interface WardMapProps {
  complaints?: Complaint[];
  selectedComplaintId?: string | null;
  onSelectComplaint?: (complaint: Complaint) => void;
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if ((window as any).L) {
    return Promise.resolve((window as any).L);
  }

  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const existingLink = document.querySelector(
        'link[data-roadwatch-leaflet]',
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.dataset.roadwatchLeaflet = 'true';
        document.head.appendChild(link);
      }

      let script = document.querySelector<HTMLScriptElement>(
        'script[data-roadwatch-leaflet]',
      );

      if ((window as any).L) {
        resolve((window as any).L);
        return;
      }

      if (!script) {
        script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.dataset.roadwatchLeaflet = 'true';
        document.head.appendChild(script);
      }

      const currentScript = script;

      const onLoad = () => {
        if ((window as any).L) {
          resolve((window as any).L);
        } else {
          reject(new Error('Leaflet loaded, but its map library is unavailable.'));
        }
      };

      const onError = () => {
        reject(new Error('Could not download Leaflet. Check your internet connection.'));
      };

      currentScript.addEventListener('load', onLoad, { once: true });
      currentScript.addEventListener('error', onError, { once: true });

      // Handle a script that finished loading before its listeners were attached.
      if ((window as any).L) {
        resolve((window as any).L);
      }
    }).catch((error) => {
      leafletPromise = null;
      throw error;
    });
  }

  return leafletPromise;
}

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const WardMap: React.FC<WardMapProps> = ({
  complaints = [],
  selectedComplaintId,
  onSelectComplaint,
  onLocationSelect,
  height = '360px',
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const complaintMarkersRef = useRef<any[]>([]);

  const onLocationSelectRef = useRef(onLocationSelect);
  const onSelectComplaintRef = useRef(onSelectComplaint);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
    onSelectComplaintRef.current = onSelectComplaint;
  }, [onLocationSelect, onSelectComplaint]);

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      try {
        const L = await loadLeaflet();

        if (cancelled || !mapContainerRef.current) return;

        leafletRef.current = L;

        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: true,
          scrollWheelZoom: interactive,
          dragging: interactive,
          doubleClickZoom: interactive,
        });

        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
        }).addTo(map);

        if (interactive && onLocationSelectRef.current) {
          map.on('click', (event: any) => {
            const position = {
              lat: event.latlng.lat,
              lng: event.latlng.lng,
            };

            if (!isValidCoordinates(position.lat, position.lng)) return;

            if (!selectedMarkerRef.current) {
              selectedMarkerRef.current = L.marker(position, {
                draggable: true,
                title: 'Selected issue location',
                icon: L.divIcon({
                  className: 'roadwatch-selected-marker',
                  html: '<div style="width:22px;height:22px;border:3px solid white;border-radius:50%;background:#2563eb;box-shadow:0 1px 6px #334155"></div>',
                  iconSize: [22, 22],
                  iconAnchor: [11, 11],
                }),
              }).addTo(map);

              selectedMarkerRef.current.on('dragend', () => {
                const point = selectedMarkerRef.current.getLatLng();

                if (isValidCoordinates(point.lat, point.lng)) {
                  onLocationSelectRef.current?.({
                    lat: point.lat,
                    lng: point.lng,
                  });
                }
              });
            } else {
              selectedMarkerRef.current.setLatLng(position);
              selectedMarkerRef.current.addTo(map);
            }

            onLocationSelectRef.current?.(position);
          });
        }

        if (!cancelled) {
          setMapError('');
          setMapReady(true);
          window.setTimeout(() => map.invalidateSize(), 100);
        }
      } catch (error) {
        console.error('OpenStreetMap initialization failed:', error);

        if (!cancelled) {
          setMapError(
            'The map could not load. Check your internet connection and try refreshing the page.',
          );
        }
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      selectedMarkerRef.current = null;
      complaintMarkersRef.current = [];
      leafletRef.current = null;
    };
    // Initialize the map once; later view changes are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !mapReady) return;
    if (!isValidCoordinates(center[0], center[1])) return;

    map.setView(center, zoom);
  }, [center[0], center[1], zoom, mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (!map || !L || !mapReady) return;

    complaintMarkersRef.current.forEach((marker) => marker.remove());
    complaintMarkersRef.current = [];

    complaints.forEach((item) => {
      const coordinates = item.coordinates;

      if (
        !coordinates ||
        !isValidCoordinates(coordinates.lat, coordinates.lng)
      ) {
        return;
      }

      const isSelected = selectedComplaintId === item.id;
      const isHighPriority =
        item.severity === 'Critical' || item.severity === 'High';
      const isResolved = item.status === 'Resolved';

      const color = isResolved
        ? '#10B981'
        : isHighPriority
          ? '#EF4444'
          : '#F59E0B';

      const marker = L.circleMarker(
        [coordinates.lat, coordinates.lng],
        {
          radius: isSelected ? 13 : 10,
          color: '#FFFFFF',
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
        },
      ).addTo(map);

      const popup = document.createElement('div');
      popup.style.cssText =
        'font-family:Arial,sans-serif;min-width:160px;padding:5px;';

      const title = document.createElement('strong');
      title.textContent = item.title;

      const details = document.createElement('p');
      details.style.cssText = 'margin:6px 0;font-size:12px;';
      details.textContent = `#${item.id} • ${item.ward}`;

      const status = document.createElement('p');
      status.style.cssText = `margin:4px 0;color:${color};font-size:12px;`;
      status.textContent = `${item.status} (${item.severity})`;

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Open Details';
      button.style.cssText =
        'margin-top:8px;background:#0F172A;color:white;border:0;padding:7px 10px;border-radius:5px;cursor:pointer;';

      button.addEventListener('click', () => {
        onSelectComplaintRef.current?.(item);
      });

      popup.append(title, details, status, button);
      marker.bindPopup(popup);

      marker.on('click', () => {
        onSelectComplaintRef.current?.(item);
      });

      complaintMarkersRef.current.push(marker);
    });
  }, [complaints, selectedComplaintId, mapReady]);

  const handleSearch = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      setSearchMessage('Enter a street, landmark, or address.');
      return;
    }

    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (!map || !L || !mapReady) {
      setSearchMessage('The map is not ready yet.');
      return;
    }

    setSearching(true);
    setSearchMessage('');

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        limit: '1',
        countrycodes: 'in',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Address search returned HTTP ${response.status}`);
      }

      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        setSearchMessage(
          'No matching address found. Try a nearby landmark, street name, or locality.',
        );
        return;
      }

      const place = results[0];
      const lat = Number(place.lat);
      const lng = Number(place.lon);

      if (!isValidCoordinates(lat, lng)) {
        setSearchMessage('The search result did not contain valid coordinates.');
        return;
      }

      const position = { lat, lng };

      map.setView([lat, lng], 17);

      if (!selectedMarkerRef.current) {
        selectedMarkerRef.current = L.marker([lat, lng], {
          draggable: true,
          title: 'Selected issue location',
          icon: L.divIcon({
            className: 'roadwatch-selected-marker',
            html: '<div style="width:22px;height:22px;border:3px solid white;border-radius:50%;background:#2563eb;box-shadow:0 1px 6px #334155"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).addTo(map);

        selectedMarkerRef.current.on('dragend', () => {
          const point = selectedMarkerRef.current.getLatLng();

          if (isValidCoordinates(point.lat, point.lng)) {
            onLocationSelectRef.current?.({
              lat: point.lat,
              lng: point.lng,
            });
          }
        });
      } else {
        selectedMarkerRef.current.setLatLng([lat, lng]);
        selectedMarkerRef.current.addTo(map);
      }

      onLocationSelectRef.current?.(position);

      setSearchMessage(
        `Found: ${place.display_name || query}. Check the marker and drag it to the exact issue location if needed.`,
      );
    } catch (error) {
      console.error('OpenStreetMap address search failed:', error);

      setSearchMessage(
        'Address search failed. Check your internet connection and try again.',
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="h-full w-full" />

      {mapError && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/95 p-5">
          <div className="max-w-md text-center text-sm text-red-700">
            {mapError}
          </div>
        </div>
      )}

      {onLocationSelect && !mapError && (
        <>
          <form
            onSubmit={handleSearch}
            className="absolute left-3 right-3 top-3 z-[400] flex gap-2"
          >
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search street, landmark, or address"
              aria-label="Search for an issue location"
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-md outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={searching || !mapReady}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-800 disabled:opacity-60"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          <div className="absolute left-3 right-3 top-[58px] z-[400] rounded-md bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm">
            Search your area, then click the exact issue point on the map.
            You can drag the selected marker to adjust it.
            <p className="mt-1 text-[10px] text-slate-500">
              Search powered by OpenStreetMap Nominatim.
            </p>

            {searchMessage && (
              <p
                role="status"
                aria-live="polite"
                className="mt-1 break-words text-blue-800"
              >
                {searchMessage}
              </p>
            )}
          </div>
        </>
      )}

      {complaints.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            High priority
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Other reports
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        </div>
      )}
    </div>
  );
};
