'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Branch, UserProfile } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { Input } from '../ui/input';

interface ManageUserBranchesDialogProps {
  user: UserProfile;
  allBranches: Branch[];
  children: React.ReactNode;
  onUserUpdate: (updatedUser: UserProfile) => void;
}

export function ManageUserBranchesDialog({ user, allBranches, children, onUserUpdate }: ManageUserBranchesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleCheckboxChange = (branchId: string, checked: boolean) => {
    const newSelection = { ...selectedBranches };
    if (checked) {
      newSelection[branchId] = true;
    } else {
      delete newSelection[branchId];
    }
    setSelectedBranches(newSelection);
  };

  const handleSave = async () => {
    if (!firestore) return;

    setIsSubmitting(true);
    const userRef = doc(firestore, 'users', user.id);

    try {
      // **LA CORRECCIÓN CLAVE:**
      // Usamos setDoc con { merge: true } sobre el documento, pero la clave que actualizamos
      // es `assignedBranches`, y la sobrescribimos por completo con el nuevo mapa.
      // Esto elimina la estructura de array antigua y la reemplaza con el mapa limpio.
      const dataToSave = { assignedBranches: selectedBranches };
      
      await setDoc(userRef, dataToSave, { merge: true });
      
      const updatedUser: UserProfile = { 
        ...user, 
        ...dataToSave
      };
      
      onUserUpdate(updatedUser);

      toast({
        title: 'Usuario Actualizado',
        description: `Se actualizaron las sucursales para ${user.name}.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating user branches:", error);
      toast({
        variant: 'destructive',
        title: 'Error al Actualizar',
        description: 'No se pudieron guardar los cambios. Revisa los permisos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Al abrir, filtramos el objeto `assignedBranches` para asegurarnos
      // de que solo trabajamos con entradas válidas (booleano true), ignorando el array.
      const validBranches: Record<string, boolean> = {};
      if (user.assignedBranches && typeof user.assignedBranches === 'object') {
          for (const key in user.assignedBranches) {
              // Solo nos quedamos con las claves que son branch IDs y tienen valor `true`.
              if (user.assignedBranches[key] === true) {
                  validBranches[key] = true;
              }
          }
      }
      setSelectedBranches(validBranches);
      setSearchTerm('');
    }
    setIsOpen(open);
  };

  const filteredBranches = allBranches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}>
            {children}
        </div>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Gestionar Sucursales para {user.name}</DialogTitle>
                <DialogDescription>
                    Selecciona las sucursales a las que este usuario tendrá acceso.
                </DialogDescription>
            </DialogHeader>
            
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre o región..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4 space-y-2">
                {filteredBranches.length > 0 ? filteredBranches.map((branch) => (
                    <div key={branch.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`branch-${branch.id}`}
                            checked={!!selectedBranches[branch.id]}
                            onCheckedChange={(checked) => handleCheckboxChange(branch.id, !!checked)}
                        />
                        <Label htmlFor={`branch-${branch.id}`} className="font-normal cursor-pointer">
                            {branch.name} <span className="text-muted-foreground">({branch.region})</span>
                        </Label>
                    </div>
                )) : (
                    <p className="text-center text-sm text-muted-foreground py-4">No se encontraron sucursales.</p>
                )}
                </div>
            </ScrollArea>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
