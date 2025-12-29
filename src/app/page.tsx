'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds } from '@/lib/data';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [userBranches, setUserBranches] = useState<Branch[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Real-time queries for SUPERADMIN
  const adminBranchesQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'branches');
  }, [firestore, userProfile?.role]);

  const adminIncidentsQuery = useMemoFirebase(() => {
    if (!firestore || userProfile?.role !== 'superadmin') return null;
    return collection(firestore, 'incidents');
  }, [firestore, userProfile?.role]);

  const { data: adminBranches, isLoading: isAdminBranchesLoading } = useCollection<Branch>(adminBranchesQuery);
  const { data: adminIncidents, isLoading: isAdminIncidentsLoading } = useCollection<Incident>(adminIncidentsQuery);
  
  // One-time fetch for REGULAR USERS' branches
  useEffect(() => {
    async function fetchUserBranches() {
      if (isProfileLoading || !firestore || !userProfile || userProfile.role === 'superadmin') {
        if(!isProfileLoading) setIsLoadingUserData(false);
        return;
      }
      
      setIsLoadingUserData(true);
      try {
        const branchIds = Object.keys(userProfile.assignedBranches || {});
        if (branchIds.length > 0) {
          const branchesData = await getBranchesByIds(firestore, branchIds);
          setUserBranches(branchesData);
        } else {
          setUserBranches([]);
        }
      } catch (e) {
        console.error("Error fetching user branches:", e);
        setUserBranches([]);
      } finally {
        setIsLoadingUserData(false);
      }
    }
    fetchUserBranches();
  }, [firestore, userProfile, isProfileLoading]);


  const isSuperAdmin = userProfile?.role === 'superadmin';
  
  // Determine final branches and incidents based on role
  const branches = isSuperAdmin ? (adminBranches || []) : userBranches;
  // CRITICAL FIX: Regular users have an empty array for incidents on the dashboard
  // to prevent any unauthorized queries.
  const incidents = isSuperAdmin ? (adminIncidents || []) : [];
  
  const isLoading = isProfileLoading || (isSuperAdmin ? (isAdminBranchesLoading || isAdminIncidentsLoading) : isLoadingUserData);

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
