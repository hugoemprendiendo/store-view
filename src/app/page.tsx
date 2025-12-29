'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getBranches, getIncidents, getIncidentsForUser } from '@/lib/data';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (isProfileLoading || !firestore) {
        return;
      }
      if (!userProfile) {
        setIsLoadingData(false);
        setBranches([]);
        setIncidents([]);
        return;
      }

      setIsLoadingData(true);
      try {
        let branchesData: Branch[] = [];
        let incidentsData: Incident[] = [];

        if (userProfile.role === 'superadmin') {
          // Superadmin can fetch everything
          [branchesData, incidentsData] = await Promise.all([
            getBranches(firestore),
            getIncidents(firestore),
          ]);
        } else if (userProfile.assignedBranches) {
          const branchIds = Object.keys(userProfile.assignedBranches);
          if (branchIds.length > 0) {
             branchesData = await getBranchesByIds(firestore, branchIds);
             incidentsData = await getIncidentsForUser(firestore, branchIds);
          }
        }
        setBranches(branchesData);
        setIncidents(incidentsData);
      } catch (e) {
        console.error("Error fetching dashboard data: ", e);
        setBranches([]);
        setIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [firestore, userProfile, isProfileLoading]);

  const isLoading = isProfileLoading || isLoadingData;

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
      <DashboardClient branches={branches} incidents={incidents} />
    </div>
  );
}
