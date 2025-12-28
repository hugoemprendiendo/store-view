'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { IncidentCategories as defaultCategories, IncidentPriorities, IncidentStatuses } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
      toast({
        title: 'Categoría agregada',
        description: `"${newCategory}" ha sido agregada. Nota: Este es un cambio del lado del cliente y no persistirá.`,
      });
    } else if (categories.includes(newCategory)) {
      toast({
        variant: 'destructive',
        title: 'Categoría Duplicada',
        description: 'Esta categoría ya existe.',
      });
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
    toast({
        title: 'Categoría Eliminada',
        description: `"${categoryToRemove}" ha sido eliminada. Nota: Este es un cambio del lado del cliente y no persistirá.`,
    });
  };

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
                {categories.map(category => (
                  <Badge key={category} variant="secondary" className="text-base pr-2">
                    {category}
                    <button onClick={() => handleRemoveCategory(category)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <X className="h-3 w-3" />
                      <span className="sr-only">Eliminar {category}</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button type="button" onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
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
              {IncidentPriorities.map(priority => (
                <Badge key={priority} variant={
                  priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary'
                } className="text-base">{priority}</Badge>
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
              {IncidentStatuses.map(status => (
                <Badge key={status} variant="secondary" className="text-base">{status}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
