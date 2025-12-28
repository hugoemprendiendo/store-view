'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Cpu, DollarSign } from 'lucide-react';
import { getAIAnalysis } from '@/app/actions';
import { IncidentReviewForm } from '@/components/incidents/incident-form';
import type { IncidentData } from '@/app/incidents/new/page';
import type { AnalyzeIncidentReportOutput } from '@/ai/flows/analyze-incident-report';
import Image from 'next/image';
import { calculateCost } from '@/lib/ai-pricing';

interface IncidentFormStep2Props {
    incidentData: IncidentData;
    onBack: () => void;
}

export function IncidentFormStep2({ incidentData, onBack }: IncidentFormStep2Props) {
    const { toast } = useToast();
    const [analysisResult, setAnalysisResult] = useState<AnalyzeIncidentReportOutput | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [estimatedCost, setEstimatedCost] = useState(0);

    useEffect(() => {
        const analyze = async () => {
            setIsAnalyzing(true);
            toast({
                title: 'Analizando Incidencia...',
                description: 'La IA está generando el reporte de incidencia. Esto puede tardar un momento.',
            });

            // Do not send image for analysis
            const result = await getAIAnalysis({
                audioTranscription: incidentData.audioTranscription,
                textDescription: incidentData.textDescription,
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
    }, [incidentData, toast]);

    if (isAnalyzing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Paso 2: Revisar y Enviar</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analizando datos de la incidencia y generando reporte...</p>
                </CardContent>
            </Card>
        );
    }
    
    const analysisTokens = analysisResult?.totalTokens || 0;
    const audioTokens = incidentData.audioTokens || 0;
    const totalTokens = analysisTokens + audioTokens;

    if (!analysisResult) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Análisis Fallido</CardTitle>
                     <CardDescription>
                        La IA no pudo generar un reporte. Puedes volver e intentarlo de nuevo, o llenar el formulario manualmente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IncidentReviewForm initialData={{
                        suggestedTitle: '',
                        suggestedCategory: '',
                        suggestedPriority: 'Medium',
                        suggestedStatus: 'Abierto',
                        suggestedDescription: incidentData.textDescription || '',
                        photoUrl: incidentData.photoDataUri,
                        audioTranscription: incidentData.audioTranscription,
                    }} />
                </CardContent>
                <CardFooter className="flex justify-start">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Paso 1
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paso 2: Revisar y Enviar</CardTitle>
                <CardDescription>
                    La IA ha generado un borrador del reporte de incidencia. Por favor, revisa, haz los cambios necesarios y envíalo.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                    {incidentData.textDescription && (
                        <div className="md:col-span-2">
                             <h4 className="font-medium mb-2 text-sm">Descripción Original</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 bg-muted max-h-48 overflow-y-auto">
                                <p>{incidentData.textDescription}</p>
                            </div>
                        </div>
                    )}
                </div>
                <IncidentReviewForm initialData={{
                    ...analysisResult,
                    photoUrl: incidentData.photoDataUri,
                    audioTranscription: incidentData.audioTranscription,
                }} />
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
