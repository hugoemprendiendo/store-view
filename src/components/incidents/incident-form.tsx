'use client';
// @ts-nocheck

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createIncident } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { IncidentCategories, IncidentPriorities } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import React from 'react';
import type { AnalyzeIncidentReportOutput } from '@/ai/flows/analyze-incident-report';

const incidentSchema = z.object({
  branchId: z.string().min(1, 'Branch is required.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  audioTranscription: z.string().optional(),
  photo: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  priority: z.enum(IncidentPriorities),
  status: z.string().default('Open'),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface IncidentReviewFormProps {
  initialData: AnalyzeIncidentReportOutput & {
    photoUrl?: string;
    audioTranscription?: string;
  };
}

export function IncidentReviewForm({ initialData }: IncidentReviewFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const branchId = searchParams.get('branchId');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      branchId: branchId || '',
      title: initialData.suggestedTitle || '',
      category: IncidentCategories.includes(initialData.suggestedCategory) ? initialData.suggestedCategory : '',
      priority: IncidentPriorities.includes(initialData.suggestedPriority as any) ? initialData.suggestedPriority as any : 'Medium',
      status: 'Open',
      description: initialData.suggestedDescription || '',
      audioTranscription: initialData.audioTranscription || '',
      photo: initialData.photoUrl,
    },
  });

  const onSubmit = async (data: IncidentFormValues) => {
    setIsSubmitting(true);
    if (!data.branchId) {
      toast({
        variant: 'destructive',
        title: 'Missing Branch',
        description: 'Please select a branch from the dashboard or branch page first.',
      });
      setIsSubmitting(false);
      return;
    }
    const result = await createIncident(data);
    if (result.success) {
      toast({
        title: 'Incident Reported',
        description: 'The new incident has been successfully created.',
      });
      router.push(`/branches/${data.branchId}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error,
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Water Leak in Aisle 3" {...field} disabled={isBusy} />
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
                  <FormLabel>Text Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A detailed text description of the incident..." {...field} className="h-[200px]" disabled={isBusy} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.getValues('audioTranscription') && (
              <FormField
                control={form.control}
                name="audioTranscription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio Transcription</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your recorded audio will be transcribed here." {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IncidentPriorities.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
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
          <Button type="submit" disabled={isBusy}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Incident
          </Button>
        </div>
      </form>
    </Form>
  );
}
