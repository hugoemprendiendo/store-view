import type { Branch, Incident } from './types';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  return PlaceHolderImages.find((img) => img.id === id);
}

const branches: Branch[] = [
  { id: '1', name: 'KFC Xalapa 1', region: 'Xalapa', brand: 'KFC', address: '123 Colonel St, Metropolis, USA', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
  { id: '3', name: 'KFC Xalapa 2', region: 'Xalapa', brand: 'KFC', address: '789 Zinger Ln, Star City, USA', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
  { id: '5', name: 'KFC Xalapa 3', region: 'Xalapa', brand: 'KFC', address: '212 Bucket Rd, Coast City, USA', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
  { id: '7', name: 'KFC Xalapa 4', region: 'Xalapa', brand: 'KFC', address: '456 Gravy Ave, Gotham, USA', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
  { id: '8', name: 'Dairy Queen Villa Magna', region: 'San Luis', brand: 'DQ', address: 'Av. Hernán Cortes, San Luis, SLP', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
  { id: '9', name: 'Dairy Queen Aconcagua', region: 'San Luis', brand: 'DQ', address: 'Aconcagua, San Luis, SLP', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
  { id: '10', name: 'Dairy Queen Chapultepec', region: 'San Luis', brand: 'DQ', address: 'Chapultepec, San Luis, SLP', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
  { id: '11', name: 'Dairy Queen - Centro', region: 'San Luis', brand: 'DQ', address: 'Av Himno Nacional, San Luis, SLP', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
  { id: '12', name: 'Dairy Queen Sendero', region: 'San Luis', brand: 'DQ', address: 'Av Industrias, San Luis, SLP', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
];

let incidents: Incident[] = [
  { id: '101', title: 'Freidora #2 no calienta', branchId: '1', category: 'Equipo de Cocina', priority: 'Medium', status: 'Abierto', createdAt: '2024-05-20T10:00:00Z', description: 'La freidora principal no alcanza la temperatura requerida, lo que ralentiza el servicio.', photoUrl: getImage('incident-plumbing-1')?.imageUrl, photoHint: getImage('incident-plumbing-1')?.imageHint },
  { id: '102', title: 'Pantalla de POS congelada', branchId: '8', category: 'Punto de Venta (POS)', priority: 'High', status: 'Abierto', createdAt: '2024-05-21T14:30:00Z', description: 'El terminal POS del mostrador frontal no responde. El drive-thru no se ve afectado.', photoUrl: getImage('incident-electrical-1')?.imageUrl, photoHint: getImage('incident-electrical-1')?.imageHint },
  { id: '103', title: 'Derrame en el área del comedor', branchId: '1', category: 'Área de Cliente', priority: 'Low', status: 'Resuelto', createdAt: '2024-05-18T09:00:00Z', description: 'Un cliente derramó una bebida cerca de la entrada. El área fue limpiada y se colocó un letrero de "piso mojado".' },
  { id: '104', title: 'Altavoz del drive-thru crepita', branchId: '3', category: 'Drive-Thru', priority: 'High', status: 'En Progreso', createdAt: '2024-05-22T11:00:00Z', description: 'Los clientes se quejan de que el altavoz del drive-thru es ruidoso y crepita. Se ha llamado a un técnico.' },
  { id: '105', title: 'Temperatura del congelador demasiado alta', branchId: '9', category: 'Seguridad Alimentaria', priority: 'Medium', status: 'Abierto', createdAt: '2024-05-22T18:45:00Z', description: 'La temperatura del congelador walk-in marca -5°C en lugar de los -18°C requeridos.' },
  { id: '106', title: 'Baño sin toallas de papel', branchId: '5', category: 'Instalaciones', priority: 'Medium', status: 'Resuelto', createdAt: '2024-05-19T16:20:00Z', description: 'El dispensador del baño de hombres estaba vacío y ha sido rellenado.'},
  { id: '107', title: 'La pantalla de pedidos del drive-thru está en blanco', branchId: '11', category: 'Drive-Thru', priority: 'Medium', status: 'Abierto', createdAt: '2024-05-23T08:00:00Z', description: 'La pantalla de confirmación de pedidos digital en el drive-thru no muestra nada.'}
];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getBranches(): Promise<Branch[]> {
  await delay(100);
  return branches;
}

export async function getBranchById(id: string): Promise<Branch | undefined> {
  await delay(100);
  return branches.find(b => b.id === id);
}

export async function getIncidents(): Promise<Incident[]> {
  await delay(100);
  return incidents;
}

export async function getIncidentById(id: string): Promise<Incident | undefined> {
  await delay(100);
  return incidents.find(i => i.id === id);
}

export async function getIncidentsByBranch(branchId: string): Promise<Incident[]> {
  await delay(100);
  return incidents.filter(i => i.branchId === branchId);
}

export async function createIncident(incidentData: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> {
  await delay(200);
  const newIncident: Incident = {
    ...incidentData,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
  };
  incidents.push(newIncident);
  return newIncident;
}

export async function updateIncidentStatus(id: string, status: Incident['status']): Promise<Incident | undefined> {
  await delay(150);
  const incidentIndex = incidents.findIndex(i => i.id === id);
  if (incidentIndex !== -1) {
    incidents[incidentIndex].status = status;
    return incidents[incidentIndex];
  }
  return undefined;
}
