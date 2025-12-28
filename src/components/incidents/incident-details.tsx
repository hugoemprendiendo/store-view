'use client';
// @ts-nocheck

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Incident, Branch } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Building, Calendar, Layers, Shield, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateIncidentStatus } from '@/app/actions';
import Link from 'next/link';

interface IncidentDetailsProps {
  incident: Incident;
  branch: Branch;
}

const priorityVariantMap = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
} as const;

const priorityTextMap = {
    Low: 'Baja',
    Medium: 'Media',
    High: 'Alta',
} as const;

export default function IncidentDetails({ incident: initialIncident, branch }: IncidentDetailsProps) {
    const [incident, setIncident] = useState(initialIncident);
    const [selectedStatus, setSelectedStatus] = useState(incident.status);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleStatusUpdate = async () => {
        setIsUpdating(true);
        const result = await updateIncidentStatus(incident.id, selectedStatus);
        if (result.success && result.data) {
            setIncident(result.data);
            toast({
                title: 'Estado Actualizado',
                description: `El estado de la incidencia cambió a "${selectedStatus}".`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Actualización Fallida',
                description: result.error,
            });
            setSelectedStatus(incident.status); // Revert UI
        }
        setIsUpdating(false);
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{incident.title}</CardTitle>
                        <CardDescription>
                            <Link href={`/branches/${branch.id}`} className="hover:underline flex items-center gap-2">
                                <Building className="size-4" />
                                {branch.name}
                            </Link>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {incident.photoUrl && (
                            <div className="relative h-96 w-full rounded-lg overflow-hidden mb-6 border">
                                <Image
                                    src={incident.photoUrl}
                                    alt={incident.title}
                                    fill
                                    className="object-contain"
                                    data-ai-hint={incident.photoHint}
                                    sizes="(max-width: 768px) 100vw, 66vw"
                                />
                            </div>
                        )}
                        {incident.description && (
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="font-semibold">Descripción</h3>
                                <p>{incident.description}</p>
                            </div>
                        )}
                        {incident.audioTranscription && (
                            <div className="prose dark:prose-invert max-w-none mt-4">
                                <h3 className="font-semibold">Transcripción de Audio</h3>
                                <blockquote className="border-l-2 pl-4 italic">{incident.audioTranscription}</blockquote>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Propiedades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <Badge variant={priorityVariantMap[incident.priority]} className="text-sm">Prioridad {priorityTextMap[incident.priority]}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Layers className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span>Categoría: <span className="font-medium">{incident.category}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span>Estado: <span className="font-medium">{incident.status}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span>Reportado el {format(new Date(incident.createdAt), 'PPpp')}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Actualizar Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Incident['status'])} disabled={isUpdating}>
                            <SelectTrigger>
                                <SelectValue placeholder="Cambiar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Abierto">Abierto</SelectItem>
                                <SelectItem value="En Progreso">En Progreso</SelectItem>
                                <SelectItem value="Resuelto">Resuelto</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleStatusUpdate} disabled={isUpdating || selectedStatus === incident.status} className="w-full">
                            {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
