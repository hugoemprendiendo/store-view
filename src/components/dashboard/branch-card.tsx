import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Branch, Incident, IncidentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

interface BranchCardProps {
  branch: Branch;
  incidents: Incident[];
}

function getBranchStatus(incidents: Incident[]): 'error' | 'warning' | 'ok' {
  const openIncidents = incidents.filter((i) => i.status !== 'Resuelto');
  if (openIncidents.some((i) => i.priority === 'High')) {
    return 'error';
  }
  if (openIncidents.some((i) => i.priority === 'Medium')) {
    return 'warning';
  }
  return 'ok';
}

export function BranchCard({ branch, incidents }: BranchCardProps) {
  const status = getBranchStatus(incidents);

  const statusClasses = {
    ok: 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/50',
    error: 'bg-red-100 border-red-500 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50',
  };

  return (
    <Link href={`/branches/${branch.id}`} className="group block">
      <Card
        className={cn(
          'transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1 border-2 h-full',
          statusClasses[status]
        )}
      >
        <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full">
            <Building2 className="size-8 mb-2" />
            <h3 className="font-semibold text-sm leading-tight font-headline">{branch.name}</h3>
            <p className="text-xs text-current/70">{branch.brand}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
