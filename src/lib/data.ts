'use client';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  Firestore,
  setDoc,
} from 'firebase/firestore';
import type { Branch, Incident, IncidentSettings } from './types';
import { getInitialBranches, getInitialIncidents } from './seed-data';

// Default settings in case the document doesn't exist
const defaultIncidentSettings: IncidentSettings = {
  categories: [
    'Equipo de Cocina',
    'Punto de Venta (POS)',
    'Área de Cliente',
    'Drive-Thru',
    'Seguridad Alimentaria',
    'Empleado',
    'Instalaciones',
    'Otro',
  ],
  priorities: ['Low', 'Medium', 'High'],
  statuses: ['Abierto', 'En Progreso', 'Resuelto'],
};

// This is a one-time setup to seed the database if it's empty.
// In a real application, this would be handled by a proper migration or setup script.
export async function seedDatabase(firestore: Firestore) {
  // Seed Incident Settings
  const settingsRef = doc(firestore, 'app_settings', 'incident_config');
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    console.log('Seeding incident settings...');
    await setDoc(settingsRef, defaultIncidentSettings);
  }

  // Seed Branches
  const branchesCollection = collection(firestore, 'branches');
  const branchesSnapshot = await getDocs(branchesCollection);
  let createdBranches: Branch[] = [];
  if (branchesSnapshot.empty) {
    console.log('Branches collection is empty. Seeding initial data...');
    const batch = writeBatch(firestore);
    const branchesToSeed = getInitialBranches();
    branchesToSeed.forEach((branch) => {
      const docRef = doc(branchesCollection);
      batch.set(docRef, branch);
      createdBranches.push({ id: docRef.id, ...branch });
    });
    await batch.commit();
    console.log('Branch seeding complete.');
  } else {
    createdBranches = branchesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Branch));
  }
  
  // Seed Incidents
  const incidentsCollection = collection(firestore, 'incidents');
  const incidentsSnapshot = await getDocs(incidentsCollection);
  if (incidentsSnapshot.empty && createdBranches.length > 0) {
    console.log('Incidents collection is empty. Seeding initial data...');
    const batch = writeBatch(firestore);
    const initialIncidents = getInitialIncidents(createdBranches);
    initialIncidents.forEach(incident => {
      const docRef = doc(incidentsCollection);
      batch.set(docRef, { ...incident, createdAt: new Date().toISOString() });
    });
    await batch.commit();
    console.log('Incident seeding complete.');
  }
}

export async function getBranches(firestore: Firestore): Promise<Branch[]> {
    const branchesCol = collection(firestore, 'branches');
    const branchSnapshot = await getDocs(branchesCol);
    const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    return branchList;
}

export async function getBranchesByIds(firestore: Firestore, ids: string[]): Promise<Branch[]> {
  if (ids.length === 0) return [];
  const branchPromises = ids.map(id => getDoc(doc(firestore, 'branches', id)));
  const branchSnapshots = await Promise.all(branchPromises);
  return branchSnapshots
      .filter(snap => snap.exists())
      .map(snap => ({ id: snap.id, ...snap.data() } as Branch));
}

export async function getBranchById(firestore: Firestore, id: string): Promise<Branch | undefined> {
    const branchRef = doc(firestore, 'branches', id);
    const branchSnap = await getDoc(branchRef);
    if (branchSnap.exists()) {
        return { id: branchSnap.id, ...branchSnap.data() } as Branch;
    }
    return undefined;
}

export async function getIncidents(firestore: Firestore): Promise<Incident[]> {
    const incidentsCol = collection(firestore, 'incidents');
    const incidentSnapshot = await getDocs(incidentsCol);
    return incidentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
}

export async function getIncidentsForUser(firestore: Firestore, branchIds: string[]): Promise<Incident[]> {
    if (branchIds.length === 0) {
        return [];
    }

    // Firestore 'in' queries are limited to 30 items. Chunk the branchIds array.
    const chunks: string[][] = [];
    for (let i = 0; i < branchIds.length; i += 30) {
        chunks.push(branchIds.slice(i, i + 30));
    }
    
    const incidentPromises = chunks.map(chunk => {
      const q = query(collection(firestore, 'incidents'), where('branchId', 'in', chunk));
      return getDocs(q);
    });

    const querySnapshots = await Promise.all(incidentPromises);
    
    // Flatten the results from all snapshots into a single array
    const allIncidents = querySnapshots.flatMap(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident))
    );

    return allIncidents;
}

export async function getIncidentById(firestore: Firestore, id: string): Promise<Incident | undefined> {
    const incidentRef = doc(firestore, 'incidents', id);
    const incidentSnap = await getDoc(incidentRef);
    if (incidentSnap.exists()) {
        return { id: incidentSnap.id, ...incidentSnap.data() } as Incident;
    }
    return undefined;
}

export async function getIncidentsByBranch(firestore: Firestore, branchId: string): Promise<Incident[]> {
    const incidentsCol = collection(firestore, 'incidents');
    const q = query(incidentsCol, where("branchId", "==", branchId));
    const incidentSnapshot = await getDocs(q);
    return incidentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
}

export async function getIncidentSettings(firestore: Firestore): Promise<IncidentSettings> {
    const settingsRef = doc(firestore, 'app_settings', 'incident_config');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
        return settingsSnap.data() as IncidentSettings;
    }
    
    // If it doesn't exist, create it with default values and return them.
    console.log("Incident settings not found, creating with default values...");
    await setDoc(settingsRef, defaultIncidentSettings);
    return defaultIncidentSettings;
}
