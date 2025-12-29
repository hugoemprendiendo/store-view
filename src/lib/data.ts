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
  orderBy,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import type { Branch, Incident, IncidentCategory, IncidentPriority, IncidentSettings, IncidentStatus } from './types';
import { getInitialBranches, getInitialIncidents, defaultCategories, defaultPriorities, defaultStatuses } from './seed-data';


export async function seedDatabase(firestore: Firestore) {
  // Seed Incident Categories
  const categoriesCollection = collection(firestore, 'incident_categories');
  const categoriesSnapshot = await getDocs(categoriesCollection);
  if (categoriesSnapshot.empty) {
    console.log('Seeding incident categories...');
    const batch = writeBatch(firestore);
    defaultCategories.forEach((categoryName) => {
      const docRef = doc(categoriesCollection);
      batch.set(docRef, { name: categoryName });
    });
    await batch.commit();
  }

  // Seed Incident Priorities
  const prioritiesCollection = collection(firestore, 'incident_priorities');
  const prioritiesSnapshot = await getDocs(prioritiesCollection);
  if (prioritiesSnapshot.empty) {
    console.log('Seeding incident priorities...');
    const batch = writeBatch(firestore);
    defaultPriorities.forEach((priority) => {
        const docRef = doc(prioritiesCollection);
        batch.set(docRef, priority);
    });
    await batch.commit();
  }
  
  // Seed Incident Statuses
  const statusesCollection = collection(firestore, 'incident_statuses');
  const statusesSnapshot = await getDocs(statusesCollection);
  if (statusesSnapshot.empty) {
    console.log('Seeding incident statuses...');
    const batch = writeBatch(firestore);
    defaultStatuses.forEach((statusName) => {
        const docRef = doc(statusesCollection);
        batch.set(docRef, { name: statusName });
    });
    await batch.commit();
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
  if (!ids || ids.length === 0) return [];

  // Firestore 'in' queries are limited to 30 values.
  // We chunk the IDs to handle more than 30.
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) {
    chunks.push(ids.slice(i, i + 30));
  }

  const branchPromises = chunks.map(chunk => {
    const q = query(collection(firestore, 'branches'), where('__name__', 'in', chunk));
    return getDocs(q);
  });

  const querySnapshots = await Promise.all(branchPromises);
  
  const branches = querySnapshots.flatMap(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch))
  );

  return branches;
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
  if (!branchIds || branchIds.length === 0) {
    return [];
  }
  // Firestore 'in' queries are limited to 30 values.
  // We must chunk the branchIds array to handle cases where a user is assigned to more than 30 branches.
  const chunks: string[][] = [];
  for (let i = 0; i < branchIds.length; i += 30) {
      chunks.push(branchIds.slice(i, i + 30));
  }

  const incidentPromises = chunks.map(chunk => {
      const incidentsRef = collection(firestore, 'incidents');
      // Create a query for incidents where branchId is in the current chunk of branch IDs.
      const q = query(incidentsRef, where('branchId', 'in', chunk));
      return getDocs(q);
  });

  // Wait for all the parallel queries to complete.
  const querySnapshots = await Promise.all(incidentPromises);
  
  // Flatten the results from all the queries into a single array of incidents.
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

// --- New Incident Settings Functions ---

export async function getIncidentCategories(firestore: Firestore): Promise<IncidentCategory[]> {
    const categoriesCol = collection(firestore, 'incident_categories');
    const q = query(categoriesCol, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidentCategory));
}

export async function addIncidentCategory(firestore: Firestore, name: string): Promise<IncidentCategory> {
    const categoriesCol = collection(firestore, 'incident_categories');
    const docRef = await addDoc(categoriesCol, { name });
    return { id: docRef.id, name };
}

export async function deleteIncidentCategory(firestore: Firestore, id: string): Promise<void> {
    const categoryRef = doc(firestore, 'incident_categories', id);
    await deleteDoc(categoryRef);
}


export async function getIncidentPriorities(firestore: Firestore): Promise<IncidentPriority[]> {
    const prioritiesCol = collection(firestore, 'incident_priorities');
    const q = query(prioritiesCol, orderBy('level'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidentPriority));
}

export async function getIncidentStatuses(firestore: Firestore): Promise<IncidentStatus[]> {
    const statusesCol = collection(firestore, 'incident_statuses');
    const q = query(statusesCol, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidentStatus));
}

export async function getIncidentSettings(firestore: Firestore): Promise<IncidentSettings> {
    // This function now orchestrates fetching from the three separate collections.
    try {
        const [categories, priorities, statuses] = await Promise.all([
            getIncidentCategories(firestore),
            getIncidentPriorities(firestore),
            getIncidentStatuses(firestore)
        ]);

        // If any of the collections are empty, it might be the first run.
        // The seedDatabase function should handle populating them.
        // For now, we return what we have. If they are empty, the app should handle it gracefully.
        if (categories.length === 0 || priorities.length === 0 || statuses.length === 0) {
            console.log("One or more incident settings collections are empty. Attempting to seed...");
            await seedDatabase(firestore);
            // Re-fetch after seeding
            const [seededCategories, seededPriorities, seededStatuses] = await Promise.all([
                getIncidentCategories(firestore),
                getIncidentPriorities(firestore),
                getIncidentStatuses(firestore)
            ]);
             return {
                categories: seededCategories,
                priorities: seededPriorities,
                statuses: seededStatuses,
            };
        }

        return { categories, priorities, statuses };
    } catch (error) {
        console.error("Error fetching incident settings from collections:", error);
        // In case of an error, we can return an empty or default structure
        return {
            categories: [],
            priorities: [],
            statuses: [],
        };
    }
}
