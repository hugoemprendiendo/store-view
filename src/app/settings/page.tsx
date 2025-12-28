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
        title: 'Category Added',
        description: `"${newCategory}" has been added. Note: This is a client-side change and will not persist.`,
      });
    } else if (categories.includes(newCategory)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Category',
        description: 'This category already exists.',
      });
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
    toast({
        title: 'Category Removed',
        description: `"${categoryToRemove}" has been removed. Note: This is a client-side change and will not persist.`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Header title="Configuration" />
      <p className="text-muted-foreground">Manage the options available for incident reporting.</p>
      
      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Incident Categories</CardTitle>
              <CardDescription>Add or remove categories that users can select when reporting an incident.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge key={category} variant="secondary" className="text-base pr-2">
                    {category}
                    <button onClick={() => handleRemoveCategory(category)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {category}</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="text"
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button type="button" onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="priorities">
          <Card>
            <CardHeader>
              <CardTitle>Incident Priorities</CardTitle>
              <CardDescription>These are the priority levels for an incident. (Read-only)</CardDescription>
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
              <CardTitle>Incident Statuses</CardTitle>
              <CardDescription>This is the lifecycle of an incident report. (Read-only)</CardDescription>
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
