'use client';

import { useState, useMemo } from 'react';
import type { Branch, Incident } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchCard } from './branch-card';
import { AlertTriangle, ShieldCheck, ShieldAlert, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

interface DashboardClientProps {
  branches: Branch[];
  incidents: Incident[];
}

type StatusFilter = 'error' | 'warning' | 'ok' | 'all';

function getBranchStatus(branchIncidents: Incident[]): 'error' | 'warning' | 'ok' {
    // If we have no incident data for a branch (e.g., for regular users on the dashboard), default to 'ok'
    if (branchIncidents.length === 0) {
      return 'ok';
    }
    const hasOpen = branchIncidents.some((i) => i.status === 'Abierto');
    const hasInProgress = branchIncidents.some((i) => i.status === 'En Progreso');

    if (hasOpen) {
        return 'error';
    }
    if (hasInProgress) {
        return 'warning';
    }
    return 'ok';
}

export function DashboardClient({ branches, incidents }: DashboardClientProps) {
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const brands = useMemo(() => ['all', ...Array.from(new Set(branches.map((b) => b.brand)))], [branches]);
  const regions = useMemo(() => ['all', ...Array.from(new Set(branches.map((b) => b.region)))], [branches]);

  const branchesWithStatus = useMemo(() => {
    return branches.map(branch => {
        const branchIncidents = incidents.filter(i => i.branchId === branch.id);
        return {
            branch,
            status: getBranchStatus(branchIncidents)
        };
    });
  }, [branches, incidents]);

  const filteredBranches = useMemo(() => {
    return branchesWithStatus.filter(({ branch, status }) => {
      const brandMatch = selectedBrand === 'all' || branch.brand === selectedBrand;
      const regionMatch = selectedRegion === 'all' || branch.region === selectedRegion;
      const statusMatch = selectedStatus === 'all' || status === selectedStatus;
      return brandMatch && regionMatch && statusMatch;
    });
  }, [branchesWithStatus, selectedBrand, selectedRegion, selectedStatus]);

  const { criticalCount, warningCount, operationalCount } = useMemo(() => {
    return branchesWithStatus.reduce(
      (acc, { status }) => {
        if (status === 'error') {
          acc.criticalCount++;
        } else if (status === 'warning') {
          acc.warningCount++;
        } else {
          acc.operationalCount++;
        }
        return acc;
      },
      { criticalCount: 0, warningCount: 0, operationalCount: 0 }
    );
  }, [branchesWithStatus]);

  const handleStatusSelect = (status: StatusFilter) => {
    setSelectedStatus(prevStatus => prevStatus === status ? 'all' : status);
  }

  const handleShowAll = () => {
    setSelectedStatus('all');
    setSelectedBrand('all');
    setSelectedRegion('all');
  };

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className={cn("cursor-pointer transition-shadow hover:shadow-md", selectedStatus === 'error' && 'ring-2 ring-red-500')}
              onClick={() => handleStatusSelect('error')}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Crítico</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-800 dark:text-red-200">{criticalCount}</div>
                    <p className="text-xs text-red-700 dark:text-red-300">
                        tiendas requieren atención inmediata
                    </p>
                </CardContent>
            </Card>
             <Card 
                className={cn("cursor-pointer transition-shadow hover:shadow-md", selectedStatus === 'warning' && 'ring-2 ring-yellow-500')}
                onClick={() => handleStatusSelect('warning')}
             >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Advertencia</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{warningCount}</div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        tiendas tienen advertencias abiertas
                    </p>
                </CardContent>
            </Card>
             <Card 
                className={cn("cursor-pointer transition-shadow hover:shadow-md", selectedStatus === 'ok' && 'ring-2 ring-green-500')}
                onClick={() => handleStatusSelect('ok')}
             >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Operacional</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">{operationalCount}</div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                        tiendas funcionan sin problemas
                    </p>
                </CardContent>
            </Card>
             <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={handleShowAll}
             >
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Sucursales</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                 </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{branches.length}</div>
                    <p className="text-xs text-muted-foreground">
                        {brands.length > 1 ? `${brands.length - 1} marcas en ` : ''} {regions.length > 1 ? `${regions.length -1} regiones` : ''}
                    </p>
                </CardContent>
            </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vista de Sucursales</CardTitle>
           <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                  <Label htmlFor="brand-filter" className='text-xs font-normal'>Marca</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger id="brand-filter" className="w-full">
                      <SelectValue placeholder="Filtrar por marca..." />
                  </SelectTrigger>
                  <SelectContent>
                      {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                          {brand === 'all' ? 'Todas las marcas' : brand}
                      </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>
              <div>
                  <Label htmlFor="region-filter" className='text-xs font-normal'>Región</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger id="region-filter" className="w-full">
                      <SelectValue placeholder="Filtrar por región..." />
                  </SelectTrigger>
                  <SelectContent>
                      {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                          {region === 'all' ? 'Todas las regiones' : region}
                      </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
            {filteredBranches.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {filteredBranches.map(({ branch }) => {
                    // We can no longer reliably pass incidents here for regular users,
                    // so we pass an empty array to BranchCard. The card will determine status.
                    const branchIncidents = incidents.filter(i => i.branchId === branch.id);
                    return <BranchCard key={branch.id} branch={branch} incidents={branchIncidents} />;
                })}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">No se encontraron sucursales.</p>
                    <p>Intenta ajustar tu búsqueda o filtros.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
