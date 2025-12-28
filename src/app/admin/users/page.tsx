'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { UserProfile, Branch } from '@/lib/types';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Pencil } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { getBranches } from '@/lib/data';
import { ManageUserBranchesDialog } from '@/components/admin/manage-user-branches-dialog';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isProfileLoading) {
      if (!userProfile || userProfile.role !== 'superadmin') {
        router.push('/');
        return;
      }

      async function fetchData() {
        if (!firestore) return;
        setIsLoading(true);
        try {
          const [usersSnapshot, branchesData] = await Promise.all([
            getDocs(collection(firestore, 'users')),
            getBranches(firestore),
          ]);

          const usersList = usersSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as UserProfile)
          );

          setUsers(usersList);
          setBranches(branchesData);
        } catch (error) {
          console.error("Error fetching users or branches: ", error);
        } finally {
          setIsLoading(false);
        }
      }

      fetchData();
    }
  }, [firestore, isProfileLoading, userProfile, router]);
  
  const totalLoading = isLoading || isProfileLoading;

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  if (totalLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Header title="Usuarios" />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (userProfile?.role !== 'superadmin') {
     return (
        <div className="flex flex-col gap-4">
            <Header title="Acceso Denegado" />
            <div className="flex flex-col items-center justify-center gap-6 rounded-lg border bg-card text-card-foreground shadow-sm p-10 text-center">
                <ShieldAlert className="size-16 text-destructive" />
                <h2 className="text-2xl font-bold">Acceso Restringido</h2>
                <p className="text-muted-foreground">
                    No tienes permisos de superadministrador para ver esta página.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header title="Administración de Usuarios" />
      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>
            Una lista de todos los usuarios registrados en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sucursales Asignadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'superadmin' ? 'default' : 'secondary'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === 'superadmin' ? (
                        <Badge variant="outline">Todas</Badge>
                    ) : (
                        <Badge variant="secondary">{user.assignedBranches?.length || 0}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== 'superadmin' && (
                        <ManageUserBranchesDialog user={user} allBranches={branches} onUserUpdate={handleUserUpdate}>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Gestionar Sucursales
                            </Button>
                        </ManageUserBranchesDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
