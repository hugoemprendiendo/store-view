'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds } from '@/lib/data';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

  // Data fetching for REGULAR USERS
  useEffect(() => {
    async function fetchUserData() {
      // This effect should only run for regular users
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
          // 1. Fetch assigned branches
          const branchesData = await getBranchesByIds(firestore, branchIds);
          setLocalBranches(branchesData);
          
          // 2. Securely fetch incidents ONLY for those branches using an 'in' query.
          // This is allowed by the security rules.
          const incidentsRef = collection(firestore, 'incidents');
          const incidentsForUserQuery = query(incidentsRef, where('branchId', 'in', branchIds));
          const incidentsSnapshot = await getDocs(incidentsForUserQuery);
          const incidentsData = incidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
          setLocalIncidents(incidentsData);
        } else {
          // User has no assigned branches
          setLocalBranches([]);
          setLocalIncidents([]);
        }
      } catch (e) {
        console.error("Error fetching dashboard data for user: ", e);
        setLocalBranches([]);
        setLocalIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchUserData();
  }, [firestore, userProfile, isProfileLoading]);

  // Determine final data based on user role
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
