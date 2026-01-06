'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const isSuperAdmin = userProfile?.role === 'superadmin';

  // --- Real-time data fetching ---
  
  // 1. Get assigned branch IDs for the current user.
  // This value is now derived directly from userProfile and will update when it does.
  const assignedBranchIds = useMemo(() => {
    if (isProfileLoading || !userProfile) return null; // Return null if still loading or no profile
    if (isSuperAdmin) return []; // Superadmin doesn't need this for querying
    return Object.keys(userProfile.assignedBranches || {});
  }, [isProfileLoading, userProfile, isSuperAdmin]);

  // 2. Build a query for the branches. This query now correctly depends on assignedBranchIds.
  const branchesQuery = useMemoFirebase(() => {
    // Don't query until profile is loaded
    if (isProfileLoading || !firestore) return null; 
    
    if (isSuperAdmin) {
      return collection(firestore, 'branches');
    }
    
    // For regular users, wait until assignedBranchIds array is available.
    if (assignedBranchIds) {
      // If the user has no assigned branches, query for a non-existent ID.
      // This is safe and returns an empty result as intended.
      const chunk = assignedBranchIds.slice(0, 30);
      return query(collection(firestore, 'branches'), where('__name__', 'in', chunk.length > 0 ? chunk : ['non-existent-id']));
    }
    
    // Return null if we are a regular user and don't have the IDs yet.
    return null; 
  }, [firestore, isProfileLoading, isSuperAdmin, assignedBranchIds]);

  // 3. Build a query for the incidents related to those branches. This also depends on assignedBranchIds.
  const incidentsQuery = useMemoFirebase(() => {
    // Don't query until profile is loaded
    if (isProfileLoading || !firestore) return null; 

    if (isSuperAdmin) {
      return query(collection(firestore, 'incidents'), orderBy('createdAt', 'desc'));
    }

    // For regular users, wait until assignedBranchIds array is available.
    if (assignedBranchIds) {
      const chunk = assignedBranchIds.slice(0, 30);
      return query(
        collection(firestore, 'incidents'), 
        where('branchId', 'in', chunk.length > 0 ? chunk : ['non-existent-id']),
        orderBy('createdAt', 'desc')
      );
    }
    
    // Return null if we are a regular user and don't have the IDs yet.
    return null; 
  }, [firestore, isProfileLoading, isSuperAdmin, assignedBranchIds]);

  // 4. Fetch data using the real-time hooks.
  const { data: branches, isLoading: isBranchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: incidents, isLoading: isIncidentsLoading } = useCollection<Incident>(incidentsQuery);

  // --- Loading State ---
  
  // The page is loading if the user profile is still loading, OR if the queries have been built and are actively loading data.
  const isLoading = isProfileLoading || (branchesQuery !== null && isBranchesLoading) || (incidentsQuery !== null && isIncidentsLoading);
  
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

  // Handle the case where a regular user has 0 branches assigned.
  // This check now runs *after* loading is complete.
  if (!isSuperAdmin && (!branches || branches.length === 0)) {
     return (
        <div className="flex flex-col gap-6">
          <Header title="Panel de Control" />
          <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No tienes sucursales asignadas.</p>
              <p>Por favor, contacta a un administrador para que te asigne a una o más sucursales.</p>
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
