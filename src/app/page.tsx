'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getBranches, getIncidents } from '@/lib/data';

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
        setBranches([]);
        setIncidents([]);
        setIsLoadingData(false);
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
             // For non-superadmin, we cannot fetch all incidents at once due to security rules.
             // We will pass an empty array, and the DashboardClient will handle it.
             // The status will be calculated based on the incidents it receives.
             incidentsData = [];
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
