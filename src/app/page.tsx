'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getBranches } from '@/lib/data';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Step 1: Fetch branches based on user profile
  useEffect(() => {
    async function fetchBranches() {
      if (!firestore || !userProfile) {
        if (!isProfileLoading) {
            setIsLoadingBranches(false);
            setBranches([]);
        }
        return;
      }

      setIsLoadingBranches(true);
      try {
        let branchesData: Branch[] = [];
        if (userProfile.role === 'superadmin') {
          branchesData = await getBranches(firestore);
        } else if (userProfile.assignedBranches && Object.keys(userProfile.assignedBranches).length > 0) {
          const branchIds = Object.keys(userProfile.assignedBranches);
          branchesData = await getBranchesByIds(firestore, branchIds);
        }
        setBranches(branchesData);
      } catch (e) {
        console.error("Error fetching dashboard branches: ", e);
        setBranches([]);
      } finally {
        setIsLoadingBranches(false);
      }
    }

    if (!isProfileLoading) {
      fetchBranches();
    }
  }, [firestore, userProfile, isProfileLoading]);

  // Step 2: Create a memoized query for incidents based on fetched branches
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || branches.length === 0) return null;
    
    const accessibleBranchIds = branches.map(b => b.id);
    
    // We can only query for 30 branch IDs at a time with 'in'
    // For simplicity in this dashboard, we'll query for the first 30.
    // The main incidents page will handle full pagination if needed.
    const queryableBranchIds = accessibleBranchIds.slice(0, 30);
    
    return query(collection(firestore, 'incidents'), where('branchId', 'in', queryableBranchIds));
  }, [firestore, branches]);

  // Step 3: Use the useCollection hook to get incidents
  const { data: incidents, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);
  
  const isLoading = isProfileLoading || isLoadingBranches;

  if (isLoading) {
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
      <DashboardClient branches={branches} incidents={incidents || []} />
    </div>
  );
}
