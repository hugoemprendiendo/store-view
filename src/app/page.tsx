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
  const assignedBranchIds = useMemo(() => {
    if (isProfileLoading || isSuperAdmin) return null;
    return Object.keys(userProfile?.assignedBranches || {});
  }, [isProfileLoading, isSuperAdmin, userProfile]);

  // 2. Build a query for the branches.
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || isProfileLoading) return null;
    if (isSuperAdmin) {
      return collection(firestore, 'branches');
    }
    if (assignedBranchIds && assignedBranchIds.length > 0) {
      // Note: 'in' query is limited to 30 items. We query only the first chunk for real-time.
      const chunk = assignedBranchIds.slice(0, 30);
      return query(collection(firestore, 'branches'), where('__name__', 'in', chunk));
    }
    return null; // Return null if user has no assigned branches
  }, [firestore, isProfileLoading, isSuperAdmin, assignedBranchIds]);

  // 3. Build a query for the incidents related to those branches.
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
    return null;
  }, [firestore, isProfileLoading, isSuperAdmin, assignedBranchIds]);

  // 4. Fetch data using the real-time hooks.
  const { data: branches, isLoading: isBranchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: incidents, isLoading: isIncidentsLoading } = useCollection<Incident>(incidentsQuery);

  // --- Loading State ---
  
  // The page is loading if the user profile or any of the active queries are loading.
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

  return (
    <div className="flex flex-col gap-6">
      <Header title="Panel de Control" />
      <DashboardClient branches={branches || []} incidents={incidents || []} />
    </div>
  );
}
