import { INITIAL_COMPLAINTS, DEMO_STATISTICS } from '../data/demoData';
import { Complaint, ComplaintStatus, CitizenFeedbackData, EvidenceRecord, DashboardMetrics } from '../types';

const STORAGE_KEY = 'roadwatch_complaints_v1';

function getStoredComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return INITIAL_COMPLAINTS;
}

function saveComplaints(complaints: Complaint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch {
    // ignore
  }
}

export const complaintService = {
  async getComplaints(filter?: {
    category?: string;
    status?: string;
    ward?: string;
    search?: string;
  }): Promise<Complaint[]> {
    let list = getStoredComplaints();

    if (filter) {
      if (filter.category && filter.category !== 'All') {
        list = list.filter(c => c.category.toLowerCase() === filter.category?.toLowerCase());
      }
      if (filter.status && filter.status !== 'All') {
        list = list.filter(c => c.status.toLowerCase() === filter.status?.toLowerCase());
      }
      if (filter.ward && filter.ward !== 'All Wards' && !filter.ward.includes('All')) {
        list = list.filter(c => c.ward.toLowerCase().includes(filter.ward?.toLowerCase() || ''));
      }
      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(c => 
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.locationName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
    }

    return list;
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    const list = getStoredComplaints();
    const cleanId = id.trim().toUpperCase();
    const found = list.find(c => c.id.toUpperCase() === cleanId);
    return found || null;
  },

  async createComplaint(payload: Omit<Complaint, 'id' | 'reportedAt' | 'updatedAt' | 'status' | 'endorsementsCount' | 'commentsCount'>): Promise<Complaint> {
    const list = getStoredComplaints();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `RW-2025-${randomNum}`;
    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newComplaint: Complaint = {
      ...payload,
      id: newId,
      status: 'Submitted',
      reportedAt: now,
      updatedAt: now,
      estimatedResolution: 'Triage in Progress (Within standard 48-hour civic SLA)',
      endorsementsCount: 1,
      commentsCount: 0,
      comments: [
        {
          id: `cmt-${Date.now()}`,
          author: payload.citizenName || 'Citizen Reporter',
          role: 'Complainant',
          text: payload.description,
          timestamp: now,
          isVerifiedResident: true
        }
      ]
    };

    const updated = [newComplaint, ...list];
    saveComplaints(updated);
    return newComplaint;
  },

  async updateStatus(id: string, status: ComplaintStatus, note?: string): Promise<Complaint | null> {
    const list = getStoredComplaints();

const index = list.findIndex(
  c => c.id.toUpperCase() === id.trim().toUpperCase()
);
    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const updatedComments = current.comments ? [...current.comments] : [];
    if (note) {
      updatedComments.push({
        id: `sys-${Date.now()}`,
        author: 'Ward Operations Desk',
        role: 'Official Memo',
        text: note,
        timestamp: now
      });
    }

    const updatedRecord: Complaint = {
      ...current,
      status,
      updatedAt: now,
      workNotes: note || current.workNotes,
      comments: updatedComments
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async assignCrew(id: string, crew: NonNullable<Complaint['assignedCrew']>): Promise<Complaint | null> {
    const list = getStoredComplaints();
    
const index = list.findIndex(
  c => c.id.toUpperCase() === id.trim().toUpperCase()
);

    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const updatedRecord: Complaint = {
      ...current,
      status: 'Assigned',
      assignedCrew: crew,
      updatedAt: now,
      comments: [
        ...(current.comments || []),
        {
          id: `asg-${Date.now()}`,
          author: 'Ward Dispatch System',
          role: 'Work Order',
          text: `Task assigned to ${crew.name} (Foreman: ${crew.leadForeman}). On-site arrival expected within 4 hours.`,
          timestamp: now
        }
      ]
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async submitEvidence(id: string, evidenceData: Partial<EvidenceRecord>, notes?: string): Promise<Complaint | null> {
    const list = getStoredComplaints();
    
const index = list.findIndex(
  c => c.id.toUpperCase() === id.trim().toUpperCase()
);

    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const mergedEvidence: EvidenceRecord = {
      ...current.evidence,
      ...evidenceData,
      afterTimestamp: now,
      verificationChecks: {
        locationMatch: true,
        locationOffsetMeters: evidenceData.afterCoordinates?.offsetDistanceMeters ?? 11,
        timelineElapsedHours: 24,
        timelineMatch: true,
        visualMatch: true,
        integrityAuthentic: true
      }
    };

    const updatedRecord: Complaint = {
      ...current,
      status: 'Evidence Submitted',
      updatedAt: now,
      evidence: mergedEvidence,
      workNotes: notes || current.workNotes,
      comments: [
        ...(current.comments || []),
        {
          id: `ev-${Date.now()}`,
          author: current.assignedCrew?.name || 'Field Crew Squad #14',
          role: 'Field Inspection Log',
          text: notes || 'Repairs executed. Photographic proof submitted with geo-tag lock for ward engineer evaluation.',
          timestamp: now
        }
      ]
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async reviewEvidence(id: string, decision: 'approve' | 'flag' | 'reject', memo: string): Promise<Complaint | null> {
    const statusMap: Record<string, ComplaintStatus> = {
      approve: 'Resolved',
      flag: 'Flagged for Audit',
      reject: 'Reopened'
    };

    const newStatus = statusMap[decision] || 'Resolved';
    return this.updateStatus(id, newStatus, `Official Review (${decision.toUpperCase()}): ${memo}`);
  },

  async submitFeedback(id: string, feedback: CitizenFeedbackData): Promise<Complaint | null> {
    const list = getStoredComplaints();
    
const index = list.findIndex(
  c => c.id.toUpperCase() === id.trim().toUpperCase()
);

    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const isReopenRequested = feedback.resolutionStatus === 'not_repaired';
    const newStatus: ComplaintStatus = isReopenRequested ? 'Reopened' : 'Resolved';

    const updatedRecord: Complaint = {
      ...current,
      status: newStatus,
      updatedAt: now,
      feedback,
      comments: [
        ...(current.comments || []),
        {
          id: `fb-${Date.now()}`,
          author: current.citizenName || 'Resident Reviewer',
          role: 'Citizen Public Verification',
          text: feedback.testimonialText || `Citizen verified resolution. Durability assessment: ${feedback.durability}. Satisfaction: ${feedback.rating}/5.`,
          timestamp: now,
          isVerifiedResident: true
        }
      ]
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async endorseComplaint(id: string): Promise<number> {
    const list = getStoredComplaints();
    
const index = list.findIndex(
  c => c.id.toUpperCase() === id.trim().toUpperCase()
);

    if (index === -1) return 0;

    list[index].endorsementsCount += 1;
    saveComplaints(list);
    return list[index].endorsementsCount;
  },

  async addComment(id: string, text: string, author: string, role: string): Promise<Complaint | null> {
    const list = getStoredComplaints();
    
const index = list.findIndex(
  c => c.id.toUpperCase() === id.trim().toUpperCase()
);

    if (index === -1) return null;

    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const current = list[index];
    const updatedComments = [
      ...(current.comments || []),
      {
        id: `user-c-${Date.now()}`,
        author,
        role,
        text,
        timestamp: now,
        isVerifiedResident: true
      }
    ];

    current.comments = updatedComments;
    current.commentsCount = updatedComments.length;
    list[index] = current;
    saveComplaints(list);
    return current;
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const list = getStoredComplaints();
    const inProgress = list.filter(c => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Evidence Submitted').length;
    const resolved = list.filter(c => c.status === 'Resolved').length;
    const totalReports = DEMO_STATISTICS.totalReports + list.length - INITIAL_COMPLAINTS.length;
    const resolutionRatePercent = totalReports > 0 ? Math.round((resolved / (inProgress + resolved || 1)) * 100) : 89;

    return {
      totalReports,
      inProgress: inProgress || DEMO_STATISTICS.inProgress,
      resolved: resolved || DEMO_STATISTICS.resolved,
      avgResolutionHours: DEMO_STATISTICS.avgResolutionHours,
      activeWardsCount: DEMO_STATISTICS.activeWardsCount,
      resolutionRatePercent: resolutionRatePercent || DEMO_STATISTICS.resolutionRatePercent
    };
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
