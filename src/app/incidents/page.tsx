
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { getBranchesByIds, getBranches } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
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
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userBranches, setUserBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterBranchId, setFilterBranchId] = useState('all');

  useEffect(() => {
    async function fetchData() {
      if (!firestore || !userProfile) {
        if(!isProfileLoading) setIsLoading(false);
        return;
      };
      setIsLoading(true);
      
      try {
        let branchesData: Branch[] = [];
        let incidentsData: Incident[] = [];

        // Step 1: Fetch the branches the user has access to.
        if (userProfile.role === 'superadmin') {
          branchesData = await getBranches(firestore);
        } else if (userProfile.assignedBranches && Object.keys(userProfile.assignedBranches).length > 0) {
          const branchIds = Object.keys(userProfile.assignedBranches);
          branchesData = await getBranchesByIds(firestore, branchIds);
        }
        setUserBranches(branchesData);

        // Step 2: Fetch incidents only for the branches the user can access.
        const accessibleBranchIds = branchesData.map(b => b.id);
        if (accessibleBranchIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < accessibleBranchIds.length; i += 30) {
              chunks.push(accessibleBranchIds.slice(i, i + 30));
          }
          const incidentPromises = chunks.map(chunk => 
              getDocs(query(collection(firestore, 'incidents'), where('branchId', 'in', chunk)))
          );
          const incidentsSnapshots = await Promise.all(incidentPromises);
          incidentsData = incidentsSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident)));
        }
        setIncidents(incidentsData);
        
      } catch (error) {
        console.error("Error fetching data: ", error);
        setIncidents([]);
        setUserBranches([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isProfileLoading) {
        fetchData();
    }
  }, [firestore, userProfile, isProfileLoading]);

  const branchMap = useMemo(() => {
    return userBranches.reduce((acc, branch) => {
        acc[branch.id] = branch;
        return acc;
    }, {} as Record<string, Branch>);
  }, [userBranches]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const branch = branchMap[i.branchId];
      if (!branch) {
          // This can happen if an incident belongs to a branch that the user
          // doesn't have access to, or data is inconsistent. Safest to not show it.
          return false;
      }
      return (
        (filterCategory === 'all' || i.category === filterCategory) &&
        (filterStatus === 'all' || i.status === filterStatus) &&
        (filterPriority === 'all' || i.priority === filterPriority) &&
        (filterRegion === 'all' || branch.region === filterRegion) &&
        (filterBrand === 'all' || branch.brand === filterBrand) &&
        (filterBranchId === 'all' || i.branchId === filterBranchId)
      );
    });
  }, [incidents, filterCategory, filterStatus, filterPriority, filterRegion, filterBrand, filterBranchId, branchMap]);

  const availableOptions = useMemo(() => {
    const branchesInFilter = new Map<string, Branch>();
    filteredIncidents.forEach(incident => {
      if (branchMap[incident.branchId] && !branchesInFilter.has(incident.branchId)) {
        branchesInFilter.set(incident.branchId, branchMap[incident.branchId]);
      }
    });

    const branchesArray = Array.from(branchesInFilter.values());
  
    return {
      categories: ['all', ...Array.from(new Set(filteredIncidents.map(i => i.category)))],
      statuses: ['all', ...Array.from(new Set(filteredIncidents.map(i => i.status)))],
      priorities: ['all', ...Array.from(new Set(filteredIncidents.map(i => i.priority)))],
      regions: ['all', ...Array.from(new Set(branchesArray.map(b => b.region)))],
      brands: ['all', ...Array.from(new Set(branchesArray.map(b => b.brand)))],
      branches: ['all', ...branchesArray],
    };
  }, [filteredIncidents, branchMap]);
  
  const sortedAndFilteredIncidents = useMemo(() => {
    return filteredIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredIncidents]);

  const totalLoading = isLoading || isProfileLoading;

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
          <CardDescription>Usa los filtros para encontrar incidencias específicas. Los filtros se adaptan a los resultados.</CardDescription>
           <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Regiones</SelectItem>
                  {availableOptions.regions.filter(r => r !== 'all').map(reg => (
                    <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Marcas</SelectItem>
                  {availableOptions.brands.filter(b => b !== 'all').map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBranchId} onValueChange={setFilterBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tienda" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las Tiendas</SelectItem>
                    {availableOptions.branches.filter(b => b !== 'all').map(branch => (
                        <SelectItem key={(branch as Branch).id} value={(branch as Branch).id}>{(branch as Branch).name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
               <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {availableOptions.categories.filter(c => c !== 'all').map(cat => (
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
                  {availableOptions.statuses.filter(s => s !== 'all').map(stat => (
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
                   {availableOptions.priorities.filter(p => p !== 'all').map(prio => (
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
                {sortedAndFilteredIncidents.length > 0 ? sortedAndFilteredIncidents.map((incident) => (
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
