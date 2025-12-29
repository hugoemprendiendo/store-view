'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { IncidentSettings, IncidentCategory, IncidentPriority, IncidentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFirestore } from '@/firebase';
import { 
    getIncidentSettings, 
    addIncidentCategory, 
    deleteIncidentCategory,
    addIncidentPriority,
    deleteIncidentPriority,
    addIncidentStatus,
    deleteIncidentStatus
} from '@/lib/data';
import { Label } from '@/components/ui/label';

const priorityVariantMap: Record<string, 'secondary' | 'default' | 'destructive'> = {
    Low: 'secondary',
    Medium: 'default',
    High: 'destructive',
};

const priorityTextMap: Record<string, string> = {
    Low: 'Baja',
    Medium: 'Media',
    High: 'Alta',
} as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<IncidentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for new items
  const [newCategory, setNewCategory] = useState('');
  const [newPriorityName, setNewPriorityName] = useState('');
  const [newPriorityLevel, setNewPriorityLevel] = useState<number>(4);
  const [newStatus, setNewStatus] = useState('');


  const { toast } = useToast();
  const firestore = useFirestore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      if (!firestore) return;
      
      setIsLoading(true);
      try {
        const settingsData = await getIncidentSettings(firestore);
        setSettings(settingsData);
        // Set default new priority level
        const maxLevel = Math.max(0, ...settingsData.priorities.map(p => p.level));
        setNewPriorityLevel(maxLevel + 1);

      } catch (error: any) {
        console.error("Error fetching settings:", error);
        toast({
          variant: 'destructive',
          title: 'Error al Cargar',
          description: 'No se pudieron cargar los ajustes.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (isProfileLoading) return;

    if (!userProfile) {
      router.push('/login');
      return;
    }
    
    if (userProfile.role !== 'superadmin') {
      router.push('/');
      return;
    }
    
    loadData();
  }, [isProfileLoading, userProfile, firestore, router, toast]);

  // --- Category Handlers ---
  const handleAddCategory = async () => {
    if (!firestore || !settings || !newCategory.trim()) return;
    if (settings.categories.find(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
       toast({ variant: 'destructive', title: 'Categoría Duplicada', description: 'Esta categoría ya existe.' });
       return;
    }
    setIsSaving(true);
    try {
        const addedCategory = await addIncidentCategory(firestore, newCategory.trim());
        setSettings(prev => prev ? { ...prev, categories: [...prev.categories, addedCategory].sort((a,b) => a.name.localeCompare(b.name)) } : null);
        setNewCategory('');
        toast({ title: 'Categoría Agregada', description: `La categoría "${addedCategory.name}" ha sido creada.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error al Guardar', description: 'No se pudo agregar la categoría.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleRemoveCategory = async (category: IncidentCategory) => {
    if (!firestore || !settings) return;
    setSettings(prev => prev ? { ...prev, categories: prev.categories.filter(c => c.id !== category.id) } : null);
    try {
        await deleteIncidentCategory(firestore, category.id);
        toast({ title: 'Categoría Eliminada', description: `La categoría "${category.name}" ha sido eliminada.` });
    } catch (error) {
        setSettings(settings); // Revert on error
        toast({ variant: 'destructive', title: 'Error al Eliminar', description: 'No se pudo eliminar la categoría.' });
    }
  };

  // --- Priority Handlers ---
  const handleAddPriority = async () => {
    const name = newPriorityName.trim();
    if (!firestore || !settings || !name || !newPriorityLevel) return;
    if (settings.priorities.find(p => p.name.toLowerCase() === name.toLowerCase() || p.level === newPriorityLevel)) {
        toast({ variant: 'destructive', title: 'Prioridad Duplicada', description: 'Ya existe una prioridad con ese nombre o nivel.' });
        return;
    }
    setIsSaving(true);
    try {
        const addedPriority = await addIncidentPriority(firestore, { name, level: newPriorityLevel });
        setSettings(prev => prev ? { ...prev, priorities: [...prev.priorities, addedPriority].sort((a,b) => a.level - b.level) } : null);
        
        const maxLevel = Math.max(...(settings.priorities.map(p => p.level)), addedPriority.level);
        setNewPriorityLevel(maxLevel + 1);
        setNewPriorityName('');
        
        toast({ title: 'Prioridad Agregada' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error al Guardar', description: 'No se pudo agregar la prioridad.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleRemovePriority = async (priority: IncidentPriority) => {
    if (!firestore || !settings) return;
    const originalSettings = settings;
    setSettings(prev => prev ? { ...prev, priorities: prev.priorities.filter(p => p.id !== priority.id) } : null);
    try {
        await deleteIncidentPriority(firestore, priority.id);
        toast({ title: 'Prioridad Eliminada' });
    } catch (error) {
        setSettings(originalSettings);
        toast({ variant: 'destructive', title: 'Error al Eliminar', description: 'No se pudo eliminar la prioridad.' });
    }
  };
  
  // --- Status Handlers ---
  const handleAddStatus = async () => {
    const name = newStatus.trim();
    if (!firestore || !settings || !name) return;
    if (settings.statuses.find(s => s.name.toLowerCase() === name.toLowerCase())) {
       toast({ variant: 'destructive', title: 'Estado Duplicado', description: 'Este estado ya existe.' });
       return;
    }
    setIsSaving(true);
    try {
        const addedStatus = await addIncidentStatus(firestore, name);
        setSettings(prev => prev ? { ...prev, statuses: [...prev.statuses, addedStatus].sort((a,b) => a.name.localeCompare(b.name)) } : null);
        setNewStatus('');
        toast({ title: 'Estado Agregado' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error al Guardar', description: 'No se pudo agregar el estado.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleRemoveStatus = async (status: IncidentStatus) => {
    if (!firestore || !settings) return;
    const originalSettings = settings;
    setSettings(prev => prev ? { ...prev, statuses: prev.statuses.filter(s => s.id !== status.id) } : null);
    try {
        await deleteIncidentStatus(firestore, status.id);
        toast({ title: 'Estado Eliminado' });
    } catch (error) {
        setSettings(originalSettings);
        toast({ variant: 'destructive', title: 'Error al Eliminar', description: 'No se pudo eliminar el estado.' });
    }
  };
  
  if (isLoading || isProfileLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Header title="Configuración" />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'superadmin') {
      return null;
  }
  
  if (!settings) {
    return (
         <div className="flex flex-col gap-6">
            <Header title="Configuración" />
            <Card>
                <CardHeader>
                    <CardTitle>Cargando Configuración...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Si este mensaje persiste, por favor, recarga la página.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Header title="Configuración" />
      <p className="text-muted-foreground">Gestiona las opciones disponibles para el reporte de incidencias.</p>
      
      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="priorities">Prioridades</TabsTrigger>
          <TabsTrigger value="statuses">Estados</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Incidencias</CardTitle>
              <CardDescription>Agrega o elimina categorías que los usuarios pueden seleccionar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {settings.categories.map(category => (
                  <Badge key={category.id} variant="secondary" className="text-base pr-2">
                    {category.name}
                    <button onClick={() => handleRemoveCategory(category)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5" disabled={isSaving}>
                      <X className="h-3 w-3" />
                      <span className="sr-only">Eliminar {category.name}</span>
                    </button>
                  </Badge>
                ))}
                {settings.categories.length === 0 && <p className="text-sm text-muted-foreground">No hay categorías definidas.</p>}
              </div>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input type="text" placeholder="Nueva categoría" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} disabled={isSaving}/>
                <Button type="button" onClick={handleAddCategory} disabled={isSaving || !newCategory.trim()}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                   Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="priorities">
          <Card>
            <CardHeader>
              <CardTitle>Prioridades de Incidencias</CardTitle>
              <CardDescription>Define los niveles de prioridad y su orden.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex flex-wrap gap-2">
                    {settings.priorities.map(p => (
                    <Badge key={p.id} variant={priorityVariantMap[p.name] || 'secondary'} className="text-base pr-2">
                        {p.name} (Nivel {p.level})
                        <button onClick={() => handleRemovePriority(p)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5" disabled={isSaving}>
                        <X className="h-3 w-3" /><span className="sr-only">Eliminar {p.name}</span>
                        </button>
                    </Badge>
                    ))}
                 </div>
                 <div className="flex w-full max-w-md items-end space-x-2">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="new-priority-name">Nombre Prioridad</Label>
                        <Input id="new-priority-name" type="text" placeholder="Ej: Crítica" value={newPriorityName} onChange={(e) => setNewPriorityName(e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="grid w-24 items-center gap-1.5">
                        <Label htmlFor="new-priority-level">Nivel</Label>
                        <Input id="new-priority-level" type="number" placeholder="Ej: 4" value={newPriorityLevel} onChange={(e) => setNewPriorityLevel(Number(e.target.value))} disabled={isSaving} />
                    </div>
                    <Button type="button" onClick={handleAddPriority} disabled={isSaving || !newPriorityName.trim() || !newPriorityLevel}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span className="sr-only">Agregar</span>
                    </Button>
                 </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="statuses">
          <Card>
            <CardHeader>
              <CardTitle>Estados de Incidencias</CardTitle>
              <CardDescription>Define el ciclo de vida de un reporte de incidencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {settings.statuses.map(status => (
                    <Badge key={status.id} variant="secondary" className="text-base pr-2">
                        {status.name}
                        <button onClick={() => handleRemoveStatus(status)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5" disabled={isSaving}>
                        <X className="h-3 w-3" /><span className="sr-only">Eliminar {status.name}</span>
                        </button>
                    </Badge>
                    ))}
                </div>
                 <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input type="text" placeholder="Nuevo estado" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()} disabled={isSaving}/>
                    <Button type="button" onClick={handleAddStatus} disabled={isSaving || !newStatus.trim()}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Agregar
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
