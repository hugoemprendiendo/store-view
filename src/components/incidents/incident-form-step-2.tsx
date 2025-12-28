'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getAIAnalysis } from '@/app/actions';
import { IncidentReviewForm } from '@/components/incidents/incident-form';
import type { IncidentData } from '@/app/incidents/new/page';
import type { AnalyzeIncidentReportOutput } from '@/ai/flows/analyze-incident-report';
import Image from 'next/image';

interface IncidentFormStep2Props {
    incidentData: IncidentData;
    onBack: () => void;
}

export function IncidentFormStep2({ incidentData, onBack }: IncidentFormStep2Props) {
    const { toast } = useToast();
    const [analysisResult, setAnalysisResult] = useState<AnalyzeIncidentReportOutput | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    useEffect(() => {
        const analyze = async () => {
            setIsAnalyzing(true);
            toast({
                title: 'Analyzing Incident...',
                description: 'The AI is generating the incident report. This may take a moment.',
            });

            const result = await getAIAnalysis(incidentData);

            if (result.success && result.data) {
                setAnalysisResult(result.data);
                toast({
                    title: 'Analysis Complete',
                    description: 'AI suggestions have been applied to the form.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Analysis Failed',
                    description: result.error || 'An unknown error occurred during analysis.',
                });
                // Optionally, allow user to proceed with manual entry or go back
            }
            setIsAnalyzing(false);
        };

        analyze();
    }, [incidentData, toast]);

    if (isAnalyzing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Review & Submit</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analyzing incident data and generating report...</p>
                </CardContent>
            </Card>
        );
    }

    if (!analysisResult) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Analysis Failed</CardTitle>
                     <CardDescription>
                        The AI could not generate a report. You can go back and try again, or fill out the form manually.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IncidentReviewForm initialData={{
                        suggestedTitle: '',
                        suggestedCategory: '',
                        suggestedPriority: 'Medium',
                        suggestedStatus: 'Open',
                        photoUrl: incidentData.photoDataUri,
                        audioTranscription: incidentData.audioTranscription,
                        description: incidentData.textDescription,
                    }} />
                </CardContent>
                <CardFooter className="flex justify-start">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Step 1
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Step 2: Review & Submit</CardTitle>
                <CardDescription>
                    The AI has generated a draft of the incident report. Please review, make any necessary changes, and submit.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid gap-6 md:grid-cols-3 mb-6">
                    {incidentData.photoDataUri && (
                        <div className="md:col-span-1">
                            <h4 className="font-medium mb-2 text-sm">Photo Evidence</h4>
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                <Image
                                src={incidentData.photoDataUri}
                                alt="Incident evidence"
                                fill
                                className="object-cover"
                                />
                            </div>
                        </div>
                    )}
                    {(incidentData.audioTranscription || incidentData.textDescription) && (
                        <div className="md:col-span-2">
                             <h4 className="font-medium mb-2 text-sm">Provided Description</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 bg-muted max-h-48 overflow-y-auto">
                                {incidentData.audioTranscription && <blockquote>{incidentData.audioTranscription}</blockquote>}
                                {incidentData.textDescription && <p>{incidentData.textDescription}</p>}
                            </div>
                        </div>
                    )}
                </div>
                <IncidentReviewForm initialData={{
                    ...analysisResult,
                    photoUrl: incidentData.photoDataUri,
                    audioTranscription: incidentData.audioTranscription,
                    description: incidentData.textDescription,
                }} />
            </CardContent>
            <CardFooter className="flex justify-start">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Step 1
                </Button>
            </CardFooter>
        </Card>
    );
}
