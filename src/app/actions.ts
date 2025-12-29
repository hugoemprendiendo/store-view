'use server';

import { analyzeIncidentReport, AnalyzeIncidentReportInput } from '@/ai/flows/analyze-incident-report';
import { transcribeAudio as aiTranscribeAudio, TranscribeAudioInput, TranscribeAudioOutput } from '@/ai/flows/transcribe-audio';
import { revalidatePath } from 'next/cache';

export async function getAIAnalysis(input: AnalyzeIncidentReportInput) {
  try {
    const result = await analyzeIncidentReport(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to analyze incident.' };
  }
}

export async function transcribeAudio(input: TranscribeAudioInput): Promise<{ success: boolean; data?: TranscribeAudioOutput, error?: string }> {
  try {
    const result = await aiTranscribeAudio(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error in transcribeAudio server action:', error);
    
    const errorMessage = error.message || 'An unknown error occurred during transcription.';

    if (errorMessage.includes('429')) {
      return { success: false, error: 'Demasiadas solicitudes. Por favor, espera un momento antes de volver a intentarlo.' };
    }

    return { success: false, error: errorMessage };
  }
}

export async function revalidateIncidentPaths(incidentId: string, branchId: string) {
    revalidatePath('/');
    revalidatePath(`/branches/${branchId}`);
    revalidatePath(`/incidents/${incidentId}`);
    revalidatePath('/settings');
}
