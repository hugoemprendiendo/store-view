import type { Branch, Incident } from './types';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  return PlaceHolderImages.find((img) => img.id === id);
}

const branches: Branch[] = [
  { id: '1', name: 'Downtown Central', region: 'North', brand: 'Quantum', address: '123 Main St, Metropolis, USA', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
  { id: '2', name: 'Westside Mall', region: 'West', brand: 'Apex', address: '456 Oak Ave, Gotham, USA', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
  { id: '3', name: 'Eastpoint Plaza', region: 'East', brand: 'Quantum', address: '789 Pine Ln, Star City, USA', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
  { id: '4', name: 'Northgate Retail', region: 'North', brand: 'Apex', address: '101 Maple Dr, Central City, USA', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
  { id: '5', name: 'Southbend Center', region: 'South', brand: 'Synergy', address: '212 Birch Rd, Coast City, USA', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
  { id: '6', name: 'The Grove', region: 'West', brand: 'Synergy', address: '333 Elm St, Keystone, USA', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
];

let incidents: Incident[] = [
  { id: '101', title: 'Leaky Faucet in Restroom', branchId: '1', category: 'Plumbing', priority: 'Medium', status: 'Open', createdAt: '2024-05-20T10:00:00Z', description: 'Customer reported a continuously dripping faucet in the men\'s restroom.', photoUrl: getImage('incident-plumbing-1')?.imageUrl, photoHint: getImage('incident-plumbing-1')?.imageHint },
  { id: '102', title: 'Power Outlet Sparking', branchId: '2', category: 'Electrical', priority: 'High', status: 'Open', createdAt: '2024-05-21T14:30:00Z', description: 'The outlet near the main entrance is sparking when plugs are inserted. It has been cordoned off.', photoUrl: getImage('incident-electrical-1')?.imageUrl, photoHint: getImage('incident-electrical-1')?.imageHint },
  { id: '103', title: 'Broken Shelf Bracket', branchId: '1', category: 'Structural', priority: 'Low', status: 'Resolved', createdAt: '2024-05-18T09:00:00Z', description: 'A shelf bracket in aisle 5 was broken. It has been replaced.' },
  { id: '104', title: 'Crack in Front Window', branchId: '3', category: 'Structural', priority: 'High', status: 'In Progress', createdAt: '2024-05-22T11:00:00Z', description: 'A large crack appeared in the main display window. A technician has been called.' },
  { id: '105', title: 'Security Camera Offline', branchId: '4', category: 'Security', priority: 'Medium', status: 'Open', createdAt: '2024-05-22T18:45:00Z', description: 'Camera 3, pointing at the back entrance, is not recording.' },
  { id: '106', title: 'AC Unit Malfunctioning', branchId: '5', category: 'General', priority: 'Medium', status: 'Resolved', createdAt: '2024-05-19T16:20:00Z', description: 'The air conditioning unit was not cooling properly. The filter was cleaned and it is now working.'},
  { id: '107', title: 'Emergency Exit Light Out', branchId: '2', category: 'Electrical', priority: 'Medium', status: 'Open', createdAt: '2024-05-23T08:00:00Z', description: 'The light above the rear emergency exit is burnt out.'}
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
