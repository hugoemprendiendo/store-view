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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
    // This effect handles loading data and permissions.
    const loadData = async () => {
      // Wait until both user profile is loaded and firestore is available.
      if (isProfileLoading || !firestore) {
        return; // Exit early if we don't have what we need.
      }

      // If loading is finished and there's no profile, or the role is not superadmin, redirect.
      if (!userProfile || userProfile.role !== 'superadmin') {
        router.push('/');
        setIsLoading(false); // Stop loading and finish.
        return;
      }

      // If we are here, we are a superadmin. Try to fetch the settings.
      const settingsRef = doc(firestore, 'app_settings', 'incident_config');
      try {
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as IncidentSettings);
        } else {
           console.warn('Settings document not found. A superadmin should be able to create it.');
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        // Create and throw the detailed error for debugging
        const permissionError = new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'get',
        });
        throw permissionError;
      } finally {
        setIsLoading(false); // Ensure loading is always stopped.
      }
    };
    
    loadData();
  }, [isProfileLoading, userProfile, firestore, router, toast]);

  const handleSaveCategories = async (newCategories: string[]) => {
    if (!firestore || !settings) return;
    
    setIsSaving(true);
    const updatedSettings = { ...settings, categories: newCategories };
    
    const settingsRef = doc(firestore, 'app_settings', 'incident_config');
    
    setDoc(settingsRef, updatedSettings, { merge: true }).then(() => {
        setSettings(updatedSettings);
        toast({
            title: 'Categorías guardadas',
            description: 'La lista de categorías ha sido actualizada.',
        });
    }).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: settingsRef.path,
            operation: 'update',
            requestResourceData: updatedSettings,
        });
        errorEmitter.emit('permission-error', permissionError);
        
        toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No tienes permisos para guardar las categorías.',
        });
        console.error("Error saving categories:", error);
    }).finally(() => {
        setIsSaving(false);
    });
  };

  const handleAddCategory = () => {
    if (!settings) return;
    if (newCategory && !settings.categories.includes(newCategory)) {
      const newCategories = [...settings.categories, newCategory];
      handleSaveCategories(newCategories);
      setNewCategory('');
    } else if (settings.categories.includes(newCategory)) {
      toast({
        variant: 'destructive',
        title: 'Categoría Duplicada',
        description: 'Esta categoría ya existe.',
      });
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    if (!settings) return;
    const newCategories = settings.categories.filter(category => category !== categoryToRemove);
    handleSaveCategories(newCategories);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Header title="Configuración" />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // If loading is complete but there's no profile or the user is not an admin,
  // we show nothing, as the redirect is already happening.
  if (!userProfile || userProfile.role !== 'superadmin') {
      return null;
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
                {settings && settings.categories.map(category => (
                  <Badge key={category} variant="secondary" className="text-base pr-2">
                    {category}
                    <button 
                      onClick={() => handleRemoveCategory(category)} 
                      className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Eliminar {category}</span>
                    </button>
                  </Badge>
                ))}
                {settings && settings.categories.length === 0 && (
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
              {settings && settings.priorities.map(priority => (
                <Badge key={priority} variant={
                  priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary'
                } className="text-base">{priorityTextMap[priority] || priority}</Badge>
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
              {settings && settings.statuses.map(status => (
                <Badge key={status} variant="secondary" className="text-base">{status}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
