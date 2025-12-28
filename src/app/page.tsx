import { Header } from '@/components/layout/header';
import { getBranches, getIncidents } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const branches = await getBranches();
  const incidents = await getIncidents();

  return (
    <div className="flex flex-col gap-4">
      <Header title="Dashboard" />
      <DashboardClient branches={branches} incidents={incidents} />
    </div>
  );
}
