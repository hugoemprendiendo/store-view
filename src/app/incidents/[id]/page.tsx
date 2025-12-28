import { getIncidentById, getBranchById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import IncidentDetails from '@/components/incidents/incident-details';

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const incident = await getIncidentById(params.id);
  if (!incident) {
    notFound();
  }

  const branch = await getBranchById(incident.branchId);
  if (!branch) {
      notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Header title="Incident Details" />
      <IncidentDetails incident={incident} branch={branch} />
    </div>
  );
}
