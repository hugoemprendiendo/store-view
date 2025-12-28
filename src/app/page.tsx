'use client';
import { Header } from '@/components/layout/header';
import { getBranches, getIncidents } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';

export default function DashboardPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  useEffect(() => {
    async function fetchData() {
      if (!user || !firestore) return;
      setIsLoading(true);
      const [branchesData, incidentsData] = await Promise.all([
        getBranches(firestore),
        getIncidents(firestore)
      ]);
      setBranches(branchesData);
      setIncidents(incidentsData);
      setIsLoading(false);
    }
    fetchData();
  }, [firestore, user]);

  if (isUserLoading || (isLoading && user)) {
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
      <DashboardClient branches={branches} incidents={incidents} />
    </div>
  );
}
