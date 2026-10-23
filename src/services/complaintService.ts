import {
  INITIAL_COMPLAINTS,
  DEMO_STATISTICS,
} from '../data/demoData';

import type {
  Complaint,
  ComplaintStatus,
  CitizenFeedbackData,
  EvidenceRecord,
  DashboardMetrics,
} from '../types';

const API_BASE_URL = '/api';
const STORAGE_KEY = 'roadwatch_complaints_v1';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  complaints?: T[];
  complaint?: T;
}

function getStoredComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      return JSON.parse(raw) as Complaint[];
    }
  } catch {
    // Ignore invalid local demo data.
  }

  return INITIAL_COMPLAINTS;
}

function saveComplaints(complaints: Complaint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch {
    // Ignore local-storage errors.
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Cannot connect to RoadWatch. Make sure the backend is running.',
    );
  }

  const data = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status}).`,
    );
  }

  if (!data || typeof data !== 'object') {
    throw new Error('The server returned an invalid response.');
  }

  return data as T;
}

function matchesFilter(
  complaint: Complaint,
  filter?: {
    category?: string;
    status?: string;
    ward?: string;
    search?: string;
  },
): boolean {
  if (!filter) return true;

  if (
    filter.category &&
    filter.category !== 'All' &&
    complaint.category.toLowerCase() !== filter.category.toLowerCase()
  ) {
    return false;
  }

  if (
    filter.status &&
    filter.status !== 'All' &&
    complaint.status.toLowerCase() !== filter.status.toLowerCase()
  ) {
    return false;
  }

  if (
    filter.ward &&
    filter.ward !== 'All Wards' &&
    !filter.ward.includes('All') &&
    !complaint.ward.toLowerCase().includes(filter.ward.toLowerCase())
  ) {
    return false;
  }

  const query = filter.search?.trim().toLowerCase();

  if (query) {
    const searchableText = [
      complaint.id,
      complaint.title,
      complaint.description,
      complaint.locationName,
      complaint.category,
      complaint.ward,
    ]
      .join(' ')
      .toLowerCase();

    if (!searchableText.includes(query)) return false;
  }

  return true;
}

function findStoredComplaint(id: string): {
  list: Complaint[];
  index: number;
} {
  const list = getStoredComplaints();
  const cleanId = id.trim().toUpperCase();

  return {
    list,
    index: list.findIndex(
      (complaint) => complaint.id.toUpperCase() === cleanId,
    ),
  };
}

function formatLocalTime(): string {
  return new Date().toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export const complaintService = {
  async getComplaints(filter?: {
    category?: string;
    status?: string;
    ward?: string;
    search?: string;
  }): Promise<Complaint[]> {
    const response = await apiRequest<ApiResponse<Complaint>>(
      '/complaints',
    );

    if (!Array.isArray(response.complaints)) {
      throw new Error(
        'The server returned an unexpected complaints response.',
      );
    }

    return response.complaints.filter((complaint) =>
      matchesFilter(complaint, filter),
    );
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    try {
      const response = await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}`,
      );

      if (!response.complaint) {
        throw new Error('The server returned an invalid complaint response.');
      }

      return response.complaint;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('complaint not found')
      ) {
        return null;
      }

      throw error;
    }
  },

  async createComplaint(
    payload: Omit<
      Complaint,
      | 'id'
      | 'reportedAt'
      | 'updatedAt'
      | 'status'
      | 'endorsementsCount'
      | 'commentsCount'
    >,
  ): Promise<Complaint> {
    const response = await apiRequest<ApiResponse<Complaint>>(
      '/complaints',
      {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          ward: payload.ward,
          locationName: payload.locationName,
          category: payload.category,
          severity: payload.severity,
          coordinates: payload.coordinates,
          citizenPhoneMasked: payload.citizenPhoneMasked,
          evidence: payload.evidence,
        }),
      },
    );

    if (!response.complaint) {
      throw new Error(
        response.message || 'The server did not return the created complaint.',
      );
    }

    return response.complaint;
  },

  async updateStatus(
    id: string,
    status: ComplaintStatus,
    note?: string,
  ): Promise<Complaint | null> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, note }),
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated;
    } catch (error) {
      console.warn('Backend updateStatus failed, falling back to local state:', error);
    }

    const { list, index } = findStoredComplaint(id);
    if (index === -1) return null;

    const current = list[index];
    const now = formatLocalTime();
    const comments = [...(current.comments || [])];

    if (note) {
      comments.push({
        id: `sys-${Date.now()}`,
        author: 'Ward Operations Desk',
        role: 'Official Memo',
        text: note,
        timestamp: now,
      });
    }

    const updatedRecord: Complaint = {
      ...current,
      status,
      updatedAt: now,
      workNotes: note || current.workNotes,
      comments,
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async assignCrew(
    id: string,
    crew: NonNullable<Complaint['assignedCrew']>,
    note?: string,
  ): Promise<Complaint | null> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/crew`,
        {
          method: 'PATCH',
          body: JSON.stringify({ assignedCrew: crew, note }),
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated;
    } catch (error) {
      console.warn('Backend assignCrew failed, falling back to local state:', error);
    }

    const { list, index } = findStoredComplaint(id);
    if (index === -1) return null;

    const current = list[index];
    const now = formatLocalTime();

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
          text: `Task assigned to ${crew.name} (Foreman: ${crew.leadForeman}).`,
          timestamp: now,
        },
      ],
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async submitEvidence(
    id: string,
    evidenceData: Partial<EvidenceRecord>,
    notes?: string,
  ): Promise<Complaint | null> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/evidence`,
        {
          method: 'PATCH',
          body: JSON.stringify({ evidence: evidenceData, note: notes }),
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated;
    } catch (error) {
      console.warn('Backend submitEvidence failed, falling back to local state:', error);
    }

    const { list, index } = findStoredComplaint(id);
    if (index === -1) return null;

    const current = list[index];
    const now = formatLocalTime();

    const mergedEvidence: EvidenceRecord = {
      ...current.evidence,
      ...evidenceData,
      afterTimestamp: now,
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
          author: current.assignedCrew?.name || 'Field Crew',
          role: 'Field Inspection Log',
          text: notes || 'Repair evidence submitted for review.',
          timestamp: now,
        },
      ],
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async reviewEvidence(
    id: string,
    decision: 'approve' | 'flag' | 'reject',
    memo: string,
  ): Promise<Complaint | null> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/evidence-review`,
        {
          method: 'PATCH',
          body: JSON.stringify({ decision, note: memo }),
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated;
    } catch (error) {
      console.warn('Backend reviewEvidence failed, falling back to local state:', error);
    }

    const statusMap: Record<string, ComplaintStatus> = {
      approve: 'Resolved',
      flag: 'Flagged for Audit',
      reject: 'Reopened',
    };

    return this.updateStatus(
      id,
      statusMap[decision],
      `Evidence review (${decision.toUpperCase()}): ${memo}`,
    );
  },

  async submitFeedback(
    id: string,
    feedback: CitizenFeedbackData,
  ): Promise<Complaint | null> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/feedback`,
        {
          method: 'POST',
          body: JSON.stringify(feedback),
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated;
    } catch (error) {
      console.warn('Backend submitFeedback failed, falling back to local state:', error);
    }

    const { list, index } = findStoredComplaint(id);
    if (index === -1) return null;

    const current = list[index];
    const now = formatLocalTime();

    const newStatus: ComplaintStatus =
      feedback.resolutionStatus === 'not_repaired'
        ? 'Reopened'
        : 'Resolved';

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
          role: 'Citizen Feedback',
          text:
            feedback.testimonialText ||
            `Resolution feedback submitted. Durability: ${feedback.durability}. Rating: ${feedback.rating}/5.`,
          timestamp: now,
        },
      ],
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async endorseComplaint(id: string): Promise<number> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/endorse`,
        {
          method: 'POST',
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated.endorsementsCount;
    } catch (error) {
      console.warn('Backend endorseComplaint failed, falling back to local state:', error);
    }

    const { list, index } = findStoredComplaint(id);
    if (index === -1) return 0;

    list[index].endorsementsCount += 1;
    saveComplaints(list);
    return list[index].endorsementsCount;
  },

  async addComment(
    id: string,
    text: string,
    author: string,
    role: string,
  ): Promise<Complaint | null> {
    try {
      await apiRequest<ApiResponse<Complaint>>(
        `/complaints/${encodeURIComponent(id.trim())}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        },
      );
      const updated = await this.getComplaintById(id);
      if (updated) return updated;
    } catch (error) {
      console.warn('Backend addComment failed, falling back to local state:', error);
    }

    const { list, index } = findStoredComplaint(id);
    if (index === -1) return null;

    const current = list[index];
    const now = formatLocalTime();

    const comments = [
      ...(current.comments || []),
      {
        id: `user-c-${Date.now()}`,
        author,
        role,
        text,
        timestamp: now,
      },
    ];

    const updatedRecord: Complaint = {
      ...current,
      comments,
      commentsCount: comments.length,
    };

    list[index] = updatedRecord;
    saveComplaints(list);
    return updatedRecord;
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const list = await this.getComplaints();

    const inProgress = list.filter(
      (complaint) =>
        complaint.status === 'In Progress' ||
        complaint.status === 'Assigned' ||
        complaint.status === 'Evidence Submitted',
    ).length;

    const resolved = list.filter(
      (complaint) => complaint.status === 'Resolved',
    ).length;

    return {
      totalReports: list.length,
      inProgress,
      resolved,
      avgResolutionHours: DEMO_STATISTICS.avgResolutionHours,
      activeWardsCount: DEMO_STATISTICS.activeWardsCount,
      resolutionRatePercent:
        inProgress + resolved > 0
          ? Math.round((resolved / (inProgress + resolved)) * 100)
          : 0,
    };
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
