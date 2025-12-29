'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { getBranchesByIds, getBranches, getIncidentsForUser } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  const [allUserBranches, setAllUserBranches] = useState<Branch[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterBranchId, setFilterBranchId] = useState('all');
  
  useEffect(() => {
    async function fetchData() {
      if (isProfileLoading || !firestore) {
        return;
      }
      setIsLoadingData(true);
      
      if (!userProfile) {
          setAllUserBranches([]);
          setIncidents([]);
          setIsLoadingData(false);
          return;
      }

      const isSuperAdmin = userProfile.role === 'superadmin';
      const accessibleBranchIds = isSuperAdmin ? null : Object.keys(userProfile.assignedBranches || {});

      try {
        const branches = isSuperAdmin 
          ? await getBranches(firestore) 
          : await getBranchesByIds(firestore, accessibleBranchIds || []);
        
        setAllUserBranches(branches);

        if (branches.length > 0) {
            const branchIds = branches.map(b => b.id);
            const incidentsData = await getIncidentsForUser(firestore, branchIds);
            setIncidents(incidentsData);
        } else {
            setIncidents([]);
        }

      } catch (error) {
        console.error("Error fetching data for incidents page:", error);
        setAllUserBranches([]);
        setIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [firestore, userProfile, isProfileLoading]);


  // --- Filtering Logic ---

  const branchMap = useMemo(() => {
    if (!allUserBranches) return {};
    return allUserBranches.reduce((acc, branch) => {
        acc[branch.id] = branch;
        return acc;
    }, {} as Record<string, Branch>);
  }, [allUserBranches]);

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    return incidents.filter(i => {
      const branch = branchMap[i.branchId];
      if (!branch) return false;
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
    (incidents || []).forEach(incident => {
      if (branchMap[incident.branchId] && !branchesInFilter.has(incident.branchId)) {
        branchesInFilter.set(incident.branchId, branchMap[incident.branchId]);
      }
    });

    const branchesArray = Array.from(branchesInFilter.values());
    const uniqueCategories = ['all', ...Array.from(new Set((incidents || []).map(i => i.category).filter(Boolean)))];
    const uniqueStatuses = ['all', ...Array.from(new Set((incidents || []).map(i => i.status).filter(Boolean)))];
    const uniquePriorities = ['all', ...Array.from(new Set((incidents || []).map(i => i.priority).filter(Boolean)))];
    const uniqueRegions = ['all', ...Array.from(new Set(branchesArray.map(b => b.region).filter(Boolean)))];
    const uniqueBrands = ['all', ...Array.from(new Set(branchesArray.map(b => b.brand).filter(Boolean)))];
  
    return {
      categories: uniqueCategories,
      statuses: uniqueStatuses,
      priorities: uniquePriorities,
      regions: uniqueRegions,
      brands: uniqueBrands,
      branches: ['all', ...branchesArray],
    };
  }, [incidents, branchMap]);
  
  const sortedAndFilteredIncidents = useMemo(() => {
    return filteredIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredIncidents]);

  const totalLoading = isProfileLoading || isLoadingData;

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
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por región" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.regions.map(reg => (
                    <SelectItem key={reg as string} value={reg as string}>{reg === 'all' ? 'Todas las Regiones' : reg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por marca" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.brands.map(brand => (
                    <SelectItem key={brand as string} value={brand as string}>{brand === 'all' ? 'Todas las Marcas' : brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBranchId} onValueChange={setFilterBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tienda" />
                </SelectTrigger>
                <SelectContent>
                    {availableOptions.branches.map(branch => (
                        <SelectItem key={(branch as Branch)?.id || 'all'} value={(branch as Branch)?.id || 'all'}>
                            {branch === 'all' ? 'Todas las Tiendas' : (branch as Branch).name}
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
               <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.categories.map(cat => (
                    <SelectItem key={cat as string} value={cat as string}>{cat === 'all' ? 'Todas las Categorías' : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.statuses.map(stat => (
                    <SelectItem key={stat as string} value={stat as string}>{stat === 'all' ? 'Todos los Estados' : stat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                   {availableOptions.priorities.map(prio => (
                    <SelectItem key={prio as string} value={prio as string}>{prio === 'all' ? 'Todas las Prioridades' : (prio === 'High' ? 'Alta' : prio === 'Medium' ? 'Media' : 'Baja')}</SelectItem>
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
