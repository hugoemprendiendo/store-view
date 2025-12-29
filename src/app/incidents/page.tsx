'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Branch, Incident } from '@/lib/types';
import { getBranchesByIds, getBranches, getIncidentsForUser, getIncidentsByBranch } from '@/lib/data';
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
  
  // Initial data load
  useEffect(() => {
    async function fetchInitialData() {
      if (isProfileLoading || !firestore || !userProfile) {
        if (!isProfileLoading) setIsLoadingData(false);
        return;
      }
      
      setIsLoadingData(true);
      const isSuperAdmin = userProfile.role === 'superadmin';
      const accessibleBranchIds = isSuperAdmin ? null : Object.keys(userProfile.assignedBranches || {});

      try {
        const branches = isSuperAdmin 
          ? await getBranches(firestore) 
          : await getBranchesByIds(firestore, accessibleBranchIds || []);
        
        setAllUserBranches(branches);

        // **CRUCIAL CHANGE**: If user is NOT a superadmin, fetch their incidents right away.
        if (!isSuperAdmin && accessibleBranchIds && accessibleBranchIds.length > 0) {
            const userIncidents = await getIncidentsForUser(firestore, accessibleBranchIds);
            setIncidents(userIncidents);
        }

      } catch (error) {
        console.error("Error fetching initial data for incidents page:", error);
        setAllUserBranches([]);
        setIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchInitialData();
  }, [firestore, userProfile, isProfileLoading]);

  // Effect to fetch incidents when a specific branch is selected (for SUPERADMIN)
  useEffect(() => {
      async function fetchIncidentsForBranch() {
          if (!firestore || filterBranchId === 'all') {
              if (userProfile?.role === 'superadmin') setIncidents([]);
              return;
          }
          setIsLoadingData(true);
          try {
              const incidentsData = await getIncidentsByBranch(firestore, filterBranchId);
              setIncidents(incidentsData);
          } catch(e) {
              console.error(`Failed to fetch incidents for branch ${filterBranchId}`, e);
              setIncidents([]);
          } finally {
              setIsLoadingData(false);
          }
      }
      
      // This effect should now only run for superadmins when they change the filter
      if (userProfile?.role === 'superadmin') {
          fetchIncidentsForBranch();
      }
  }, [filterBranchId, firestore, userProfile?.role]);


  // --- Filtering Logic ---

  const branchMap = useMemo(() => {
    return allUserBranches.reduce((acc, branch) => {
        acc[branch.id] = branch;
        return acc;
    }, {} as Record<string, Branch>);
  }, [allUserBranches]);

  const filteredIncidents = useMemo(() => {
    // For non-superadmin, filterBranchId is not used to fetch data, but can be used to filter the already fetched incidents.
    const incidentsToFilter = userProfile?.role === 'superadmin' 
        ? incidents 
        : incidents.filter(i => filterBranchId === 'all' || i.branchId === filterBranchId);

    return incidentsToFilter.filter(i => {
      const branch = branchMap[i.branchId];
      if (!branch) return false;
      return (
        (filterCategory === 'all' || i.category === filterCategory) &&
        (filterStatus === 'all' || i.status === filterStatus) &&
        (filterPriority === 'all' || i.priority === filterPriority) &&
        (filterRegion === 'all' || branch.region === filterRegion) &&
        (filterBrand === 'all' || branch.brand === filterBrand)
      );
    });
  }, [incidents, filterCategory, filterStatus, filterPriority, filterRegion, filterBrand, filterBranchId, branchMap, userProfile?.role]);

  const availableOptions = useMemo(() => {
    const branchesInFilter = allUserBranches;
    const incidentsForOptions = userProfile?.role === 'superadmin' ? incidents : (incidents || []);
    
    const uniqueCategories = ['all', ...Array.from(new Set(incidentsForOptions.map(i => i.category).filter(Boolean)))];
    const uniqueStatuses = ['all', ...Array.from(new Set(incidentsForOptions.map(i => i.status).filter(Boolean)))];
    const uniquePriorities = ['all', ...Array.from(new Set(incidentsForOptions.map(i => i.priority).filter(Boolean)))];
    const uniqueRegions = ['all', ...Array.from(new Set(branchesInFilter.map(b => b.region).filter(Boolean)))];
    const uniqueBrands = ['all', ...Array.from(new Set(branchesInFilter.map(b => b.brand).filter(Boolean)))];
  
    return {
      categories: uniqueCategories,
      statuses: uniqueStatuses,
      priorities: uniquePriorities,
      regions: uniqueRegions,
      brands: uniqueBrands,
      branches: ['all', ...branchesInFilter],
    };
  }, [incidents, allUserBranches, userProfile?.role]);
  
  const sortedAndFilteredIncidents = useMemo(() => {
    return filteredIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredIncidents]);

  const totalLoading = isProfileLoading || isLoadingData;

  const showIncidentsTable = userProfile?.role !== 'superadmin' || filterBranchId !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <Header title="Todas las Incidencias" />
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Incidencias</CardTitle>
          <CardDescription>
            {userProfile?.role === 'superadmin' 
              ? "Usa los filtros para encontrar incidencias específicas. Debes seleccionar una tienda para ver sus incidencias."
              : "Tus incidencias se muestran a continuación. Usa los filtros para refinar los resultados."
            }
          </CardDescription>
           <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
              <Select value={filterRegion} onValueChange={v => { setFilterRegion(v); if(userProfile?.role === 'superadmin') setFilterBranchId('all'); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por región" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.regions.map(reg => (
                    <SelectItem key={reg as string} value={reg as string}>{reg === 'all' ? 'Todas las Regiones' : reg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={filterBrand} onValueChange={v => { setFilterBrand(v); if(userProfile?.role === 'superadmin') setFilterBranchId('all'); }}>
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
                  <SelectValue placeholder={userProfile?.role === 'superadmin' ? 'Selecciona una tienda' : 'Filtrar por tienda'} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        {userProfile?.role === 'superadmin' ? 'Selecciona una tienda para ver' : 'Todas mis tiendas'}
                    </SelectItem>
                    {availableOptions.branches.filter(b => b !== 'all').map(branch => {
                        const b = branch as Branch;
                        const regionMatch = filterRegion === 'all' || b.region === filterRegion;
                        const brandMatch = filterBrand === 'all' || b.brand === filterBrand;
                        if(regionMatch && brandMatch) {
                            return <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        }
                        return null;
                    })}
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
            {totalLoading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : showIncidentsTable ? (
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
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>Por favor, selecciona una tienda para ver las incidencias.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
