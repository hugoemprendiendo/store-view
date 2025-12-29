
'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getBranches } from '@/lib/data';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [userBranches, setUserBranches] = useState<Branch[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!firestore || !userProfile) {
        if (!isProfileLoading) {
            setIsLoadingData(false);
        }
        return;
      }

      setIsLoadingData(true);
      try {
        let branchesData: Branch[] = [];
        let incidentsData: Incident[] = [];

        // 1. Fetch branches based on user role
        if (userProfile.role === 'superadmin') {
          branchesData = await getBranches(firestore);
        } else if (userProfile.assignedBranches) {
          const branchIds = Object.keys(userProfile.assignedBranches);
          if (branchIds.length > 0) {
            branchesData = await getBranchesByIds(firestore, branchIds);
          }
        }
        setUserBranches(branchesData);

        // 2. Fetch incidents based on the fetched branches
        const accessibleBranchIds = branchesData.map(b => b.id);
        if (accessibleBranchIds.length > 0) {
           // Firestore 'in' query is limited to 30 elements per chunk.
           const chunks: string[][] = [];
           for (let i = 0; i < accessibleBranchIds.length; i += 30) {
             chunks.push(accessibleBranchIds.slice(i, i + 30));
           }

           const incidentPromises = chunks.map(chunk =>
             getDocs(query(collection(firestore, 'incidents'), where('branchId', 'in', chunk)))
           );
           
           const allSnapshots = await Promise.all(incidentPromises);
           incidentsData = allSnapshots.flatMap(snapshot =>
             snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident))
           );
        }
        setIncidents(incidentsData);
      } catch (e) {
        console.error("Error fetching dashboard data: ", e);
        setUserBranches([]);
        setIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    if (!isProfileLoading) {
      fetchData();
    }
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
      <DashboardClient branches={userBranches || []} incidents={incidents || []} />
    </div>
  );
}
