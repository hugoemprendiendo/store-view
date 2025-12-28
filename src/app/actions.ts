'use server';

import { analyzeIncidentReport, AnalyzeIncidentReportInput } from '@/ai/flows/analyze-incident-report';
import { transcribeAudio as aiTranscribeAudio, TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
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

export async function transcribeAudio(input: TranscribeAudioInput) {
  try {
    const result = await aiTranscribeAudio(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error in transcribeAudio server action:', error);
    
    // Check if the error message contains a 429 status code for rate limiting
    if (error.message && error.message.includes('429')) {
      return { success: false, error: 'Demasiadas solicitudes. Por favor, espera un momento antes de volver a intentarlo.' };
    }

    // Propagate the actual error message to the client for other errors
    return { success: false, error: error.message || 'An unknown error occurred during transcription.' };
  }
}

export async function revalidateIncidentPaths(incidentId: string, branchId: string) {
    revalidatePath('/');
    revalidatePath(`/branches/${branchId}`);
    revalidatePath(`/incidents/${incidentId}`);
}
