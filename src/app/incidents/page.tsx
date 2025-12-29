
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { IncidentCategories, IncidentPriorities, IncidentStatuses } from '@/lib/types';
import { getBranchesByIds } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const priorityVariantMap = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
} as const;


export default function IncidentsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    async function fetchData() {
      if (!firestore || !userProfile) return;
      setIsLoading(true);
      
      let incidentsData: Incident[] = [];
      let branchesData: Branch[] = [];

      try {
        if (userProfile.role === 'superadmin') {
          const incidentsSnapshot = await getDocs(collection(firestore, 'incidents'));
          incidentsData = incidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
        } else if (userProfile.assignedBranches) {
          const branchIds = Object.keys(userProfile.assignedBranches);
          if (branchIds.length > 0) {
            const incidentPromises = branchIds.map(id => 
                getDocs(query(collection(firestore, 'incidents'), where('branchId', '==', id)))
            );
            const incidentsSnapshots = await Promise.all(incidentPromises);
            incidentsData = incidentsSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident)));
          }
        }

        const branchIds = [...new Set(incidentsData.map(inc => inc.branchId))];
        if (branchIds.length > 0) {
            branchesData = await getBranchesByIds(firestore, branchIds);
        }

        setIncidents(incidentsData);
        setBranches(branchesData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isUserLoading && !isProfileLoading) {
        fetchData();
    }
  }, [firestore, user, userProfile, isUserLoading, isProfileLoading]);

  const branchMap = useMemo(() => {
    return branches.reduce((acc, branch) => {
        acc[branch.id] = branch;
        return acc;
    }, {} as Record<string, Branch>);
  }, [branches]);

  const filteredIncidents = useMemo(() => {
    return incidents
        .filter(i => filterCategory === 'all' || i.category === filterCategory)
        .filter(i => filterStatus === 'all' || i.status === filterStatus)
        .filter(i => filterPriority === 'all' || i.priority === filterPriority)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [incidents, filterCategory, filterStatus, filterPriority]);

  const totalLoading = isLoading || isUserLoading || isProfileLoading;

  if (totalLoading) {
      return (
          <div className="flex flex-col gap-6">
              <Header title="Todas las Incidencias" />
              <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <Header title="Todas las Incidencias" />
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Incidencias</CardTitle>
          <CardDescription>Usa los filtros para encontrar incidencias específicas.</CardDescription>
           <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {IncidentCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  {IncidentStatuses.map(stat => (
                    <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Prioridades</SelectItem>
                  {IncidentPriorities.map(prio => (
                    <SelectItem key={prio} value={prio}>{prio === 'High' ? 'Alta' : prio === 'Medium' ? 'Media' : 'Baja'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium truncate max-w-xs">{incident.title}</TableCell>
                    <TableCell>{branchMap[incident.branchId]?.name || 'N/A'}</TableCell>
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
                        <Link href={`/incidents/${incident.id}`}>
                            Ver Detalles
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron incidencias con los filtros actuales.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
