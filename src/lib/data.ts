'use client';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  getFirestore,
} from 'firebase/firestore';
import type { Branch, Incident } from './types';
import { getInitialBranches, getInitialIncidents } from './seed-data';
import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This is a one-time setup to seed the database if it's empty.
// In a real application, this would be handled by a proper migration or setup script.
async function seedDatabase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const firestore = getFirestore(app);
  
  const incidentsCollection = collection(firestore, 'incidents');
  const incidentsSnapshot = await getDocs(incidentsCollection);
  let branchesToSeed = getInitialBranches();
  let createdBranches: Branch[] = [];

  // Check if branches exist, to avoid re-seeding them.
  const branchesCollection = collection(firestore, 'branches');
  const branchesSnapshot = await getDocs(branchesCollection);
  
  if (branchesSnapshot.empty) {
    console.log('Branches collection is empty. Seeding initial data...');
    const batch = writeBatch(firestore);
    branchesToSeed.forEach((branch) => {
      const docRef = doc(branchesCollection);
      batch.set(docRef, branch);
      createdBranches.push({ id: docRef.id, ...branch });
    });
    await batch.commit();
    console.log('Branch seeding complete.');
  } else {
    // If branches already exist, just fetch them to get their IDs for incidents.
    createdBranches = branchesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Branch));
  }
  
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

// Automatically try to seed when this module is loaded.
// This is for demo purposes.
if (typeof window !== 'undefined') {
  seedDatabase();
}


export async function getBranches(firestore: any): Promise<Branch[]> {
    const branchesCol = collection(firestore, 'branches');
    const branchSnapshot = await getDocs(branchesCol);
    const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    return branchList;
}

export async function getBranchesByIds(firestore: any, ids: string[]): Promise<Branch[]> {
  if (ids.length === 0) return [];
  const branchesCol = collection(firestore, 'branches');
  // Firestore 'in' query is limited to 30 elements.
  // For this app, we'll chunk the requests if needed.
  const chunks = [];
  for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
  }

  const branchPromises = chunks.map(chunk => {
      const q = query(branchesCol, where('__name__', 'in', chunk));
      return getDocs(q);
  });
  
  const allSnapshots = await Promise.all(branchPromises);
  const branchList = allSnapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));

  return branchList;
}

export async function getBranchById(firestore: any, id: string): Promise<Branch | undefined> {
    const branchRef = doc(firestore, 'branches', id);
    const branchSnap = await getDoc(branchRef);
    if (branchSnap.exists()) {
        return { id: branchSnap.id, ...branchSnap.data() } as Branch;
    }
    return undefined;
}

export async function getIncidents(firestore: any): Promise<Incident[]> {
    const incidentsCol = collection(firestore, 'incidents');
    const incidentSnapshot = await getDocs(incidentsCol);
    return incidentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
}

export async function getIncidentById(firestore: any, id: string): Promise<Incident | undefined> {
    const incidentRef = doc(firestore, 'incidents', id);
    const incidentSnap = await getDoc(incidentRef);
    if (incidentSnap.exists()) {
        return { id: incidentSnap.id, ...incidentSnap.data() } as Incident;
    }
    return undefined;
}

export async function getIncidentsByBranch(firestore: any, branchId: string): Promise<Incident[]> {
    const incidentsCol = collection(firestore, 'incidents');
    const q = query(incidentsCol, where("branchId", "==", branchId));
    const incidentSnapshot = await getDocs(q);
    return incidentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
}
