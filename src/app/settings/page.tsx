'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { IncidentSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFirestore } from '@/firebase';
import { getIncidentSettings, addIncidentCategory, deleteIncidentCategory } from '@/lib/data';

const priorityTextMap: Record<string, string> = {
    Low: 'Baja',
    Medium: 'Media',
    High: 'Alta',
} as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<IncidentSettings | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAddCategory = async () => {
    if (!firestore || !settings) return;
    if (newCategory && !settings.categories.find(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
        setIsSaving(true);
        try {
            const addedCategory = await addIncidentCategory(firestore, newCategory);
            
            // Optimistic UI update
            setSettings(prevSettings => {
              if (!prevSettings) return null;
              const newCategories = [...prevSettings.categories, addedCategory].sort((a, b) => a.name.localeCompare(b.name));
              return { ...prevSettings, categories: newCategories };
            });

            setNewCategory('');
            toast({
                title: 'Categoría Agregada',
                description: `La categoría "${newCategory}" ha sido creada.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error al Guardar',
                description: 'No tienes permisos para agregar categorías.',
            });
            console.error("Error adding category:", error);
        } finally {
            setIsSaving(false);
        }
    } else if (settings.categories.find(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Categoría Duplicada',
            description: 'Esta categoría ya existe.',
        });
    }
  };

  const handleRemoveCategory = async (categoryId: string, categoryName: string) => {
    if (!firestore || !settings) return;
    
    // Optimistic UI update
    const originalSettings = settings;
    setSettings(prevSettings => {
        if (!prevSettings) return null;
        return {
            ...prevSettings,
            categories: prevSettings.categories.filter(c => c.id !== categoryId)
        };
    });

    try {
        await deleteIncidentCategory(firestore, categoryId);
        toast({
            title: 'Categoría Eliminada',
            description: `La categoría "${categoryName}" ha sido eliminada.`,
        });
    } catch (error) {
         // Revert on error
        setSettings(originalSettings);
        toast({
            variant: 'destructive',
            title: 'Error al Eliminar',
            description: 'No tienes permisos para eliminar categorías.',
        });
        console.error("Error deleting category:", error);
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
              <CardDescription>Agrega o elimina categorías que los usuarios pueden seleccionar al reportar una incidencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {settings.categories.map(category => (
                  <Badge key={category.id} variant="secondary" className="text-base pr-2">
                    {category.name}
                    <button 
                      onClick={() => handleRemoveCategory(category.id, category.name)} 
                      className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Eliminar {category.name}</span>
                    </button>
                  </Badge>
                ))}
                {settings.categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay categorías definidas.</p>
                )}
              </div>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  disabled={isSaving}
                />
                <Button type="button" onClick={handleAddCategory} disabled={isSaving || !newCategory}>
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
              <CardDescription>Estos son los niveles de prioridad para una incidencia. (Solo lectura)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {settings.priorities.map(priority => (
                <Badge key={priority.id} variant={
                  priority.name === 'High' ? 'destructive' : priority.name === 'Medium' ? 'default' : 'secondary'
                } className="text-base">{priorityTextMap[priority.name] || priority.name}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="statuses">
          <Card>
            <CardHeader>
              <CardTitle>Estados de Incidencias</CardTitle>
              <CardDescription>Este es el ciclo de vida de un reporte de incidencia. (Solo lectura)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {settings.statuses.map(status => (
                <Badge key={status.id} variant="secondary" className="text-base">{status.name}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
