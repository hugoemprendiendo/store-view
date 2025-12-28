'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [userBranches, setUserBranches] = useState<Branch[] | null>(null);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null;
    
    // Superadmin gets all branches
    if (userProfile.role === 'superadmin') {
      return collection(firestore, 'branches');
    }
    
    // For regular users, we will fetch by IDs, so this query will be null.
    return null;
  }, [firestore, userProfile]);

  const { data: adminBranches, isLoading: isLoadingAdminBranches } = useCollection<Branch>(branchesQuery);

  useEffect(() => {
    async function fetchUserBranches() {
      if (!firestore || !userProfile || userProfile.role === 'superadmin') {
        return;
      }
      
      if (userProfile.assignedBranches && userProfile.assignedBranches.length > 0) {
        const branchesRef = collection(firestore, 'branches');
        // Firestore 'in' query is limited to 30 documents. Chunk if necessary.
        const chunks: string[][] = [];
        for (let i = 0; i < userProfile.assignedBranches.length; i += 30) {
          chunks.push(userProfile.assignedBranches.slice(i, i + 30));
        }
        
        try {
          const chunkPromises = chunks.map(chunk => 
            getDocs(query(branchesRef, where('__name__', 'in', chunk)))
          );
          const allSnapshots = await Promise.all(chunkPromises);
          const branchesData = allSnapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch))
          );
          setUserBranches(branchesData);
        } catch (e) {
          console.error("Error fetching user branches: ", e);
          setUserBranches([]); // set to empty on error
        }
      } else {
        setUserBranches([]); // No branches assigned
      }
    }

    if (!isProfileLoading) {
      fetchUserBranches();
    }
  }, [firestore, userProfile, isProfileLoading]);

  const branches = userProfile?.role === 'superadmin' ? adminBranches : userBranches;
  const isLoadingBranches = userProfile?.role === 'superadmin' ? isLoadingAdminBranches : userBranches === null;

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !branches || branches.length === 0) {
      // If a user has no assigned branches, or we are still loading, return a query that finds nothing.
       return query(collection(firestore, 'incidents'), where('branchId', 'in', ['non-existent-id']));
    }

    const branchIds = branches.map(b => b.id);
    // Firestore 'in' query is limited to 30 elements.
    if (branchIds.length > 0 && branchIds.length <= 30) {
        return query(collection(firestore, 'incidents'), where('branchId', 'in', branchIds));
    }
    // If superadmin has > 30 branches, this will fetch all incidents.
    if (userProfile?.role === 'superadmin') {
        return collection(firestore, 'incidents');
    }
    // For regular users with > 30 branches, this would need a more complex solution (e.g., multiple queries).
    // For now, we fall back to a query that finds nothing to avoid errors.
    return query(collection(firestore, 'incidents'), where('branchId', 'in', ['non-existent-id']));

  }, [firestore, branches, userProfile?.role]);

  const { data: incidents, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);

  const isLoading = isProfileLoading || isLoadingBranches;

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
