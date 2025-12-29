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
  status: 'Abierto' | 'En Progreso' | 'Resuelto';
  createdAt: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'superadmin';
  createdAt: string;
  assignedBranches?: Record<string, boolean>;
}

export type IncidentCategory = {
  id: string;
  name: string;
}

export type IncidentPriority = {
    id: string;
    name: 'Low' | 'Medium' | 'High';
    level: number;
}

export type IncidentStatus = {
    id: string;
    name: string;
}

export type IncidentSettings = {
  categories: IncidentCategory[];
  priorities: IncidentPriority[];
  statuses: IncidentStatus[];
}

// These are now fallbacks or defaults, the source of truth is in Firestore.
export const IncidentCategories = [
  'Equipo de Cocina',
  'Punto de Venta (POS)',
  'Área de Cliente',
  'Drive-Thru',
  'Seguridad Alimentaria',
  'Empleado',
  'Instalaciones',
  'Otro',
];
export const IncidentPriorities = ['Low', 'Medium', 'High'] as const;
export const IncidentStatuses = ['Abierto', 'En Progreso', 'Resuelto'];

export type IncidentBranchStatus = 'ok' | 'warning' | 'error';
