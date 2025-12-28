'use client';
import { getIncidentById, getBranchById } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import IncidentDetails from '@/components/incidents/incident-details';
import { useEffect, useState } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function IncidentDetailPage() {
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id || !firestore) return;
      setIsLoading(true);
      const incidentData = await getIncidentById(firestore, id);
      if (!incidentData) {
        notFound();
        return;
      }
      setIncident(incidentData);

      const branchData = await getBranchById(firestore, incidentData.branchId);
       if (!branchData) {
        notFound();
        return;
      }
      setBranch(branchData);
      setIsLoading(false);
    }
    fetchData();
  }, [id, firestore]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Header title="Detalles de la Incidencia" />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!incident || !branch) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Header title="Detalles de la Incidencia" />
      <IncidentDetails incident={incident} branch={branch} />
    </div>
  );
}
