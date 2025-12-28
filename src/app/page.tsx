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

  // For superadmin, fetch all branches via useCollection
  const adminBranchesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || userProfile.role !== 'superadmin') return null;
    return collection(firestore, 'branches');
  }, [firestore, userProfile]);
  const { data: adminBranches, isLoading: isLoadingAdminBranches } = useCollection<Branch>(adminBranchesQuery);
  
  // For regular users, fetch assigned branches manually using getDoc
  useEffect(() => {
    if (!firestore || isProfileLoading || !userProfile) return;

    if (userProfile.role === 'superadmin') {
      setUserBranches(adminBranches);
      return;
    }
    
    async function fetchUserBranches() {
      if (userProfile.assignedBranches && userProfile.assignedBranches.length > 0) {
        try {
          // Use Promise.all with getDoc for each assigned branch ID
          const branchPromises = userProfile.assignedBranches.map(id => getDoc(doc(firestore, 'branches', id)));
          const branchSnapshots = await Promise.all(branchPromises);
          const branchesData = branchSnapshots
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as Branch));
          setUserBranches(branchesData);
        } catch (e) {
          console.error("Error fetching user branches with getDoc: ", e);
          setUserBranches([]); // Set to empty on error
        }
      } else {
        setUserBranches([]); // No branches assigned
      }
    }

    fetchUserBranches();
  }, [firestore, userProfile, isProfileLoading, adminBranches]);

  const branches = userBranches;
  const isLoadingBranches = userBranches === null && (isProfileLoading || userProfile?.role !== 'superadmin' || isLoadingAdminBranches);

  // Fetch incidents based on user role and loaded branches
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || isLoadingBranches || !branches) return null;

    // Superadmin gets all incidents
    if (userProfile.role === 'superadmin') {
      return collection(firestore, 'incidents');
    }

    const branchIds = branches.map(b => b.id);
    if (branchIds.length > 0) {
       // A user can only query incidents for one branch at a time as per security rules.
       // Here we will query for the first assigned branch. For a more complete solution,
       // this would require multiple queries or a different data model.
       // For this dashboard, we'll focus on just the first branch to avoid permission errors.
       // A more complex implementation might run N queries, one for each branch.
      return query(collection(firestore, 'incidents'), where('branchId', '==', branchIds[0]));
    }

    // Return a query that finds nothing if user has no branches
    return query(collection(firestore, 'incidents'), where('branchId', 'in', ['non-existent-id']));
  }, [firestore, userProfile, branches, isLoadingBranches]);

  const { data: incidents, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);

  const isLoading = isProfileLoading || isLoadingBranches || (incidents === null && isLoadingIncidents);

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
