'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Branch } from '@/lib/types';
import { getBranches, getBranchesByIds } from '@/lib/data';
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
import { useFirestore, useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, where, getDocs } from 'firebase/firestore';


export default function BranchesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    async function fetchData() {
      if (!firestore || !userProfile) return;
      setIsLoading(true);
      
      let branchesData: Branch[];
      if (userProfile.role === 'superadmin') {
        // Superadmin uses the existing `getBranches` which fetches all documents.
        // The security rules allow this with `allow list`.
        branchesData = await getBranches(firestore);
      } else if (userProfile.assignedBranches && userProfile.assignedBranches.length > 0) {
        // Regular users must fetch only the documents they have access to.
        // We use `getBranchesByIds` which performs a `where in` query.
        // Our rules allow this because `allow get` is checked for each document ID.
        branchesData = await getBranchesByIds(firestore, userProfile.assignedBranches);
      } else {
        branchesData = [];
      }
      
      setBranches(branchesData);
      setIsLoading(false);
    }

    if (!isUserLoading && !isProfileLoading) {
        fetchData();
    }
  }, [firestore, user, userProfile, isUserLoading, isProfileLoading]);

  const regions = useMemo(() => {
    return ['all', ...Array.from(new Set(branches.map((b) => b.region)))];
  }, [branches]);

  const filteredBranches = useMemo(() => {
    if (selectedRegion === 'all') {
      return branches;
    }
    return branches.filter((branch) => branch.region === selectedRegion);
  }, [branches, selectedRegion]);

  const totalLoading = isLoading || isUserLoading || isProfileLoading;

  if (totalLoading) {
      return (
          <div className="flex flex-col gap-6">
              <Header title="Sucursales" />
              <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <Header title="Sucursales" />
      <Card>
        <CardHeader>
          <CardTitle>Mis sucursales</CardTitle>
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
                {filteredBranches.length > 0 ? filteredBranches.map((branch) => (
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No tienes sucursales asignadas.
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
