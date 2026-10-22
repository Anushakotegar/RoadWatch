import { Complaint, UserProfile } from '../types';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user_citizen_1',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@domain.in',
    role: 'citizen',
    ward: 'Ward 150 (Indiranagar)',
    phone: '+91 9845X XXXXX'
  },
  {
    id: 'user_auth_1',
    name: 'Officer S. Nambiar',
    email: 's.nambiar@ward112.gov.in',
    role: 'authority',
    ward: 'Ward 112 (Domlur & Indiranagar)',
    department: 'BBMP Storm Water & Infrastructure Division'
  },
  {
    id: 'user_crew_1',
    name: 'Foreman R. Kulkarni',
    email: 'crew.bravo@roadscorp.org',
    role: 'field_crew',
    ward: 'BBMP East Zone',
    department: 'Squad #14 (Bravo Maintenance)'
  },
  {
    id: 'user_admin_1',
    name: 'Dr. Vikramaditya Rao',
    email: 'admin@roadwatch.demo',
    role: 'admin',
    ward: 'All Metropolitan Zones',
    department: 'Civic Technology Cell'
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'RW-2025-8492',
    title: 'Severe Pothole Cluster on Commuter Lane',
    category: 'Potholes',
    description: 'Deep asphalt depression spanning 1.8 meters across both driving lanes descending towards Intermediate Ring Road junction. Severe hazard for two-wheelers during peak evening traffic.',
    severity: 'High',
    status: 'In Progress',
    ward: 'Ward 150 (Indiranagar)',
    locationName: '14th Main Rd, Indiranagar (Near Domlur Flyover)',
    coordinates: {
      lat: 12.9716,
      lng: 77.5946
    },
    reportedAt: 'May 22, 2025 08:42 AM',
    updatedAt: 'May 24, 2025 04:15 PM',
    estimatedResolution: 'Today by 5:30 PM (Within standard 48-hour civic SLA)',
    citizenName: 'Rahul V.',
    citizenPhoneMasked: '+91 98451 XXXXX',
    assignedCrew: {
      id: 'crew-14-bravo',
      name: 'Squad #14 (Bravo)',
      leadForeman: 'Foreman R. Kulkarni',
      phone: '+91 94481 02931',
      membersCount: 4
    },
    workNotes: 'Repaired 9cm deep pothole cavity using hot bitumen compound. Barricades placed until 5:30 PM for asphalt hardening. Material: Grade 60/70 Bitumen Mix. Compactor: CAT-CB24B.',
    materialDetails: 'Cold-Mix Bitumen Patch & Compaction • Seal ID: #ASPH-W150-84',
    evidence: {
      beforePhotoUrl: '/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg',
      beforeTimestamp: 'May 22, 2025 08:42 AM',
      beforeCoordinates: {
        lat: 12.9716,
        lng: 77.5946,
        address: '14th Main Rd, Indiranagar (Ward 150)'
      },
      afterPhotoUrl: '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg',
      afterTimestamp: 'May 24, 2025 04:15 PM',
      afterCoordinates: {
        lat: 12.9716,
        lng: 77.5946,
        offsetDistanceMeters: 11
      },
      sealId: '#ASPH-W150-84',
      materialUsed: 'Cold-Mix Bitumen Grade 60/70',
      crewName: 'Crew Bravo (BBMP Zone East)',
      sha256Hash: 'a8f9c298fe04b862149b109e25d48721ad2f0c79b98c368d90fa6c32c4ef20b1',
      verificationChecks: {
        locationMatch: true,
        locationOffsetMeters: 11,
        timelineElapsedHours: 48,
        timelineMatch: true,
        visualMatch: true,
        integrityAuthentic: true
      }
    },
    endorsementsCount: 19,
    commentsCount: 6,
    comments: [
      {
        id: 'c1',
        author: 'Officer S. Nambiar (Ward Inspector)',
        role: 'BBMP Storm Water & Infrastructure',
        text: 'Temporary barricades deployed. Work completed on May 24. Curing and perimeter asphalt sealing currently under mandatory 12-hour setting test. Traffic diverted around safety cones.',
        timestamp: 'May 24, 04:20 PM'
      },
      {
        id: 'c2',
        author: 'Kavita Sharma',
        role: 'Verified Resident (Indiranagar)',
        text: 'Work crew was prompt today. Slab fits neatly. Requesting crew to ensure the residual gravel on the shoulder is cleared before morning rush hour so motorbikes do not slip.',
        timestamp: 'May 24, 05:04 PM',
        isVerifiedResident: true
      }
    ],
    aiSuggested: {
      category: 'Potholes',
      severity: 'High',
      confidencePercent: 94,
      rationale: 'Detected road surface depression exceeding 10cm depth across vehicular driving path.'
    }
  },
  {
    id: 'RW-2025-8488',
    title: 'Dangerous Open Manhole on 12th Cross Main Road',
    category: 'Open Manholes',
    description: 'Uncovered storm drain manhole left exposed after recent asphalt scraping. Highly hazardous for two-wheelers and pedestrians during evening darkness.',
    severity: 'Critical',
    status: 'Evidence Submitted',
    ward: 'Ward 112 (Domlur)',
    locationName: '12th Cross Road, Domlur Layout, Bengaluru East',
    coordinates: {
      lat: 12.9610,
      lng: 77.6387
    },
    reportedAt: 'Feb 26, 2025 08:39 AM',
    updatedAt: 'Feb 28, 2025 04:12 PM',
    estimatedResolution: 'Completed • Pending Ward Engineer Sign-off',
    citizenName: 'Citizen Rahul V.',
    citizenPhoneMasked: '+91 97402 XXXXX',
    assignedCrew: {
      id: 'crew-14-bravo',
      name: 'Crew Squad #14 (Bravo)',
      leadForeman: 'Suresh Murugan',
      phone: '+91 94481 02931',
      membersCount: 3
    },
    workNotes: 'Heavy-duty reinforced precast concrete slab installed. Precast reinforced slab seated. Heavy tar sealant applied. Curing stage in effect.',
    materialDetails: 'Precast SFRC 400kN Manhole Cover & Heavy Sealant',
    evidence: {
      beforePhotoUrl: '/src/assets/images/open_manhole_hazard_1792346312725.jpg',
      beforeTimestamp: 'Feb 26, 2025 08:39 AM',
      beforeCoordinates: {
        lat: 12.9610,
        lng: 77.6387,
        address: '12th Cross & 4th Main Junction, Domlur'
      },
      afterPhotoUrl: '/src/assets/images/municipal_crew_working_1792346313563.jpg',
      afterTimestamp: 'Feb 28, 2025 04:12 PM',
      afterCoordinates: {
        lat: 12.9610,
        lng: 77.6387,
        offsetDistanceMeters: 8
      },
      sealId: '#MNHL-DOM-112',
      materialUsed: 'Reinforced Precast Concrete Grade M40',
      crewName: 'Squad #14 (Bravo)',
      sha256Hash: '4f9a0c69d273e8bb122fa45e317094d2e742816912ffb8a741e05d2127fa2f33',
      verificationChecks: {
        locationMatch: true,
        locationOffsetMeters: 8,
        timelineElapsedHours: 48,
        timelineMatch: true,
        visualMatch: true,
        integrityAuthentic: true
      }
    },
    endorsementsCount: 42,
    commentsCount: 6,
    comments: [
      {
        id: 'c10',
        author: 'BBMP Storm Water Drainage Div',
        role: 'Officer S. Nambiar (Ward Inspector)',
        text: 'Temporary barricades deployed. Heavy-duty reinforced precast concrete slab installed. Curing and perimeter asphalt sealing currently under mandatory 12-hour setting test.',
        timestamp: 'Feb 28, 04:20 PM'
      },
      {
        id: 'c11',
        author: 'Kavita Sharma (Resident, Domlur 12th Cross)',
        role: 'Verified Resident',
        text: 'Work crew was prompt today. Slab fits neatly. Requesting crew to ensure the residual gravel on the shoulder is cleared before morning rush hour so motorbikes do not slip.',
        timestamp: 'Feb 28, 05:04 PM',
        isVerifiedResident: true
      }
    ],
    aiSuggested: {
      category: 'Open Manholes',
      severity: 'Critical',
      confidencePercent: 96,
      rationale: 'Missing cover detected over storm channel directly on traffic lane.'
    }
  },
  {
    id: 'RW-2025-8310',
    title: 'Non-Functional Streetlight Grid along 1st Stage Park',
    category: 'Streetlights',
    description: 'Four consecutive sodium vapor lamp poles dark for 3 nights, causing pedestrian safety issues on walker stretch and evening commuter sidewalk.',
    severity: 'Medium',
    status: 'Resolved',
    ward: 'Ward 150 (Indiranagar)',
    locationName: 'Indiranagar 100ft Road, Ward 150',
    coordinates: {
      lat: 12.9784,
      lng: 77.6408
    },
    reportedAt: 'Feb 20, 2025 07:15 PM',
    updatedAt: 'Feb 21, 2025 02:30 PM',
    estimatedResolution: 'Resolved in 19.2 hrs',
    citizenName: 'Deepak Rao',
    citizenPhoneMasked: '+91 99014 XXXXX',
    assignedCrew: {
      id: 'crew-elec-2',
      name: 'BESCOM / BBMP Electrical Unit 4',
      leadForeman: 'M. Venkat',
      phone: '+91 94488 44102',
      membersCount: 2
    },
    workNotes: 'Replaced burnt line fuse and upgraded 4 sodium vapor fixtures to 80W energy-efficient LED luminaires. Phase balance confirmed.',
    materialDetails: '80W IP66 LED Luminaire x 4, 32A MCB Switch',
    evidence: {
      beforePhotoUrl: '/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg',
      beforeTimestamp: 'Feb 20, 2025 07:15 PM',
      beforeCoordinates: {
        lat: 12.9784,
        lng: 77.6408,
        address: '100ft Road, Indiranagar 1st Stage'
      },
      afterPhotoUrl: '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg',
      afterTimestamp: 'Feb 21, 2025 02:30 PM',
      afterCoordinates: {
        lat: 12.9784,
        lng: 77.6408,
        offsetDistanceMeters: 4
      },
      sealId: '#ELEC-IND-8310',
      materialUsed: 'Havells 80W LED Streetlight Fixture',
      crewName: 'BESCOM Electrical Unit 4',
      sha256Hash: '9b34c89e21df9041284a1e9411bc4409e51142abec8942b012487e4129bc3112',
      verificationChecks: {
        locationMatch: true,
        locationOffsetMeters: 4,
        timelineElapsedHours: 19,
        timelineMatch: true,
        visualMatch: true,
        integrityAuthentic: true
      }
    },
    feedback: {
      resolutionStatus: 'fully_repaired',
      rating: 5,
      durability: 'Flawless Grade',
      turnaroundSla: 'Ahead of Schedule (<30h)',
      smsClarity: 'Clear & Informative',
      testimonialText: 'Excellent fast work by the electrical unit! The entire park stretch is well-lit and safe for evening walking again.',
      publishPublicly: true,
      nominateCrew: true,
      submittedAt: 'Feb 21, 2025 05:00 PM'
    },
    endorsementsCount: 88,
    commentsCount: 12
  },
  {
    id: 'RW-2025-8475',
    title: 'Streetlight Fault & Exposed Wiring at Corner',
    category: 'Streetlights',
    description: 'Junction box cover unlatched with hanging wires close to school bus pickup point. Requires immediate insulation and weatherproofing.',
    severity: 'High',
    status: 'In Progress',
    ward: 'Ward 42 (Kothrud Link)',
    locationName: 'Kothrud Link Rd, Ward 42',
    coordinates: {
      lat: 12.9740,
      lng: 77.6320
    },
    reportedAt: 'May 23, 2025 09:10 AM',
    updatedAt: 'May 24, 2025 11:30 AM',
    estimatedResolution: 'Dispatched • In Progress',
    citizenName: 'Sneha Patel',
    citizenPhoneMasked: '+91 98860 XXXXX',
    assignedCrew: {
      id: 'crew-elec-1',
      name: 'Electrical Quick Response Unit',
      leadForeman: 'T. Gowda',
      phone: '+91 94480 11928',
      membersCount: 2
    },
    workNotes: 'Crew dispatched to secure casing and replace damaged terminal strip.',
    evidence: {
      beforePhotoUrl: '/src/assets/images/open_manhole_hazard_1792346312725.jpg',
      beforeTimestamp: 'May 23, 2025 09:10 AM',
      beforeCoordinates: {
        lat: 12.9740,
        lng: 77.6320,
        address: 'Kothrud Link Rd, Ward 42'
      }
    },
    endorsementsCount: 15,
    commentsCount: 3
  },
  {
    id: 'RW-2025-8461',
    title: 'Blocked Culvert & Heavy Runoff Backflow',
    category: 'Drainage',
    description: 'Silt and construction debris clogging roadside culvert, causing 4 inches of stagnant water runoff over sidewalk during light showers.',
    severity: 'High',
    status: 'Resolved',
    ward: 'Ward 89 (Bazaar Main)',
    locationName: 'Bazaar Main Rd, Ward 89',
    coordinates: {
      lat: 12.9680,
      lng: 77.6150
    },
    reportedAt: 'May 21, 2025 11:00 AM',
    updatedAt: 'May 23, 2025 01:20 PM',
    estimatedResolution: 'Resolved in 26.3 hrs',
    citizenName: 'K. Parthasarathy',
    assignedCrew: {
      id: 'crew-san-b',
      name: 'Sanitation Response B',
      leadForeman: 'Anand Kumar',
      phone: '+91 94482 77109',
      membersCount: 5
    },
    workNotes: 'Culvert desilted using high-pressure suction jetting unit. Silt removed to dump yard.',
    evidence: {
      beforePhotoUrl: '/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg',
      beforeTimestamp: 'May 21, 2025 11:00 AM',
      beforeCoordinates: {
        lat: 12.9680,
        lng: 77.6150,
        address: 'Bazaar Main Rd, Ward 89'
      },
      afterPhotoUrl: '/src/assets/images/road_repair_completed_bitumen_1792346312012.jpg',
      afterTimestamp: 'May 23, 2025 01:20 PM',
      afterCoordinates: {
        lat: 12.9680,
        lng: 77.6150,
        offsetDistanceMeters: 5
      },
      sealId: '#SAN-W89-461',
      crewName: 'Sanitation Response B',
      sha256Hash: '5e3a8901bcae41299dfa1209e51142abec8942b012487e4129bc311289124a91',
      verificationChecks: {
        locationMatch: true,
        locationOffsetMeters: 5,
        timelineElapsedHours: 26,
        timelineMatch: true,
        visualMatch: true,
        integrityAuthentic: true
      }
    },
    endorsementsCount: 31,
    commentsCount: 5
  },
  {
    id: 'RW-2025-8501',
    title: 'Sunken Utility Trench Leveling',
    category: 'Potholes',
    description: 'Uneven cross-road trench left after optic fiber cable laying. Sharp 7cm drops jarring vehicle suspensions on bus route.',
    severity: 'Medium',
    status: 'In Progress',
    ward: 'Ward 114 (HAL 2nd Stage)',
    locationName: '100ft Road, HAL 2nd Stage, Ward 114',
    coordinates: {
      lat: 12.9650,
      lng: 77.6490
    },
    reportedAt: 'May 24, 2025 08:00 AM',
    updatedAt: 'May 24, 2025 01:00 PM',
    estimatedResolution: 'Scheduled for Tomorrow 07:00 AM',
    citizenName: 'Vikas Sen',
    assignedCrew: {
      id: 'crew-14-bravo',
      name: 'Crew Squad #14 (Bravo)',
      leadForeman: 'R. Kulkarni',
      phone: '+91 94481 02931',
      membersCount: 4
    },
    workNotes: 'Subgrade compacted. Awaiting hot-mix delivery from batching plant for morning run.',
    evidence: {
      beforePhotoUrl: '/src/assets/images/pothole_hazard_indiranagar_1792346312091.jpg',
      beforeTimestamp: 'May 24, 2025 08:00 AM',
      beforeCoordinates: {
        lat: 12.9650,
        lng: 77.6490,
        address: '100ft Road, HAL 2nd Stage'
      }
    },
    endorsementsCount: 14,
    commentsCount: 2
  }
];

export const CIVIC_CATEGORIES = [
  {
    name: 'Potholes' as const,
    subtitle: 'Road degradation & surface peel',
    count: 482,
    icon: 'Hammer'
  },
  {
    name: 'Streetlights' as const,
    subtitle: 'Flickering or unlit lamps',
    count: 314,
    icon: 'Lightbulb'
  },
  {
    name: 'Drainage' as const,
    subtitle: 'Blocked culverts & runoff',
    count: 265,
    icon: 'Waves'
  },
  {
    name: 'Open Manholes' as const,
    subtitle: 'Missing lids & chamber hazards',
    count: 142,
    icon: 'AlertOctagon'
  },
  {
    name: 'Debris & Floods' as const,
    subtitle: 'Fallen branches & pooling',
    count: 225,
    icon: 'AlertTriangle'
  }
];

export const DEMO_STATISTICS = {
  totalReports: 1428,
  inProgress: 412,
  resolved: 984,
  avgResolutionHours: 36.4,
  activeWardsCount: 12,
  resolutionRatePercent: 89
};
