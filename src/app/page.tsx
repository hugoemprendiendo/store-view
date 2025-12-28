'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [userBranches, setUserBranches] = useState<Branch[] | null>(null);

  // Fetch branches based on user role
  useEffect(() => {
    if (!firestore || isProfileLoading || !userProfile) return;

    async function fetchUserBranches() {
      if (userProfile.role === 'superadmin') {
        const branchesSnapshot = await getDocs(collection(firestore, 'branches'));
        const branchesData = branchesSnapshot.docs.map(snap => ({ id: snap.id, ...snap.data() } as Branch));
        setUserBranches(branchesData);
      } else if (userProfile.assignedBranches) {
        const branchIds = Object.keys(userProfile.assignedBranches);
        if (branchIds.length > 0) {
          try {
            const branchPromises = branchIds.map(id => getDoc(doc(firestore, 'branches', id)));
            const branchSnapshots = await Promise.all(branchPromises);
            const branchesData = branchSnapshots
              .filter(snap => snap.exists())
              .map(snap => ({ id: snap.id, ...snap.data() } as Branch));
            setUserBranches(branchesData);
          } catch (e) {
            console.error("Error fetching user branches with getDoc: ", e);
            setUserBranches([]);
          }
        } else {
          setUserBranches([]);
        }
      } else {
        setUserBranches([]);
      }
    }

    fetchUserBranches();
  }, [firestore, userProfile, isProfileLoading]);
  
  const branches = userBranches;
  const isLoadingBranches = userBranches === null;

  // Fetch incidents based on user role and loaded branches
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || isLoadingBranches || !branches) return null;

    if (userProfile.role === 'superadmin') {
      return collection(firestore, 'incidents');
    }

    const branchIds = branches.map(b => b.id);
    if (branchIds.length === 1) {
      return query(collection(firestore, 'incidents'), where('branchId', '==', branchIds[0]));
    }
    
    // If user has 0 or >1 branches, we cannot use a single `in` query due to security rules.
    // So we return null and will show 0 incidents on the dashboard in this case to prevent errors.
    return null;
  }, [firestore, userProfile, branches, isLoadingBranches]);

  const { data: incidentsData, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);

  const incidents = incidentsQuery ? incidentsData : [];

  const isLoading = isProfileLoading || isLoadingBranches || (incidentsQuery !== null && isLoadingIncidents);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-6">
        <Header title="Panel de Control" />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header title="Panel de Control" />
      <DashboardClient branches={branches || []} incidents={incidents || []} />
    </div>
  );
}
