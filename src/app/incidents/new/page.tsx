'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { IncidentFormStep1 } from '@/components/incidents/incident-form-step-1';
import { IncidentFormStep2 } from '@/components/incidents/incident-form-step-2';
import { useFirestore } from '@/firebase';
import { getBranchById } from '@/lib/data';
import type { Branch } from '@/lib/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

export type IncidentData = {
  photoDataUri?: string;
  audioTranscription?: string;
  textDescription?: string;
  audioTokens?: number;
};

export default function NewIncidentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();

  const [step, setStep] = useState(1);
  const [incidentData, setIncidentData] = useState<IncidentData | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const branchId = searchParams.get('branchId');

  useEffect(() => {
    if (!branchId || !firestore) {
      setIsLoading(false);
      return;
    }

    async function fetchBranch() {
      const branchData = await getBranchById(firestore, branchId as string);
      if (branchData) {
        setBranch(branchData);
      }
      setIsLoading(false);
    }

    fetchBranch();
  }, [branchId, firestore]);

  const handleStep1Complete = (data: IncidentData) => {
    setIncidentData(data);
    setStep(2);
  };

  const handleBack = () => {
    setIncidentData(null);
    setStep(1);
  }

  const headerTitle = branch
    ? `Reporte para: ${branch.name}`
    : 'Reportar Nueva Incidencia';
  
  if (isLoading) {
    return (
        <div className="flex flex-col gap-4">
            <Header title="Cargando..." />
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </div>
    );
  }

  if (!branchId || !branch) {
    return (
        <div className="flex flex-col gap-4">
            <Header title="Error" />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="text-destructive" />
                        Sucursal no especificada
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>
                        No se ha proporcionado una sucursal válida. Por favor, regresa al panel de control o a la página de sucursales y selecciona "Reportar Incidencia" desde una sucursal específica.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Header title={headerTitle} />
      {step === 1 && <IncidentFormStep1 onStepComplete={handleStep1Complete} />}
      {step === 2 && incidentData && <IncidentFormStep2 incidentData={incidentData} onBack={handleBack} />}
    </div>
  );
}
