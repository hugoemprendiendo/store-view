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
                title: 'Recording Started',
                description: 'Speak now. Click the stop button when you are finished.',
            });
        } catch (error) {
            console.error('Error starting recording:', error);
            toast({
                variant: 'destructive',
                title: 'Recording Error',
                description: 'Could not start audio recording. Please ensure you have given microphone permissions.',
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
        toast({ title: 'Transcribing audio...', description: 'This may take a moment.' });
        try {
            const audioDataUri = await fileToDataURI(audioBlob as File);
            const result = await transcribeAudio({ audioDataUri });
            if (result.success && result.data) {
                setAudioTranscription(result.data);
                toast({
                    title: 'Transcription Complete',
                    description: 'The audio has been transcribed.',
                });
            } else {
                throw new Error(result.error || 'Transcription failed');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            toast({
                variant: 'destructive',
                title: 'Transcription Failed',
                description: 'Could not transcribe the recorded audio.',
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
                title: 'Information Required',
                description: 'Please provide a photo, an audio recording, or a text description to continue.',
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
                    title: 'Error reading file',
                    description: 'Could not process the uploaded photo.',
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
                <CardTitle>Step 1: Provide Evidence</CardTitle>
                <CardDescription>
                    Upload a photo, record an audio description, or write a text description of the incident.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Photo of Incident</label>
                    <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)} 
                        disabled={isBusy} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Audio Report</label>
                    <div className="flex items-center gap-2">
                        {!isRecording ? (
                            <Button type="button" variant="outline" onClick={handleStartRecording} disabled={isBusy}>
                                <Mic className="mr-2 h-4 w-4" />
                                Record Audio
                            </Button>
                        ) : (
                            <Button type="button" variant="destructive" onClick={handleStopRecording} disabled={isTranscribing}>
                                <StopCircle className="mr-2 h-4 w-4" />
                                {isTranscribing ? 'Transcribing...' : 'Stop Recording'}
                            </Button>
                        )}
                        {isTranscribing && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                    {audioTranscription && (
                         <div className="p-4 border rounded-md bg-muted text-sm text-muted-foreground italic">"{audioTranscription}"</div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Text Description</label>
                    <Textarea 
                        placeholder="Or, type a detailed description of the incident here..." 
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
                    Analyze & Proceed
                </Button>
            </CardFooter>
        </Card>
    );
}
