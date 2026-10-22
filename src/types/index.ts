export type ComplaintCategory = 
  | 'Potholes' 
  | 'Streetlights' 
  | 'Drainage' 
  | 'Open Manholes' 
  | 'Water Leaks' 
  | 'Debris & Floods';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Evidence Submitted' 
  | 'Authority Review' 
  | 'Resolved' 
  | 'Reopened'
  | 'Flagged for Audit';

export type UserRole = 'citizen' | 'authority' | 'field_crew' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward?: string;
  department?: string;
  phone?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  description: string;
  status: ComplaintStatus;
  badge?: string;
}

export interface EvidenceRecord {
  beforePhotoUrl: string;
  beforeTimestamp: string;
  beforeCoordinates: {
    lat: number;
    lng: number;
    address: string;
  };
  afterPhotoUrl?: string;
  afterTimestamp?: string;
  afterCoordinates?: {
    lat: number;
    lng: number;
    offsetDistanceMeters?: number;
  };
  sealId?: string;
  materialUsed?: string;
  crewName?: string;
  sha256Hash?: string;
  verificationChecks?: {
    locationMatch: boolean;
    locationOffsetMeters: number;
    timelineElapsedHours: number;
    timelineMatch: boolean;
    visualMatch: boolean;
    integrityAuthentic: boolean;
  };
}

export interface CitizenFeedbackData {
  resolutionStatus: 'fully_repaired' | 'partially_repaired' | 'not_repaired';
  rating: number; // 1-5
  durability: 'Needs Rework' | 'Passable' | 'High Standard' | 'Flawless Grade';
  turnaroundSla: 'Behind Schedule' | 'On-Time (Target Met)' | 'Ahead of Schedule (<30h)';
  smsClarity: 'Unclear / Delayed SMS' | 'Clear & Informative' | 'Proactive Updates';
  followUpPhotoUrl?: string;
  testimonialText: string;
  publishPublicly: boolean;
  nominateCrew: boolean;
  submittedAt: string;
}

export interface Complaint {
  id: string; // e.g. RW-2025-8492
  title: string;
  category: ComplaintCategory;
  description: string;
  severity: SeverityLevel;
  status: ComplaintStatus;
  ward: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  reportedAt: string;
  updatedAt: string;
  estimatedResolution?: string;
  citizenName: string;
  citizenPhoneMasked?: string;
  assignedCrew?: {
    id: string;
    name: string;
    leadForeman: string;
    phone: string;
    membersCount: number;
  };
  workNotes?: string;
  materialDetails?: string;
  evidence: EvidenceRecord;
  feedback?: CitizenFeedbackData;
  endorsementsCount: number;
  commentsCount: number;
  comments?: Array<{
    id: string;
    author: string;
    role: string;
    text: string;
    timestamp: string;
    isVerifiedResident?: boolean;
  }>;
  aiSuggested?: {
    category: ComplaintCategory;
    severity: SeverityLevel;
    confidencePercent: number;
    rationale: string;
  };
}

export interface DashboardMetrics {
  totalReports: number;
  inProgress: number;
  resolved: number;
  avgResolutionHours: number;
  activeWardsCount: number;
  resolutionRatePercent: number;
}
