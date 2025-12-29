
'use client';
import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { useFirestore } from '@/firebase';
import type { Branch, Incident } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getBranchesByIds, getBranches } from '@/lib/data';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [userBranches, setUserBranches] = useState<Branch[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Abort controller to prevent state updates if the component unmounts
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchData() {
      // Ensure Firestore is ready and we have a definitive user profile state
      if (!firestore || isProfileLoading) {
        return;
      }

      // If auth is loaded but there's no profile, the user is likely new or logged out.
      // We can stop loading and show an empty state.
      if (!userProfile) {
        if (!signal.aborted) {
            setUserBranches([]);
            setIncidents([]);
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
        } else if (userProfile.assignedBranches && Object.keys(userProfile.assignedBranches).length > 0) {
          // CORRECT: Use Object.keys() because 'assignedBranches' IS a map/object.
          const branchIds = Object.keys(userProfile.assignedBranches);
          branchesData = await getBranchesByIds(firestore, branchIds);
        }

        if (signal.aborted) return;
        setUserBranches(branchesData);

        const accessibleBranchIds = branchesData.map(b => b.id);

        // 2. Fetch incidents only for the branches the user has access to.
        if (accessibleBranchIds.length > 0) {
           const chunks: string[][] = [];
           // Securely chunk the branch IDs for 'in' queries.
           for (let i = 0; i < accessibleBranchIds.length; i += 30) {
             chunks.push(accessibleBranchIds.slice(i, i + 30));
           }

           const incidentPromises = chunks.map(chunk =>
             getDocs(query(collection(firestore, 'incidents'), where('branchId', 'in', chunk)))
           );
           
           const allSnapshots = await Promise.all(incidentPromises);

           if (signal.aborted) return;
           
           incidentsData = allSnapshots.flatMap(snapshot =>
             snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident))
           );
        }
        
        if (signal.aborted) return;
        setIncidents(incidentsData);

      } catch (e) {
        if (!signal.aborted) {
            console.error("Error fetching dashboard data: ", e);
            setUserBranches([]);
            setIncidents([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoadingData(false);
        }
      }
    }
    
    fetchData();

    // Cleanup function to abort fetch if component unmounts
    return () => {
      controller.abort();
    };
  // The dependency array correctly triggers a re-fetch when the user profile or loading status changes.
  }, [firestore, userProfile, isProfileLoading]);
  
  // The total loading state is true if we are waiting for the user profile OR the subsequent data fetch.
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
