import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-incident-report.ts';
import '@/ai/flows/transcribe-audio.ts';
import { listModels } from 'genkit';


async function list() {
    console.log(await listModels());
}

list();
    