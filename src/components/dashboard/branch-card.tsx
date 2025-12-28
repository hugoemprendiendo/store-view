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
  const hasOpen = incidents.some((i) => i.status === 'Abierto');
  const hasInProgress = incidents.some((i) => i.status === 'En Progreso');

  if (hasOpen) {
    return 'error';
  }
  if (hasInProgress) {
    return 'warning';
  }
  return 'ok';
}

export function BranchCard({ branch, incidents }: BranchCardProps) {
  const status = getBranchStatus(incidents);

  const statusClasses = {
    ok: 'bg-green-500/10 border-green-500/50 text-green-800 hover:bg-green-500/20 dark:text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-800 hover:bg-yellow-500/20 dark:text-yellow-300',
    error: 'bg-red-500/10 border-red-500/50 text-red-800 hover:bg-red-500/20 dark:text-red-300',
  };

  return (
    <Link href={`/branches/${branch.id}`} className="group block">
      <Card
        className={cn(
          'transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1 border h-full',
          statusClasses[status]
        )}
      >
        <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full">
            <Building2 className="size-8 mb-2" />
            <h3 className="font-semibold text-sm leading-tight font-headline">{branch.name}</h3>
            <p className="text-xs text-current/70">{branch.brand} - {branch.region}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
