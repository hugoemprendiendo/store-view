'use client';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  getFirestore,
} from 'firebase/firestore';
import type { Branch, Incident } from './types';
import { getInitialBranches } from './seed-data';
import { getSdks } from '@/firebase';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This is a one-time setup to seed the database if it's empty.
// In a real application, this would be handled by a proper migration or setup script.
async function seedDatabase() {
  const { firestore } = getSdks(initializeApp(firebaseConfig));
  const branchesCollection = collection(firestore, 'branches');
  const snapshot = await getDocs(branchesCollection);
  if (snapshot.empty) {
    console.log('Database is empty. Seeding initial data...');
    const batch = writeBatch(firestore);
    const initialBranches = getInitialBranches();
    initialBranches.forEach((branch) => {
      const docRef = doc(collection(firestore, 'branches'));
      batch.set(docRef, { ...branch, id: docRef.id });
    });
    await batch.commit();
    console.log('Seeding complete.');
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

export async function createIncident(firestore: any, incidentData: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> {
  const incidentsCol = collection(firestore, 'incidents');
  const newDocRef = await addDoc(incidentsCol, {
    ...incidentData,
    createdAt: new Date().toISOString(),
  });

  const newIncident = await getDoc(newDocRef);
  
  return { id: newDocRef.id, ...newIncident.data() } as Incident;
}

export async function updateIncidentStatus(firestore: any, id: string, status: Incident['status']): Promise<Incident | undefined> {
    const incidentRef = doc(firestore, 'incidents', id);
    await updateDoc(incidentRef, { status });
    const updatedSnap = await getDoc(incidentRef);
    if (updatedSnap.exists()) {
        return { id: updatedSnap.id, ...updatedSnap.data() } as Incident;
    }
    return undefined;
}
