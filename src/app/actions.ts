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
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to transcribe audio.' };
  }
}

export async function revalidateIncidentPaths(incidentId: string, branchId: string) {
    revalidatePath('/');
    revalidatePath(`/branches/${branchId}`);
    revalidatePath(`/incidents/${incidentId}`);
}
