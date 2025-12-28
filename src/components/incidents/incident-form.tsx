'use client';
// @ts-nocheck

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAIAnalysis, createIncident } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { IncidentCategories, IncidentPriorities } from '@/lib/types';
import { Wand2, Loader2, Send } from 'lucide-react';
import React from 'react';

const incidentSchema = z.object({
  branchId: z.string().min(1, 'Branch is required.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  photo: z.any().optional(),
  audioTranscription: z.string().optional(),
  textDescription: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  priority: z.enum(IncidentPriorities),
  status: z.string().default('Open'),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

const fileToDataURI = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
});

export function IncidentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const branchId = searchParams.get('branchId');

  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      branchId: branchId || '',
      title: '',
      audioTranscription: '',
      textDescription: '',
      category: '',
      priority: 'Medium',
      status: 'Open',
    },
  });
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const { photo, audioTranscription, textDescription } = form.getValues();
    let photoDataUri: string | undefined;

    if (photo && photo[0]) {
      try {
        photoDataUri = await fileToDataURI(photo[0]);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error reading file',
          description: 'Could not process the uploaded photo.',
        });
        setIsAnalyzing(false);
        return;
      }
    }

    const result = await getAIAnalysis({
        photoDataUri,
        audioTranscription,
        textDescription,
    });
    
    if (result.success && result.data) {
        const { suggestedTitle, suggestedCategory, suggestedPriority, suggestedStatus } = result.data;
        form.setValue('title', suggestedTitle, { shouldValidate: true });
        if (IncidentCategories.includes(suggestedCategory)) {
            form.setValue('category', suggestedCategory, { shouldValidate: true });
        }
        if (IncidentPriorities.includes(suggestedPriority as any)) {
            form.setValue('priority', suggestedPriority as any, { shouldValidate: true });
        }
        form.setValue('status', suggestedStatus, { shouldValidate: true });
        toast({
            title: 'Analysis Complete',
            description: 'AI suggestions have been applied to the form.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: result.error,
        });
    }

    setIsAnalyzing(false);
  };

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
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Details</CardTitle>
        <CardDescription>
          Fill out the form below. Use the "Analyze Incident" tool for AI-powered suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                                <Input placeholder="e.g., Water Leak in Aisle 3" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="photo"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Photo of Incident</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="audioTranscription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Audio Transcription</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Transcribed audio from a recording..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-8">
                    <FormField
                        control={form.control}
                        name="textDescription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Text Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="A detailed text description of the incident..." {...field} className="h-40" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
            
            <div className="flex justify-between items-center flex-wrap gap-4">
              <Button type="button" variant="outline" onClick={handleAnalyze} disabled={isAnalyzing || isSubmitting}>
                {isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Analyze Incident
              </Button>
              <Button type="submit" disabled={isSubmitting || isAnalyzing}>
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
      </CardContent>
    </Card>
  );
}
