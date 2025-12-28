import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { IncidentCategories, IncidentPriorities, IncidentStatuses } from '@/lib/types';
import { List } from 'lucide-react';

export default function SettingsPage() {
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
              <CardDescription>These are the categories users can select when reporting an incident.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {IncidentCategories.map(category => (
                <Badge key={category} variant="secondary" className="text-base">{category}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="priorities">
          <Card>
            <CardHeader>
              <CardTitle>Incident Priorities</CardTitle>
              <CardDescription>These are the priority levels for an incident.</CardDescription>
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
              <CardDescription>This is the lifecycle of an incident report.</CardDescription>
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
