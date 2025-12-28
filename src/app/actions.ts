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
        // The form passes the full data URI for the photo, but we just want to store it for now.
        // In a real app, you'd upload this to a storage service (e.g., Firebase Storage)
        // and store the URL. For this demo, we'll just pass it through.
        const incidentToCreate = {
            ...data,
            photoUrl: data.photo, // 'photo' from form is the data URI.
            photoHint: 'user uploaded',
        };
        delete incidentToCreate.photo;


        const newIncident = await dbCreateIncident(incidentToCreate);
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
