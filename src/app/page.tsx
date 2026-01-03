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
    if (isProfileLoading || !userProfile || isSuperAdmin) return null;
    return Object.keys(userProfile?.assignedBranches || {});
  }, [isProfileLoading, userProfile, isSuperAdmin]);

  // 2. Build a query for the branches. This query now correctly depends on assignedBranchIds.
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || isProfileLoading) return null;
    if (isSuperAdmin) {
      return collection(firestore, 'branches');
    }
    // If assignedBranchIds is null (loading) or empty, we return null to prevent a query.
    if (assignedBranchIds && assignedBranchIds.length > 0) {
      const chunk = assignedBranchIds.slice(0, 30);
      return query(collection(firestore, 'branches'), where('__name__', 'in', chunk));
    }
    // For non-superadmin users with no assigned branches yet, return null.
    if (!isSuperAdmin && assignedBranchIds?.length === 0) {
        return null;
    }
    return null; 
  }, [firestore, isProfileLoading, isSuperAdmin, assignedBranchIds]);

  // 3. Build a query for the incidents related to those branches. This also depends on assignedBranchIds.
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || isProfileLoading) return null;
    if (isSuperAdmin) {
      return query(collection(firestore, 'incidents'), orderBy('createdAt', 'desc'));
    }
    if (assignedBranchIds && assignedBranchIds.length > 0) {
      const chunk = assignedBranchIds.slice(0, 30);
      return query(
        collection(firestore, 'incidents'), 
        where('branchId', 'in', chunk),
        orderBy('createdAt', 'desc')
      );
    }
    // For non-superadmin users with no assigned branches yet, return null.
    if (!isSuperAdmin && assignedBranchIds?.length === 0) {
        return null;
    }
    return null;
  }, [firestore, isProfileLoading, isSuperAdmin, assignedBranchIds]);

  // 4. Fetch data using the real-time hooks.
  const { data: branches, isLoading: isBranchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: incidents, isLoading: isIncidentsLoading } = useCollection<Incident>(incidentsQuery);

  // --- Loading State ---
  
  // The page is loading if the user profile is loading OR if the queries are active and loading.
  // If queries are null (because there are no branch IDs yet), their loading state is ignored.
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
