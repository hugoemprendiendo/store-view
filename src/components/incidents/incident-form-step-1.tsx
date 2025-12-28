'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, StopCircle, ArrowRight, FileText } from 'lucide-react';
import { transcribeAudio } from '@/app/actions';
import type { IncidentData } from '@/app/incidents/new/page';
import { Textarea } from '../ui/textarea';

const fileToDataURI = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
});

interface IncidentFormStep1Props {
    onStepComplete: (data: IncidentData) => void;
}

export function IncidentFormStep1({ onStepComplete }: IncidentFormStep1Props) {
    const { toast } = useToast();
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [audioTranscription, setAudioTranscription] = useState('');
    const [textDescription, setTextDescription] = useState('');
    
    const isBusy = isRecording || isTranscribing || isProcessing;

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];
                handleTranscription(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
            toast({
                title: 'Grabación Iniciada',
                description: 'Hable ahora. Haz clic en el botón de parar cuando hayas terminado.',
            });
        } catch (error) {
            console.error('Error al iniciar la grabación:', error);
            toast({
                variant: 'destructive',
                title: 'Error de Grabación',
                description: 'No se pudo iniciar la grabación de audio. Asegúrate de haber dado permisos para el micrófono.',
            });
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleTranscription = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        toast({ title: 'Transcribiendo audio...', description: 'Esto puede tardar un momento.' });
        try {
            const audioDataUri = await fileToDataURI(audioBlob as File);
            const result = await transcribeAudio({ audioDataUri });
            if (result.success && result.data) {
                setAudioTranscription(result.data);
                toast({
                    title: 'Transcripción Completa',
                    description: 'El audio ha sido transcrito.',
                });
            } else {
                throw new Error(result.error || 'La transcripción falló');
            }
        } catch (error) {
            console.error('Error de transcripción:', error);
            const description = error instanceof Error ? error.message : 'No se pudo transcribir el audio grabado.';
            toast({
                variant: 'destructive',
                title: 'Fallo en la Transcripción',
                description,
            });
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleNextStep = async () => {
        setIsProcessing(true);
        let photoDataUri: string | undefined;

        if (!photoFile && !audioTranscription && !textDescription) {
            toast({
                variant: 'destructive',
                title: 'Información Requerida',
                description: 'Por favor, proporciona una foto, una grabación de audio o una descripción de texto para continuar.',
            });
            setIsProcessing(false);
            return;
        }

        if (photoFile) {
            try {
                photoDataUri = await fileToDataURI(photoFile);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error al leer el archivo',
                    description: 'No se pudo procesar la foto subida.',
                });
                setIsProcessing(false);
                return;
            }
        }

        onStepComplete({
            photoDataUri,
            audioTranscription,
            textDescription,
        });
        setIsProcessing(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paso 1: Proporcionar Evidencia</CardTitle>
                <CardDescription>
                    Sube una foto, graba una descripción en audio o escribe una descripción en texto de la incidencia.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Foto de la Incidencia</label>
                    <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)} 
                        disabled={isBusy} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Reporte de Audio</label>
                    <div className="flex items-center gap-2">
                        {!isRecording ? (
                            <Button type="button" variant="outline" onClick={handleStartRecording} disabled={isBusy}>
                                <Mic className="mr-2 h-4 w-4" />
                                Grabar Audio
                            </Button>
                        ) : (
                            <Button type="button" variant="destructive" onClick={handleStopRecording} disabled={isTranscribing}>
                                <StopCircle className="mr-2 h-4 w-4" />
                                {isTranscribing ? 'Transcribiendo...' : 'Detener Grabación'}
                            </Button>
                        )}
                        {isTranscribing && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                    {audioTranscription && (
                         <div className="p-4 border rounded-md bg-muted text-sm text-muted-foreground italic">"{audioTranscription}"</div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción de Texto</label>
                    <Textarea 
                        placeholder="O, escribe una descripción detallada de la incidencia aquí..." 
                        value={textDescription}
                        onChange={(e) => setTextDescription(e.target.value)}
                        className="h-[150px]"
                        disabled={isBusy}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                 <Button type="button" onClick={handleNextStep} disabled={isBusy}>
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Analizar y Continuar
                </Button>
            </CardFooter>
        </Card>
    );
}
