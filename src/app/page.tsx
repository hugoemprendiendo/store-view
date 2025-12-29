'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getBranches } from '@/lib/data';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [localBranches, setLocalBranches] = useState<Branch[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Real-time queries for SUPERADMIN
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'branches');
  }, [firestore, userProfile]);

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'incidents');
  }, [firestore, userProfile]);

  const { data: adminBranches, isLoading: isAdminBranchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: adminIncidents, isLoading: isAdminIncidentsLoading } = useCollection<Incident>(incidentsQuery);

  // One-time data fetch for REGULAR USERS
  useEffect(() => {
    async function fetchUserData() {
      if (isProfileLoading || !firestore || !userProfile) {
        if (!isProfileLoading) {
            setIsLoadingData(false);
        }
        return;
      }

      if (userProfile.role === 'superadmin') {
        setIsLoadingData(false); // Superadmin data is handled by real-time hooks
        return;
      }

      // --- Logic for regular users ---
      setIsLoadingData(true);
      try {
        const branchIds = Object.keys(userProfile.assignedBranches || {});
        if (branchIds.length > 0) {
          const branchesData = await getBranchesByIds(firestore, branchIds);
          setLocalBranches(branchesData);
        } else {
          setLocalBranches([]);
        }
      } catch (e) {
        console.error("Error fetching dashboard data for user: ", e);
        setLocalBranches([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchUserData();
  }, [firestore, userProfile, isProfileLoading]);

  // Determine final data based on user role
  const branches = userProfile?.role === 'superadmin' ? adminBranches || [] : localBranches;
  const incidents = userProfile?.role === 'superadmin' ? adminIncidents || [] : []; // Non-admins don't get incidents on dashboard

  const isLoading = isProfileLoading || isLoadingData || (userProfile?.role === 'superadmin' && (isAdminBranchesLoading || isAdminIncidentsLoading));

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
