import { getBranchById, getIncidentsByBranch } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, MapPin, Building, Tag, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const priorityVariantMap = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
} as const;

export default async function BranchDetailPage({ params }: { params: { id: string } }) {
  const branch = await getBranchById(params.id);
  if (!branch) {
    notFound();
  }
  const incidents = await getIncidentsByBranch(params.id);
  const sortedIncidents = incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col gap-6">
      <Header title={branch.name}>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href={`/incidents/new?branchId=${branch.id}`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Reportar Incidencia
          </Link>
        </Button>
      </Header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Sucursal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative h-48 w-full rounded-md overflow-hidden">
                        <Image
                        src={branch.imageUrl}
                        alt={branch.name}
                        fill
                        className="object-cover"
                        data-ai-hint={branch.imageHint}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span>{branch.brand}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Flag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span>{branch.region}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Incidencias</CardTitle>
                <CardDescription>
                    Una lista de incidencias reportadas para esta sucursal.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedIncidents.length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Ver</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {sortedIncidents.map((incident) => (
                            <TableRow key={incident.id}>
                            <TableCell className="font-medium truncate max-w-xs">{incident.title}</TableCell>
                            <TableCell>{incident.category}</TableCell>
                            <TableCell>
                                <Badge variant={priorityVariantMap[incident.priority]}>
                                {incident.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>{incident.status}</TableCell>
                            <TableCell>{format(new Date(incident.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                <Link href={`/incidents/${incident.id}`}>Detalles</Link>
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay incidencias reportadas para esta sucursal todavía.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
