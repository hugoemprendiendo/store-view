'use client';

import { useState, useEffect } from 'react';
import { getBranchById, getIncidentsByBranch } from '@/lib/data';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { Branch, Incident } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateIncidentStatus } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';

const priorityVariantMap = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
} as const;

export default function BranchDetailPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id || !firestore || !user) return;

      setIsLoading(true);
      try {
        const branchData = await getBranchById(firestore, id);
        if (!branchData) {
          notFound();
          return;
        }
        setBranch(branchData);
        const incidentsData = await getIncidentsByBranch(firestore, id);
        setIncidents(incidentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Failed to fetch branch details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, firestore, user]);

  const handleStatusChange = async (incidentId: string, newStatus: Incident['status']) => {
    setUpdatingStatus(incidentId);
    const originalIncidents = [...incidents];
    // Optimistic update
    setIncidents(incidents.map(i => i.id === incidentId ? { ...i, status: newStatus } : i));

    const result = await updateIncidentStatus(incidentId, newStatus);

    if (result.success) {
      toast({
        title: 'Estado Actualizado',
        description: `El estado de la incidencia cambió a "${newStatus}".`,
      });
      // Re-fetch data to get the latest state after action's revalidation
      router.refresh();
    } else {
      // Revert on failure
      setIncidents(originalIncidents);
      toast({
        variant: 'destructive',
        title: 'Actualización Fallida',
        description: result.error || 'No se pudo actualizar el estado de la incidencia.',
      });
    }
    setUpdatingStatus(null);
  };
  
  if (isLoading || isUserLoading) {
    return (
        <div className="flex flex-col gap-6">
             <Header title="Cargando..." />
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </div>
    )
  }

  if (!branch) {
    return notFound();
  }

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
              {incidents.length > 0 ? (
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
                  {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                      <TableCell className="font-medium truncate max-w-xs">{incident.title}</TableCell>
                      <TableCell>{incident.category}</TableCell>
                      <TableCell>
                          <Badge variant={priorityVariantMap[incident.priority]}>
                          {incident.priority}
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <Select
                            value={incident.status}
                            onValueChange={(newStatus) => handleStatusChange(incident.id, newStatus as Incident['status'])}
                            disabled={updatingStatus === incident.id}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Cambiar estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Abierto">Abierto</SelectItem>
                              <SelectItem value="En Progreso">En Progreso</SelectItem>
                              <SelectItem value="Resuelto">Resuelto</SelectItem>
                            </SelectContent>
                          </Select>
                      </TableCell>
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
