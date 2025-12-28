'use client';

import { useState, useMemo } from 'react';
import type { Branch, Incident, IncidentStatus } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchCard } from './branch-card';
import { Input } from '../ui/input';
import { Search, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

interface DashboardClientProps {
  branches: Branch[];
  incidents: Incident[];
}

function getBranchStatus(branchIncidents: Incident[]): 'error' | 'warning' | 'ok' {
    const openIncidents = branchIncidents.filter((i) => i.status !== 'Resuelto');
    if (openIncidents.some((i) => i.priority === 'High')) {
      return 'error';
    }
    if (openIncidents.some((i) => i.priority === 'Medium')) {
      return 'warning';
    }
    return 'ok';
}

export function DashboardClient({ branches, incidents }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const brands = useMemo(() => ['all', ...Array.from(new Set(branches.map((b) => b.brand)))], [branches]);
  const regions = useMemo(() => ['all', ...Array.from(new Set(branches.map((b) => b.region)))], [branches]);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const brandMatch = selectedBrand === 'all' || branch.brand === selectedBrand;
      const regionMatch = selectedRegion === 'all' || branch.region === selectedRegion;
      const searchMatch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || branch.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return brandMatch && regionMatch && searchMatch;
    });
  }, [branches, selectedBrand, selectedRegion, searchTerm]);

  const { criticalCount, warningCount, operationalCount } = useMemo(() => {
    return branches.reduce(
      (acc, branch) => {
        const branchIncidents = incidents.filter((i) => i.branchId === branch.id);
        const status = getBranchStatus(branchIncidents);
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
  }, [branches, incidents]);

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-red-500/50 bg-red-500/10">
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
             <Card className="border-yellow-500/50 bg-yellow-500/10">
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
             <Card className="border-green-500/50 bg-green-500/10">
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
             <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Filtros</CardTitle>
                 </CardHeader>
                <CardContent className="space-y-2">
                    <div className='space-y-1'>
                        <Label htmlFor="brand-filter" className='text-xs'>Marca</Label>
                        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                        <SelectTrigger id="brand-filter" className="w-full h-8">
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
                     <div className='space-y-1'>
                        <Label htmlFor="region-filter" className='text-xs'>Región</Label>
                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger id="region-filter" className="w-full h-8">
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
                </CardContent>
            </Card>
      </div>

      {filteredBranches.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {filteredBranches.map((branch) => {
            const branchIncidents = incidents.filter((i) => i.branchId === branch.id);
            return <BranchCard key={branch.id} branch={branch} incidents={branchIncidents} />;
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No se encontraron sucursales.</p>
            <p>Intenta ajustar tu búsqueda o filtros.</p>
        </div>
      )}
    </div>
  );
}
