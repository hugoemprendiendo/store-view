'use client';
import { Header } from '@/components/layout/header';
import { getBranches, getIncidents } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  // Create memoized collection references
  const branchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'branches') : null, [firestore]);
  const incidentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'incidents') : null, [firestore]);

  // Subscribe to real-time updates
  const { data: branches, isLoading: isLoadingBranches } = useCollection<Branch>(branchesQuery);
  const { data: incidents, isLoading: isLoadingIncidents } = useCollection<Incident>(incidentsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const isLoading = isUserLoading || isLoadingBranches || isLoadingIncidents;

  if (isLoading || (isLoading && user)) {
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
