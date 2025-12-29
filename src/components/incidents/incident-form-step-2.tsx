'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Cpu, DollarSign, Info } from 'lucide-react';
import { getAIAnalysis } from '@/app/actions';
import { IncidentReviewForm } from '@/components/incidents/incident-form';
import type { IncidentData } from '@/app/incidents/new/page';
import type { AnalyzeIncidentReportOutput } from '@/ai/flows/analyze-incident-report';
import Image from 'next/image';
import { calculateCost } from '@/lib/ai-pricing';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getIncidentSettings } from '@/lib/data';
import { useFirestore } from '@/firebase';
import type { IncidentSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface IncidentFormStep2Props {
    incidentData: IncidentData;
    onBack: () => void;
}

export function IncidentFormStep2({ incidentData, onBack }: IncidentFormStep2Props) {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const [analysisResult, setAnalysisResult] = useState<AnalyzeIncidentReportOutput | null>(null);
    const [incidentSettings, setIncidentSettings] = useState<IncidentSettings | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [estimatedCost, setEstimatedCost] = useState(0);

    useEffect(() => {
        const analyze = async () => {
            if (!firestore) return;
            setIsAnalyzing(true);
            toast({
                title: 'Analizando Incidencia...',
                description: 'La IA está generando el reporte de incidencia. Esto puede tardar un momento.',
            });

            const settings = await getIncidentSettings(firestore);
            setIncidentSettings(settings);

            const result = await getAIAnalysis({
                photoDataUri: incidentData.photoDataUri,
                audioTranscription: incidentData.audioTranscription,
                textDescription: incidentData.textDescription,
                incidentSettings: settings,
            });

            if (result.success && result.data) {
                setAnalysisResult(result.data);

                // Calculate cost
                const audioInputTokens = incidentData.audioTokens || 0;
                const audioOutputTokens = 0; // Transcription doesn't have output tokens in the same way.

                const analysisInputTokens = result.data.inputTokens || 0;
                const analysisOutputTokens = result.data.outputTokens || 0;

                const totalCost = calculateCost(
                    audioInputTokens + analysisInputTokens,
                    audioOutputTokens + analysisOutputTokens
                );
                setEstimatedCost(totalCost);

                toast({
                    title: 'Análisis Completo',
                    description: 'Las sugerencias de la IA han sido aplicadas al formulario.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Análisis Fallido',
                    description: result.error || 'Ocurrió un error desconocido durante el análisis.',
                });
            }
            setIsAnalyzing(false);
        };

        analyze();
    }, [incidentData, toast, firestore]);

    const handleFormSubmitSuccess = (incidentId: string, branchId: string) => {
        revalidateIncidentPaths(incidentId, branchId).then(() => {
            router.push(`/branches/${branchId}`);
        });
    };

    if (isAnalyzing || !incidentSettings) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Paso 2: Revisar y Enviar</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analizando datos y cargando configuración...</p>
                </CardContent>
            </Card>
        );
    }
    
    const analysisTokens = analysisResult?.totalTokens || 0;
    const audioTokens = incidentData.audioTokens || 0;
    const totalTokens = analysisTokens + audioTokens;

    const initialFormData = analysisResult ? {
        ...analysisResult,
        photoUrl: incidentData.photoDataUri,
        audioTranscription: incidentData.audioTranscription,
    } : {
        suggestedTitle: '',
        suggestedCategory: '',
        suggestedPriority: 'Medium',
        suggestedStatus: 'Abierto',
        suggestedDescription: incidentData.textDescription || '',
        photoUrl: incidentData.photoDataUri,
        audioTranscription: incidentData.audioTranscription,
        suggestedPriorityReasoning: '',
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paso 2: Revisar y Enviar</CardTitle>
                <CardDescription>
                    {analysisResult 
                        ? 'La IA ha generado un borrador del reporte de incidencia. Por favor, revisa, haz los cambios necesarios y envíalo.'
                        : 'La IA no pudo generar un reporte. Puedes volver e intentarlo de nuevo, o llenar el formulario manualmente.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {analysisResult?.suggestedPriorityReasoning && (
                    <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Justificación de la Prioridad</AlertTitle>
                        <AlertDescription>
                            {analysisResult.suggestedPriorityReasoning}
                        </AlertDescription>
                    </Alert>
                )}

                 <div className="grid gap-6 md:grid-cols-3 mb-6">
                    {incidentData.photoDataUri && (
                        <div className="md:col-span-1">
                            <h4 className="font-medium mb-2 text-sm">Evidencia en Foto</h4>
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                <Image
                                src={incidentData.photoDataUri}
                                alt="Evidencia de la incidencia"
                                fill
                                className="object-cover"
                                />
                            </div>
                        </div>
                    )}
                    {incidentData.audioTranscription && (
                        <div className="md:col-span-2">
                             <h4 className="font-medium mb-2 text-sm">Transcripción de Audio</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 bg-muted max-h-48 overflow-y-auto">
                                <blockquote>{incidentData.audioTranscription}</blockquote>
                            </div>
                        </div>
                    )}
                </div>
                <IncidentReviewForm 
                    initialData={initialFormData}
                    incidentSettings={incidentSettings}
                    onSuccess={handleFormSubmitSuccess}
                />
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Paso 1
                </Button>
                <div className="space-y-2">
                    {totalTokens > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-3 py-1">
                            <Cpu className="size-4" />
                            <span>Consumo Total de IA:</span>
                            <span className="font-semibold">{totalTokens.toLocaleString()} tokens</span>
                            <span className="text-muted-foreground/50">
                                (Audio: {audioTokens.toLocaleString()}, Análisis: {analysisTokens.toLocaleString()})
                            </span>
                        </div>
                    )}
                    {estimatedCost > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-3 py-1">
                            <DollarSign className="size-4" />
                            <span>Costo Estimado:</span>
                            <span className="font-semibold">${estimatedCost.toFixed(6)} USD</span>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
