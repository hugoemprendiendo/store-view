'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null;
    if (userProfile.role === 'superadmin') {
      return collection(firestore, 'branches');
    }
    if (userProfile.assignedBranches && userProfile.assignedBranches.length > 0) {
      return query(collection(firestore, 'branches'), where('__name__', 'in', userProfile.assignedBranches));
    }
    return query(collection(firestore, 'branches'), where('__name__', 'in', ['non-existent-id']));
  }, [firestore, userProfile]);

  const { data: branches, isLoading: isLoadingBranches } = useCollection<Branch>(branchesQuery);

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !branches || branches.length === 0) return null;

    const branchIds = branches.map(b => b.id);
    // Firestore 'in' query is limited to 30 elements. If we have more, we can't query incidents this way.
    // For this app, we'll assume a user won't be assigned to more than 30 branches.
    if (branchIds.length > 0 && branchIds.length <= 30) {
        return query(collection(firestore, 'incidents'), where('branchId', 'in', branchIds));
    }
    if (userProfile?.role === 'superadmin') {
        return collection(firestore, 'incidents');
    }
    // If no branches or too many, return an empty query
    return query(collection(firestore, 'incidents'), where('branchId', 'in', ['non-existent-id']));

  }, [firestore, branches, userProfile?.role]);

  const { data: incidents, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);

  const isLoading = isProfileLoading || isLoadingBranches || isLoadingIncidents;

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
