'use server';

import { analyzeIncidentReport, AnalyzeIncidentReportInput } from '@/ai/flows/analyze-incident-report';
import { transcribeAudio as aiTranscribeAudio, TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Incident } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getFirestore } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This is a temporary workaround to get a client-side firestore instance on the server
// In a real app, you would likely have a shared admin instance for server actions.
function getDb() {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
}

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
        const db = getDb();
        const incidentsCol = collection(db, 'incidents');
        
        const incidentToCreate = {
            ...data,
            photoUrl: data.photo, 
            photoHint: 'user uploaded',
            createdAt: new Date().toISOString(),
        };
        // @ts-ignore
        delete incidentToCreate.photo;

        const newDocRef = await addDoc(incidentsCol, incidentToCreate);
        const newIncidentSnap = await getDoc(newDocRef);
        const newIncident = { id: newDocRef.id, ...newIncidentSnap.data() } as Incident;

        revalidatePath('/');
        revalidatePath(`/branches/${data.branchId}`);
        return { success: true, data: newIncident };
    } catch (error) {
        console.error("Error in createIncident action:", error);
        return { success: false, error: 'Failed to create incident.' };
    }
}

export async function updateIncidentStatus(id: string, status: Incident['status']) {
    try {
        const db = getDb();
        const incidentRef = doc(db, 'incidents', id);
        await updateDoc(incidentRef, { status });
        
        const updatedSnap = await getDoc(incidentRef);
        const updatedIncident = { id: updatedSnap.id, ...updatedSnap.data() } as Incident;

        if (!updatedIncident) {
            return { success: false, error: 'Incidencia no encontrada.' };
        }
        revalidatePath('/');
        revalidatePath(`/branches/${updatedIncident.branchId}`);
        revalidatePath(`/incidents/${id}`);
        return { success: true, data: updatedIncident };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error al actualizar el estado de la incidencia.' };
    }
}
