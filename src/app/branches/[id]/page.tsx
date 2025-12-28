import { getBranchById, getIncidentsByBranch } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  );
}
