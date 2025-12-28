import { Header } from '@/components/layout/header';
import { IncidentForm } from '@/components/incidents/incident-form';
import { Suspense } from 'react';

function IncidentFormWrapper() {
  return <IncidentForm />;
}

export default function NewIncidentPage() {
  return (
    <div className="flex flex-col gap-4">
      <Header title="Report New Incident" />
      <Suspense fallback={<p>Loading form...</p>}>
        <IncidentFormWrapper />
      </Suspense>
    </div>
  );
}
