
/**
 * RoadWatch synthetic ward and jurisdiction data.
 *
 * DEMO ONLY — these are approximate demonstration areas,
 * NOT official ward boundaries or verified department assignments.
 */

export type DemoJurisdiction = {
  id: string;
  name: string;
  department: string;
  categories: string[];
  isDemo: true;
};

export type DemoWard = {
  id: string;
  name: string;
  city: string;
  zone: string;
  jurisdictionId: string;
  isDemo: true;
};

export type DemoJurisdictionSuggestion = {
  ward: DemoWard;
  jurisdiction: DemoJurisdiction;
  label: string;
  isDemo: true;
};

export const DEMO_JURISDICTIONS: DemoJurisdiction[] = [
  {
    id: 'JUR-ROAD-01',
    name: 'Demo Road Maintenance Unit',
    department: 'Roads and Infrastructure (demo)',
    categories: ['Potholes', 'Road Damage'],
    isDemo: true,
  },
  {
    id: 'JUR-LIGHT-01',
    name: 'Demo Streetlight Unit',
    department: 'Streetlight Maintenance (demo)',
    categories: ['Streetlights', 'Exposed Wiring'],
    isDemo: true,
  },
  {
    id: 'JUR-DRAIN-01',
    name: 'Demo Drainage Unit',
    department: 'Drainage and Stormwater (demo)',
    categories: [
      'Drainage',
      'Open Manholes',
      'Debris & Floods',
    ],
    isDemo: true,
  },
  {
    id: 'JUR-WATER-01',
    name: 'Demo Water Maintenance Unit',
    department: 'Water Leak Maintenance (demo)',
    categories: ['Water Leaks'],
    isDemo: true,
  },
];

export const DEMO_WARDS: DemoWard[] = [
  {
    id: 'DEMO-WARD-001',
    name: 'Demo Ward 1',
    city: 'Bengaluru',
    zone: 'Demo Zone East',
    jurisdictionId: 'JUR-ROAD-01',
    isDemo: true,
  },
  {
    id: 'DEMO-WARD-002',
    name: 'Demo Ward 2',
    city: 'Bengaluru',
    zone: 'Demo Zone East',
    jurisdictionId: 'JUR-LIGHT-01',
    isDemo: true,
  },
  {
    id: 'DEMO-WARD-003',
    name: 'Demo Ward 3',
    city: 'Bengaluru',
    zone: 'Demo Zone Central',
    jurisdictionId: 'JUR-DRAIN-01',
    isDemo: true,
  },
  {
    id: 'DEMO-WARD-004',
    name: 'Demo Ward 4',
    city: 'Bengaluru',
    zone: 'Demo Zone Central',
    jurisdictionId: 'JUR-WATER-01',
    isDemo: true,
  },
];

export function getDemoJurisdictionForCategory(
  category: string,
): DemoJurisdiction | undefined {
  const normalizedCategory = category.trim().toLowerCase();

  return DEMO_JURISDICTIONS.find((jurisdiction) =>
    jurisdiction.categories.some(
      (item) => item.toLowerCase() === normalizedCategory,
    ),
  );
}

export function getDemoWardById(
  wardId: string,
): DemoWard | undefined {
  return DEMO_WARDS.find((ward) => ward.id === wardId);
}

/**
 * Assigns a synthetic demo ward only inside a broad
 * Bengaluru demonstration area.
 *
 * This is a simple demonstration heuristic, NOT geospatial
 * boundary matching and NOT an official municipal lookup.
 */
export function getDemoWardForCoordinates(
  latitude: number,
  longitude: number,
  category: string,
): DemoJurisdictionSuggestion | null {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  // Broad Bengaluru demo-area guard; not a city boundary.
  const insideDemoArea =
    latitude >= 12.75 &&
    latitude <= 13.20 &&
    longitude >= 77.35 &&
    longitude <= 77.85;

  if (!insideDemoArea) {
    return null;
  }

  const jurisdiction = getDemoJurisdictionForCategory(category);

  if (!jurisdiction) {
    return null;
  }

  // Synthetic zones for the prototype only.
  // These divisions do not represent actual ward boundaries.
  const zone =
    latitude >= 12.98
      ? 'Demo Zone North'
      : longitude >= 77.60
        ? 'Demo Zone East'
        : 'Demo Zone Central';

  const wardNumber =
    zone === 'Demo Zone North'
      ? 1
      : zone === 'Demo Zone East'
        ? 2
        : 3;

  const ward: DemoWard = {
    id: `DEMO-WARD-${String(wardNumber).padStart(3, '0')}`,
    name: `Demo Ward ${wardNumber}`,
    city: 'Bengaluru',
    zone,
    jurisdictionId: jurisdiction.id,
    isDemo: true,
  };

  return {
    ward,
    jurisdiction,
    label: 'Estimated demo jurisdiction — not officially verified',
    isDemo: true,
  };
}
