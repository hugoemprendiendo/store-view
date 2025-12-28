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

  // For superadmin, fetch all branches
  const adminBranchesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || userProfile.role !== 'superadmin') return null;
    return collection(firestore, 'branches');
  }, [firestore, userProfile]);

  const { data: adminBranches, isLoading: isLoadingAdminBranches } = useCollection<Branch>(adminBranchesQuery);
  
  // For regular users, fetch branches based on their assigned list
  useEffect(() => {
    if (!firestore || isProfileLoading || !userProfile) return;

    if (userProfile.role === 'superadmin') {
      setUserBranches(adminBranches);
      return;
    }
    
    async function fetchUserBranches() {
      if (userProfile.assignedBranches && userProfile.assignedBranches.length > 0) {
        const branchesRef = collection(firestore, 'branches');
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

    fetchUserBranches();
  }, [firestore, userProfile, isProfileLoading, adminBranches]);

  const branches = userBranches;
  const isLoadingBranches = userBranches === null;

  // Fetch incidents based on user role and loaded branches
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || isLoadingBranches) return null;

    // Superadmin gets all incidents
    if (userProfile.role === 'superadmin') {
      return collection(firestore, 'incidents');
    }

    // Regular user: only query if they have assigned branches
    const branchIds = branches?.map(b => b.id) || [];
    if (branchIds.length > 0) {
       // Firestore 'in' query is limited to 30 elements, chunk if necessary.
       // For this app, we assume a user won't be assigned to more than 30.
       // If they are, we'd need to run multiple queries and combine results client-side.
      return query(collection(firestore, 'incidents'), where('branchId', 'in', branchIds.slice(0, 30)));
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
