
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { aiService, type IssueAnalysis } from '../services/aiService';
import { ComplaintCategory, SeverityLevel } from '../types';
import {
  Camera,
  MapPin,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Info,
  LoaderCircle,
  AlertTriangle,
} from 'lucide-react';
import { WardMap } from '../components/maps/WardMap';
import { getDemoWardForCoordinates } from '../data/jurisdictions';

interface ReportIssueProps {
  onSuccess: (newId: string) => void;
  onCancel: () => void;
}

const API_BASE_URL = '/api';
const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_MAP_ZOOM = 5;
const MAX_ACCEPTABLE_GPS_ACCURACY_METRES = 1000;

const categories: ComplaintCategory[] = [
  'Potholes',
  'Streetlights',
  'Drainage',
  'Open Manholes',
  'Water Leaks',
  'Debris & Floods',
];

const severities: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

interface ReverseGeocodeResult {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    residential?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    ward?: string;
  };
}

export const ReportIssue: React.FC<ReportIssueProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { currentUser, showToast, refreshComplaints } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<ComplaintCategory>('Potholes');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [ward, setWard] = useState('Not verified');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [addressLookupError, setAddressLookupError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const addressLookupSequence = useRef(0);
  const lastAddressLookupTime = useRef(0);

  const jurisdictionSuggestion =
    lat !== null && lng !== null
      ? getDemoWardForCoordinates(lat, lng, category)
      : null;

  useEffect(() => {
    return () => {
      if (photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  // Automatically suggest a synthetic ward and department for supported
  // Bengaluru demo coordinates. Never present this as official jurisdiction.
  useEffect(() => {
    if (jurisdictionSuggestion) {
      setWard(
        `${jurisdictionSuggestion.ward.name} — ${jurisdictionSuggestion.ward.zone}`,
      );
    } else {
      setWard('Not verified');
    }
  }, [lat, lng, category]);

  const lookupAddress = async (
    latitude: number,
    longitude: number,
  ): Promise<void> => {
    const requestId = ++addressLookupSequence.current;

    setAddressLookupLoading(true);
    setAddressLookupError('');

    try {
      const elapsed = Date.now() - lastAddressLookupTime.current;
      const waitTime = Math.max(0, 1100 - elapsed);

      if (waitTime > 0) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, waitTime);
        });
      }

      if (requestId !== addressLookupSequence.current) return;

      lastAddressLookupTime.current = Date.now();

      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        'accept-language': 'en',
        lat: String(latitude),
        lon: String(longitude),
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'Address lookup is temporarily rate-limited. Please try again later.'
            : 'The address service could not find your location.',
        );
      }

      const result = (await response.json()) as ReverseGeocodeResult;

      if (requestId !== addressLookupSequence.current) return;

      const address = result.address;
      const addressParts = address
        ? [
            [address.house_number, address.road].filter(Boolean).join(' '),
            address.pedestrian,
            address.footway,
            address.neighbourhood,
            address.residential,
            address.suburb,
            address.quarter,
            address.city_district,
            address.city || address.town || address.village,
            address.county,
            address.state,
            address.postcode,
            address.country,
          ].filter(Boolean)
        : [];

      const readableAddress =
        [...new Set(addressParts)].join(', ') ||
        result.display_name ||
        '';

      if (!readableAddress) {
        throw new Error('No readable address was returned for this point.');
      }

      setLocationName(readableAddress.slice(0, 200));
      setAddressLookupError('');

      showToast(
        'Address found. Check that it matches the actual issue location.',
        'success',
      );
    } catch (error) {
      if (requestId !== addressLookupSequence.current) return;

      const message =
        error instanceof Error
          ? error.message
          : 'Could not look up this address.';

      setAddressLookupError(message);
      showToast(`${message} You can enter the address manually.`, 'error');
    } finally {
      if (requestId === addressLookupSequence.current) {
        setAddressLookupLoading(false);
      }
    }
  };

  const handlePhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Choose a JPEG, PNG, or WebP image.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('The image must be smaller than 5 MB.', 'error');
      return;
    }

    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setAnalysisError('');
    setAnalyzing(true);

    try {
      const result = await aiService.analyzeIssue(file, description);
      setAnalysis(result);
      setCategory(result.suggestedCategory);
      setSeverity(result.suggestedSeverity);

      if (!description.trim() && result.suggestedDescription) {
        setDescription(result.suggestedDescription);
      }

      showToast(
        'Image analysis completed. Please review the suggestions.',
        'success',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not analyze this image.';

      setAnalysisError(message);
      showToast(message, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(
        'This browser does not support location access. Select a point on the map instead.',
        'error',
      );
      return;
    }

    showToast('Requesting your device location…', 'info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setGpsAccuracy(accuracy);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          !Number.isFinite(accuracy) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          showToast(
            'The browser returned invalid location data. Select the location manually on the map.',
            'error',
          );
          return;
        }

        if (accuracy > MAX_ACCEPTABLE_GPS_ACCURACY_METRES) {
          setLat(null);
          setLng(null);
          setLocationName('');
          setWard('Not verified');
          setAddressLookupError(
            `The device location is too imprecise (${Math.round(accuracy)} metres accuracy). Select the actual issue location on the map.`,
          );

          showToast(
            'Location accuracy is too low. Select the actual issue location on the map.',
            'error',
          );
          return;
        }

        setLat(latitude);
        setLng(longitude);
        setLocationName('');
        void lookupAddress(latitude, longitude);

        showToast(
          `Location received. Reported accuracy: approximately ${Math.round(accuracy)} metres. Check the map and address.`,
          'info',
        );
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Select a point on the map instead.'
            : error.code === error.TIMEOUT
              ? 'Location request timed out. Please try again or select a point on the map.'
              : 'Unable to get your location. Select a point on the map instead.';

        showToast(message, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  };

  const handleMapLocationSelect = ({
    lat: selectedLat,
    lng: selectedLng,
  }: {
    lat: number;
    lng: number;
  }) => {
    if (
      !Number.isFinite(selectedLat) ||
      !Number.isFinite(selectedLng) ||
      selectedLat < -90 ||
      selectedLat > 90 ||
      selectedLng < -180 ||
      selectedLng > 180
    ) {
      showToast('The selected map coordinates are invalid.', 'error');
      return;
    }

    setLat(selectedLat);
    setLng(selectedLng);
    setGpsAccuracy(null);
    setLocationName('');
    void lookupAddress(selectedLat, selectedLng);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      showToast('Please sign in before submitting a report.', 'error');
      return;
    }

    if (!photoFile || !photoUrl) {
      showToast('Please upload a photo of the issue.', 'error');
      setCurrentStep(1);
      return;
    }

    if (!description.trim()) {
      showToast('Please describe the issue.', 'error');
      setCurrentStep(1);
      return;
    }

    if (!locationName.trim()) {
      showToast('Enter a street address or landmark.', 'error');
      setCurrentStep(2);
      return;
    }

    if (!ward.trim()) {
      showToast(
        'Enter the ward or jurisdiction, or write "Not verified".',
        'error',
      );
      setCurrentStep(2);
      return;
    }

    if (lat === null || lng === null) {
      showToast(
        'Select the actual issue location on the map or use an accurate current location.',
        'error',
      );
      setCurrentStep(2);
      return;
    }

    if (addressLookupLoading) {
      showToast('Please wait for the address lookup to finish.', 'info');
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Could not read the selected image.'));
        };

        reader.onerror = () =>
          reject(new Error('Could not read the selected image.'));

        reader.readAsDataURL(photoFile);
      });

      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${category} report`,
          category,
          description: description.trim(),
          severity,
          ward: ward.trim(),
          locationName: locationName.trim(),
          coordinates: { lat, lng },
          jurisdictionSuggestion: jurisdictionSuggestion
            ? {
                wardId: jurisdictionSuggestion.ward.id,
                wardName: jurisdictionSuggestion.ward.name,
                city: jurisdictionSuggestion.ward.city,
                zone: jurisdictionSuggestion.ward.zone,
                jurisdictionId: jurisdictionSuggestion.jurisdiction.id,
                department: jurisdictionSuggestion.jurisdiction.department,
                isDemo: true,
                verificationLabel:
                  'Estimated demo jurisdiction — not officially verified',
              }
            : {
                isDemo: true,
                verificationLabel:
                  'No demo jurisdiction match — not officially verified',
              },
          evidence: {
            beforePhotoUrl: imageDataUrl,
            beforeTimestamp: new Date().toISOString(),
            beforeCoordinates: {
              lat,
              lng,
              address: locationName.trim(),
            },
          },
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        id?: string;
        complaint?: { id: string };
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || result.message || 'The report could not be saved. Please try again.',
        );
      }

      const returnedId = result.id || result.complaint?.id;

      if (!returnedId) {
        throw new Error('The server did not return a complaint tracking ID.');
      }

      setSubmittedId(returnedId);
      await refreshComplaints();
      showToast(`Report saved. Tracking ID: ${returnedId}`, 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not submit the report.';

      console.error('RoadWatch report submission failed:', error);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Report Submitted</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your report was saved by the RoadWatch backend. This does not mean
            that a municipal authority has been notified or has reviewed it.
          </p>

          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
            <p className="text-xs text-slate-500">Complaint tracking ID</p>
            <p className="font-mono text-lg font-bold text-slate-900 mt-1">
              {submittedId}
            </p>
            <div className="border-t border-slate-200 mt-3 pt-3 text-xs space-y-2">
              <p><strong>Category:</strong> {category}</p>
              <p><strong>Severity:</strong> {severity}</p>
              <p><strong>Location:</strong> {locationName}</p>
              <p><strong>Ward:</strong> {ward}</p>
              {jurisdictionSuggestion && (
                <p>
                  <strong>Suggested department:</strong>{' '}
                  {jurisdictionSuggestion.jurisdiction.department}
                </p>
              )}
              <p className="text-amber-800">
                Estimated demo jurisdiction — not officially verified.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => onSuccess(submittedId)}
              className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs rounded flex items-center justify-center gap-2"
            >
              Track Report <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                addressLookupSequence.current += 1;
                setSubmittedId(null);
                setCurrentStep(1);
                setCategory('Potholes');
                setSeverity('Medium');
                setDescription('');
                setLocationName('');
                setWard('Not verified');
                setLat(null);
                setLng(null);
                setGpsAccuracy(null);
                setAddressLookupError('');
                setAddressLookupLoading(false);
                setPhotoFile(null);
                setPhotoUrl('');
                setAnalysis(null);
                setAnalysisError('');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] =
    lat !== null && lng !== null ? [lat, lng] : DEFAULT_MAP_CENTER;

  const mapZoom = lat !== null && lng !== null ? 15 : DEFAULT_MAP_ZOOM;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {(
            [
              [1, 'Defect Details'],
              [2, 'Location & Ward'],
              [3, 'Review & Submit'],
            ] as const
          ).map(([step, label]) => (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(step)}
              className={`flex items-center gap-2 text-xs font-semibold ${
                currentStep === step ? 'text-[#0D9488]' : 'text-slate-500'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentStep === step
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Step 1: Incident Description & Photo
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload a clear photo. AI suggestions are optional and must
                    be reviewed by you.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Defect Photo (required)
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Selected complaint photo"
                        className="max-h-64 mx-auto rounded object-contain"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-600">
                          Choose a photo of the issue
                        </p>
                        <p className="text-[11px] text-slate-400">
                          JPEG, PNG, or WebP; maximum 5 MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      aria-label="Upload issue photo"
                    />
                  </div>

                  {analyzing && (
                    <p className="mt-2 text-xs text-teal-700 flex items-center gap-2">
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                      Analyzing image with the configured AI service…
                    </p>
                  )}
                  {analysisError && (
                    <p className="mt-2 text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {analysisError} You can still complete the report manually.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Civic Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={`p-3 text-left rounded-lg border text-xs font-medium ${
                          category === item
                            ? 'border-[#0D9488] bg-teal-50 text-[#0F766E] ring-1 ring-[#0D9488]'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Estimated Severity
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {severities.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSeverity(item)}
                        className={`py-2 text-center text-xs font-semibold rounded border ${
                          severity === item
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    AI severity is an estimate from the photo. Choose the level
                    that best reflects the actual danger you observed.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe what you observed, where it is, and any safety concern."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0D9488]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {description.length}/2000 characters
                  </p>
                  {analysis?.suggestedDescription && (
                    <p className="text-[11px] text-slate-500 mt-2">
                      The description may include an AI suggestion. Check it
                      and edit inaccurate details before submitting.
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded flex items-center gap-2"
                  >
                    Next: Location <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Step 2: Incident Location
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select where the issue actually is. The demo jurisdiction
                    suggestion is approximate and is not an official ward lookup.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-xs font-semibold text-[#0D9488] flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Use Current Location
                </button>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Street Address or Landmark
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={200}
                      value={locationName}
                      onChange={(event) => setLocationName(event.target.value)}
                      placeholder="Select a map location or enter the address manually"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>
                  {addressLookupLoading && (
                    <p className="mt-2 text-xs text-teal-700 flex items-center gap-2">
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                      Looking up the selected address…
                    </p>
                  )}
                  {addressLookupError && (
                    <p className="mt-2 text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {addressLookupError} Select the correct point or enter
                      the address manually.
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <p className="text-xs font-bold text-amber-900">
                    Estimated demo jurisdiction — not officially verified
                  </p>
                  {jurisdictionSuggestion ? (
                    <div className="mt-3 space-y-2 text-xs text-amber-950">
                      <p>
                        <strong>Suggested ward:</strong>{' '}
                        {jurisdictionSuggestion.ward.name}
                      </p>
                      <p>
                        <strong>Suggested zone:</strong>{' '}
                        {jurisdictionSuggestion.ward.zone}
                      </p>
                      <p>
                        <strong>Suggested department:</strong>{' '}
                        {jurisdictionSuggestion.jurisdiction.department}
                      </p>
                      <p className="text-[11px]">
                        This suggestion is generated from a broad demo-area
                        heuristic. It does not confirm the actual municipal
                        ward or department responsible for this location.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-900">
                      No demo jurisdiction suggestion is available for these
                      coordinates and category. Select the correct point and
                      enter the ward manually if known.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Ward / Municipal Jurisdiction
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={ward}
                    onChange={(event) => setWard(event.target.value)}
                    placeholder='Enter a ward, or type "Not verified"'
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    You can edit the suggestion. RoadWatch does not verify
                    official ward boundaries.
                  </p>
                </div>

                <div className="p-3 bg-slate-100 rounded border border-slate-200 text-xs">
                  <p className="text-slate-700">
                    <strong>Selected coordinates:</strong>{' '}
                    {lat !== null && lng !== null
                      ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                      : 'No location selected'}
                  </p>
                  {gpsAccuracy !== null && (
                    <p className="text-slate-500 mt-1">
                      Last browser-reported accuracy: approximately{' '}
                      {Math.round(gpsAccuracy)} metres.
                    </p>
                  )}
                  <p className="text-slate-500 mt-1">
                    Use the map controls to zoom and select the actual incident
                    location.
                  </p>
                </div>

                <WardMap
                  center={mapCenter}
                  zoom={mapZoom}
                  height="320px"
                  onLocationSelect={handleMapLocationSelect}
                />

                <p className="text-[11px] text-slate-500">
                  Map and address data: ©{' '}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    OpenStreetMap contributors
                  </a>
                  . Address results may be approximate. Confirm the location.
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded flex items-center gap-1.5"
                  >
                    Review Report <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Step 3: Review & Submit
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Check your details before saving the report.
                  </p>
                </div>

                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Issue photo for review"
                    className="w-full max-h-72 object-contain bg-slate-50 rounded-md border border-slate-200"
                  />
                )}

                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3 text-xs">
                  <p><strong>Category:</strong> {category}</p>
                  <p><strong>Severity:</strong> {severity}</p>
                  <p><strong>Address / landmark:</strong> {locationName || 'Not entered'}</p>
                  <p><strong>Ward:</strong> {ward || 'Not entered'}</p>
                  {jurisdictionSuggestion && (
                    <>
                      <p><strong>Suggested zone:</strong> {jurisdictionSuggestion.ward.zone}</p>
                      <p><strong>Suggested department:</strong> {jurisdictionSuggestion.jurisdiction.department}</p>
                    </>
                  )}
                  <p>
                    <strong>Coordinates:</strong>{' '}
                    {lat !== null && lng !== null
                      ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                      : 'Not selected'}
                  </p>
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 whitespace-pre-wrap">
                      {description || 'Not entered'}
                    </p>
                  </div>
                  <p className="text-amber-800">
                    Estimated demo jurisdiction — not officially verified.
                  </p>
                </div>

                {analysis && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded text-xs text-teal-900">
                    <strong>AI suggestions reviewed:</strong>
                    <p className="mt-1">{analysis.observations.join(' ')}</p>
                    <p className="mt-2">
                      <strong>Suggested next step:</strong>{' '}
                      {analysis.recommendedAction}
                    </p>
                    <p className="mt-2">
                      <strong>Limitations:</strong> {analysis.limitations}
                    </p>
                    <p className="mt-2">
                      These are preliminary suggestions only and do not verify
                      the issue, severity, or safety risk.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Submitting saves your report to the RoadWatch backend. This
                    prototype does not automatically notify a government
                    department or verify the entered ward. Check the address
                    and severity before submitting.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 text-slate-600 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting || analyzing || addressLookupLoading}
                      onClick={handleSubmit}
                      className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-400 text-white font-semibold text-xs rounded flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#0D9488] font-bold text-sm pb-3 border-b border-slate-100">
                <Sparkles className="w-4 h-4" />
                <span>AI Assistant</span>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Upload a supported image to request AI assistance. Suggestions
                are preliminary and can be edited.
              </p>

              {analyzing && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs flex items-center gap-2">
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Analyzing image…
                </div>
              )}

              {analysis && !analyzing && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Preliminary suggestions
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {analysis.suggestedCategory}
                  </p>
                  <p className="text-xs text-slate-700">
                    Suggested severity: <strong>{analysis.suggestedSeverity}</strong>
                  </p>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Observations</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-slate-600">
                      {analysis.observations.map((item, index) => (
                        <li key={`${index}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>Suggested next step:</strong>{' '}
                    {analysis.recommendedAction}
                  </p>
                  <p className="text-[11px] text-amber-800">{analysis.limitations}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(analysis.suggestedCategory);
                      setSeverity(analysis.suggestedSeverity);
                      if (analysis.suggestedDescription) {
                        setDescription(analysis.suggestedDescription);
                      }
                      showToast(
                        'AI suggestions applied. Please verify the details.',
                        'success',
                      );
                    }}
                    className="w-full py-2.5 bg-[#0D9488] text-white text-xs font-semibold rounded"
                  >
                    Apply Suggestions
                  </button>
                </div>
              )}

              {!analysis && !analyzing && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  No image analysis available yet. Upload a photo to begin.
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                AI assistance only · Human review required
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
