import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { Branch, Incident, IncidentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BranchCardProps {
  branch: Branch;
  incidents: Incident[];
}

function getBranchStatus(incidents: Incident[]): IncidentStatus {
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved');
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
  const openIncidentsCount = incidents.filter(i => i.status !== 'Resolved').length;

  const statusClasses = {
    ok: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  };

  return (
    <Link href={`/branches/${branch.id}`} className="group block">
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 border-2',
          statusClasses[status]
        )}
      >
        <CardContent className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={branch.imageUrl}
              alt={branch.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={branch.imageHint}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg truncate font-headline">{branch.name}</h3>
            <p className="text-sm text-muted-foreground">{branch.address}</p>
            {openIncidentsCount > 0 && (
                 <p className="text-sm text-muted-foreground mt-2">{openIncidentsCount} open incident{openIncidentsCount > 1 ? 's' : ''}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
