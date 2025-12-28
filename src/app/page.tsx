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
    // IMPORTANT: Firestore security rules for 'list' don't support 'in' queries
    // against a user's permissions array in another document. So, a user can only
    // query incidents for ONE branch at a time.
    // If the user is assigned to more than one branch, we can't reliably load all
    // incidents on the dashboard without making N separate queries, which is complex
    // with hooks. For now, we will only query if they are assigned to exactly ONE branch.
    // Otherwise, we return null to avoid a permission error.
    if (branchIds.length === 1) {
      return query(collection(firestore, 'incidents'), where('branchId', '==', branchIds[0]));
    }
    
    // If user has 0 or >1 branches, return null for the query.
    // We will show 0 incidents on the dashboard in this case to prevent errors.
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
