'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { IncidentFormStep1 } from '@/components/incidents/incident-form-step-1';
import { IncidentFormStep2 } from '@/components/incidents/incident-form-step-2';

export type IncidentData = {
  photoDataUri?: string;
  audioTranscription?: string;
  textDescription?: string;
};

export default function NewIncidentPage() {
  const [step, setStep] = useState(1);
  const [incidentData, setIncidentData] = useState<IncidentData | null>(null);

  const handleStep1Complete = (data: IncidentData) => {
    setIncidentData(data);
    setStep(2);
  };

  const handleBack = () => {
    setIncidentData(null);
    setStep(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <Header title="Reportar Nueva Incidencia" />
      {step === 1 && <IncidentFormStep1 onStepComplete={handleStep1Complete} />}
      {step === 2 && incidentData && <IncidentFormStep2 incidentData={incidentData} onBack={handleBack} />}
    </div>
  );
}
