// @ts-nocheck
'use server';

import { analyzeIncidentReport, AnalyzeIncidentReportInput } from '@/ai/flows/analyze-incident-report';
import { transcribeAudio as aiTranscribeAudio, TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import { createIncident as dbCreateIncident, updateIncidentStatus as dbUpdateIncidentStatus } from '@/lib/data';
import type { Incident } from '@/lib/types';
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

export async function createIncident(data: Omit<Incident, 'id' | 'createdAt'>) {
    try {
        const newIncident = await dbCreateIncident(data);
        revalidatePath('/');
        revalidatePath(`/branches/${data.branchId}`);
        return { success: true, data: newIncident };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to create incident.' };
    }
}

export async function updateIncidentStatus(id: string, status: Incident['status']) {
    try {
        const updatedIncident = await dbUpdateIncidentStatus(id, status);
        if (!updatedIncident) {
            return { success: false, error: 'Incident not found.' };
        }
        revalidatePath('/');
        revalidatePath(`/branches/${updatedIncident.branchId}`);
        revalidatePath(`/incidents/${id}`);
        return { success: true, data: updatedIncident };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to update incident status.' };
    }
}

    