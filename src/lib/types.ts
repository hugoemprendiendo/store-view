export type Branch = {
  id: string;
  name: string;
  region: string;
  brand: string;
  imageUrl: string;
  imageHint: string;
  address: string;
};

export type Incident = {
  id: string;
  title: string;
  branchId: string;
  description?: string;
  photoUrl?: string;
  photoHint?: string;
  audioTranscription?: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
};

export const IncidentCategories = ['Plumbing', 'Electrical', 'Security', 'Structural', 'General', 'Other'];
export const IncidentPriorities = ['Low', 'Medium', 'High'] as const;
export const IncidentStatuses = ['Open', 'In Progress', 'Resolved'];

export type IncidentStatus = 'ok' | 'warning' | 'error';
