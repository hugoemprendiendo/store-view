'use client';
// @ts-nocheck

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { IncidentCategories, IncidentPriorities, IncidentStatuses } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import React from 'react';
import type { AnalyzeIncidentReportOutput } from '@/ai/flows/analyze-incident-report';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const incidentSchema = z.object({
  branchId: z.string().min(1, 'La sucursal es obligatoria.'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
  audioTranscription: z.string().optional(),
  photoUrl: z.string().optional(),
  category: z.string().min(1, 'La categoría es obligatoria.'),
  priority: z.enum(IncidentPriorities),
  status: z.enum(IncidentStatuses).default('Abierto'),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface IncidentReviewFormProps {
  initialData: AnalyzeIncidentReportOutput & {
    photoUrl?: string;
    audioTranscription?: string;
  };
}

// Helper function to find a value in an array, ignoring case.
const findCaseInsensitive = (array: readonly string[], value: string): string | undefined => {
  if (!value) return undefined;
  return array.find(item => item.toLowerCase() === value.toLowerCase());
}

export function IncidentReviewForm({ initialData }: IncidentReviewFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const branchId = searchParams.get('branchId');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      branchId: branchId || '',
      title: initialData.suggestedTitle || '',
      category: findCaseInsensitive(IncidentCategories, initialData.suggestedCategory) || '',
      priority: (findCaseInsensitive(IncidentPriorities, initialData.suggestedPriority as any) as any) || 'Medium',
      status: 'Abierto',
      description: initialData.suggestedDescription || '',
      audioTranscription: initialData.audioTranscription || '',
      photoUrl: initialData.photoUrl,
    },
  });

  const onSubmit = async (data: IncidentFormValues) => {
    setIsSubmitting(true);
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se puede conectar a la base de datos.' });
        setIsSubmitting(false);
        return;
    }
    if (!data.branchId) {
      toast({
        variant: 'destructive',
        title: 'Falta Sucursal',
        description: 'Por favor, selecciona primero una sucursal desde el panel de control o la página de sucursales.',
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
        const incidentsCol = collection(firestore, 'incidents');
        
        const incidentToCreate = {
            ...data,
            photoHint: 'user uploaded',
            createdAt: new Date().toISOString(),
        };

        // Remove any undefined fields before sending to Firestore
        Object.keys(incidentToCreate).forEach(key => {
            if (incidentToCreate[key] === undefined) {
                delete incidentToCreate[key];
            }
        });

        await addDoc(incidentsCol, incidentToCreate);
      
        toast({
            title: 'Incidencia Reportada',
            description: 'La nueva incidencia ha sido creada exitosamente.',
        });
        router.push(`/branches/${data.branchId}`);

    } catch (error) {
        console.error("Error in createIncident action:", error);
        toast({
            variant: 'destructive',
            title: 'Envío Fallido',
            description: 'No se pudo crear la incidencia.',
        });
    }

    setIsSubmitting(false);
  };
  
  const isBusy = isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej., Fuga de agua en pasillo 3" {...field} disabled={isBusy} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Sugerida por la IA</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Una descripción detallada de la incidencia..." {...field} className="h-[200px]" disabled={isBusy} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IncidentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IncidentPriorities.map((p) => (
                        <SelectItem key={p} value={p}>{p === 'High' ? 'Alta' : p === 'Medium' ? 'Media' : 'Baja'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end items-center flex-wrap gap-4">
          <Button type="submit" disabled={isBusy || !firestore}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Incidencia
          </Button>
        </div>
      </form>
    </Form>
  );
}
