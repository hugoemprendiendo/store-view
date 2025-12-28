'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Branch } from '@/lib/types';
import { getBranches } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';

export default function BranchesPage() {
  const firestore = useFirestore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const branchesData = await getBranches(firestore);
      setBranches(branchesData);
      setIsLoading(false);
    }
    fetchData();
  }, [firestore]);

  const regions = useMemo(() => {
    return ['all', ...Array.from(new Set(branches.map((b) => b.region)))];
  }, [branches]);

  const filteredBranches = useMemo(() => {
    if (selectedRegion === 'all') {
      return branches;
    }
    return branches.filter((branch) => branch.region === selectedRegion);
  }, [branches, selectedRegion]);

  return (
    <div className="flex flex-col gap-6">
      <Header title="Sucursales" />
      <Card>
        <CardHeader>
          <CardTitle>Todas las sucursales</CardTitle>
          <div className="pt-4">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full md:w-[280px]">
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.brand}</TableCell>
                    <TableCell>{branch.region}</TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/branches/${branch.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver Sucursal</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
