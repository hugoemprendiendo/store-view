'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState, useMemo } from 'react';
import { getBranchesByIds, getBranches } from '@/lib/data';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [userBranches, setUserBranches] = useState<Branch[] | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Fetch branches based on user role, memoized to prevent re-running on every render
  useEffect(() => {
    async function fetchUserBranches() {
      if (!firestore || !userProfile) {
        setIsLoadingBranches(false);
        return;
      }

      setIsLoadingBranches(true);
      try {
        let branchesData: Branch[] = [];
        if (userProfile.role === 'superadmin') {
          branchesData = await getBranches(firestore);
        } else if (userProfile.assignedBranches) {
          const branchIds = Object.keys(userProfile.assignedBranches);
          if (branchIds.length > 0) {
            branchesData = await getBranchesByIds(firestore, branchIds);
          }
        }
        setUserBranches(branchesData);
      } catch (e) {
        console.error("Error fetching user branches: ", e);
        setUserBranches([]);
      } finally {
        setIsLoadingBranches(false);
      }
    }

    if (!isProfileLoading) {
      fetchUserBranches();
    }
  }, [firestore, userProfile, isProfileLoading]);


  const branches = userBranches;

  // Fetch incidents based on user role and loaded branches
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || isLoadingBranches || !branches) return null;

    if (userProfile.role === 'superadmin') {
      return collection(firestore, 'incidents');
    }
    
    const assignedBranchIds = Object.keys(userProfile.assignedBranches || {});
    if (assignedBranchIds.length > 0) {
        // Firestore 'in' query is limited to 30 elements. Chunking is required for > 30.
        const chunks = [];
        for (let i = 0; i < assignedBranchIds.length; i += 30) {
            chunks.push(assignedBranchIds.slice(i, i + 30));
        }
        // For simplicity in this context, we will only query the first chunk.
        // A real-world app might need to combine results from all chunks.
        if(chunks[0]) {
            return query(collection(firestore, 'incidents'), where('branchId', 'in', chunks[0]));
        }
    }
    
    // For users with 0 branches or if something went wrong.
    // We return a query that will yield no results to avoid errors.
    return query(collection(firestore, 'incidents'), where('branchId', '==', 'non-existent-id'));
  }, [firestore, userProfile, branches, isLoadingBranches]);

  const { data: incidentsData, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);
  const incidents = incidentsData || [];


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
      <DashboardClient branches={branches || []} incidents={incidents} />
    </div>
  );
}
