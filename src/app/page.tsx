'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getIncidentsForUser } from '@/lib/data';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [localBranches, setLocalBranches] = useState<Branch[]>([]);
  const [localIncidents, setLocalIncidents] = useState<Incident[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Real-time queries for SUPERADMIN
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'branches');
  }, [firestore, userProfile?.role]);

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'incidents');
  }, [firestore, userProfile?.role]);

  const { data: adminBranches, isLoading: isAdminBranchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: adminIncidents, isLoading: isAdminIncidentsLoading } = useCollection<Incident>(incidentsQuery);

  // One-time data fetching for REGULAR USERS
  useEffect(() => {
    async function fetchUserData() {
      // Exit if still loading, no firestore, no user profile, or if user is a superadmin (handled by real-time hooks)
      if (isProfileLoading || !firestore || !userProfile || userProfile.role === 'superadmin') {
        if (!isProfileLoading) {
            setIsLoadingData(false);
        }
        return;
      }

      setIsLoadingData(true);
      try {
        const branchIds = Object.keys(userProfile.assignedBranches || {});
        if (branchIds.length > 0) {
          // Fetch the specific branches and their corresponding incidents in parallel
          const [branchesData, incidentsData] = await Promise.all([
            getBranchesByIds(firestore, branchIds),
            getIncidentsForUser(firestore, branchIds)
          ]);
          setLocalBranches(branchesData);
          setLocalIncidents(incidentsData);
        } else {
          // If user has no assigned branches, set data to empty arrays
          setLocalBranches([]);
          setLocalIncidents([]);
        }
      } catch (e) {
        console.error("Error fetching dashboard data for user: ", e);
        // Set to empty arrays on error to prevent crashes and show an empty state.
        setLocalBranches([]);
        setLocalIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchUserData();
  }, [firestore, userProfile, isProfileLoading]);

  const isSuperAdmin = userProfile?.role === 'superadmin';
  const branches = isSuperAdmin ? adminBranches || [] : localBranches;
  const incidents = isSuperAdmin ? adminIncidents || [] : localIncidents;

  const isLoading = isProfileLoading || (isSuperAdmin ? (isAdminBranchesLoading || isAdminIncidentsLoading) : isLoadingData);

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
