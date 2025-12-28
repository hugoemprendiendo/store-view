import type { Branch, Incident } from './types';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  return PlaceHolderImages.find((img) => img.id === id);
}

const branches: Branch[] = [
  { id: '1', name: 'KFC - Metropolis Central', region: 'North', brand: 'KFC', address: '123 Colonel St, Metropolis, USA', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
  { id: '2', name: 'DQ - Gotham West', region: 'West', brand: 'DQ', address: '456 Blizzard Ave, Gotham, USA', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
  { id: '3', name: 'KFC - Star City East', region: 'East', brand: 'KFC', address: '789 Zinger Ln, Star City, USA', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
  { id: '4', name: 'DQ - Central City North', region: 'North', brand: 'DQ', address: '101 Grill Dr, Central City, USA', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
  { id: '5', name: 'KFC - Coast City South', region: 'South', brand: 'KFC', address: '212 Bucket Rd, Coast City, USA', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
  { id: '6', name: 'DQ - Keystone West', region: 'West', brand: 'DQ', address: '333 Treat St, Keystone, USA', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
];

let incidents: Incident[] = [
  { id: '101', title: 'Fryer #2 not heating', branchId: '1', category: 'Kitchen Equipment', priority: 'Medium', status: 'Open', createdAt: '2024-05-20T10:00:00Z', description: 'The main fryer is failing to reach the required temperature, slowing down service.', photoUrl: getImage('incident-plumbing-1')?.imageUrl, photoHint: getImage('incident-plumbing-1')?.imageHint },
  { id: '102', title: 'POS screen frozen', branchId: '2', category: 'Point of Sale (POS)', priority: 'High', status: 'Open', createdAt: '2024-05-21T14:30:00Z', description: 'The front counter POS terminal is completely unresponsive. Drive-thru is unaffected.', photoUrl: getImage('incident-electrical-1')?.imageUrl, photoHint: getImage('incident-electrical-1')?.imageHint },
  { id: '103', title: 'Spill in dining area', branchId: '1', category: 'Customer Area', priority: 'Low', status: 'Resolved', createdAt: '2024-05-18T09:00:00Z', description: 'A customer spilled a drink near the entrance. The area was cleaned and a "wet floor" sign was placed.' },
  { id: '104', title: 'Drive-thru speaker crackling', branchId: '3', category: 'Drive-Thru', priority: 'High', status: 'In Progress', createdAt: '2024-05-22T11:00:00Z', description: 'Customers are complaining that the drive-thru speaker is loud and crackling. A technician has been called.' },
  { id: '105', title: 'Freezer temperature too high', branchId: '4', category: 'Food Safety', priority: 'Medium', status: 'Open', createdAt: '2024-05-22T18:45:00Z', description: 'The walk-in freezer temperature is reading -5°C instead of the required -18°C.' },
  { id: '106', title: 'Bathroom out of paper towels', branchId: '5', category: 'Facilities', priority: 'Medium', status: 'Resolved', createdAt: '2024-05-19T16:20:00Z', description: 'The mens restroom dispenser was empty and has been refilled.'},
  { id: '107', title: 'Drive-thru order screen is blank', branchId: '2', category: 'Drive-Thru', priority: 'Medium', status: 'Open', createdAt: '2024-05-23T08:00:00Z', description: 'The digital order confirmation screen in the drive-thru is not displaying anything.'}
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
