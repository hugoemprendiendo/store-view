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
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

interface DashboardClientProps {
  branches: Branch[];
  incidents: Incident[];
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
      const searchMatch = branch.name.toLowerCase().includes(searchTerm.toLowerCase());
      return brandMatch && regionMatch && searchMatch;
    });
  }, [branches, selectedBrand, selectedRegion, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
                placeholder="Search branches..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-4">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
                {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                    {brand === 'all' ? 'All Brands' : brand}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
                {regions.map((region) => (
                <SelectItem key={region} value={region}>
                    {region === 'all' ? 'All Regions' : region}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </div>

      {filteredBranches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBranches.map((branch) => {
            const branchIncidents = incidents.filter((i) => i.branchId === branch.id);
            return <BranchCard key={branch.id} branch={branch} incidents={branchIncidents} />;
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No branches found.</p>
            <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
