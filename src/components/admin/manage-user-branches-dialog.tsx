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
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Branch, UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ManageUserBranchesDialogProps {
  user: UserProfile;
  allBranches: Branch[];
  children: React.ReactNode;
  onUserUpdate: (updatedUser: UserProfile) => void;
}

export function ManageUserBranchesDialog({ user, allBranches, children, onUserUpdate }: ManageUserBranchesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Selections are now a map: { [branchId]: true }
  const [selectedBranches, setSelectedBranches] = useState<Record<string, boolean>>(user.assignedBranches || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      // Save the new map of branches
      await updateDoc(userRef, {
        assignedBranches: selectedBranches
      });
      
      const updatedUser = { ...user, assignedBranches: selectedBranches };
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
        description: 'No se pudieron guardar los cambios.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset state when opening the dialog
      setSelectedBranches(user.assignedBranches || {});
    }
    setIsOpen(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}>
            {children}
        </div>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Gestionar Sucursales para {user.name}</DialogTitle>
            <DialogDescription>
                Selecciona las sucursales a las que este usuario tendrá acceso.
            </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4 space-y-2">
                {allBranches.map((branch) => (
                    <div key={branch.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`branch-${branch.id}`}
                            checked={!!selectedBranches[branch.id]}
                            onCheckedChange={(checked) => handleCheckboxChange(branch.id, !!checked)}
                        />
                        <Label htmlFor={`branch-${branch.id}`} className="font-normal">
                            {branch.name} <span className="text-muted-foreground">({branch.region})</span>
                        </Label>
                    </div>
                ))}
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
