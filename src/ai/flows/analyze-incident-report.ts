'use server';

/**
 * @fileOverview Analyzes incident reports using GenAI to suggest a title, category, priority, status, and description.
 *
 * - analyzeIncidentReport - A function that analyzes the incident report and suggests improvements.
 * - AnalyzeIncidentReportInput - The input type for the analyzeIncidentReport function.
 * - AnalyzeIncidentReportOutput - The return type for the analyzeIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { IncidentSettings } from '@/lib/types';

const AnalyzeIncidentReportInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo related to the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audioTranscription: z.string().optional().describe('The transcribed text from the audio recording of the incident.'),
  textDescription: z.string().optional().describe('A text description of the incident.'),
  incidentSettings: z.custom<IncidentSettings>().describe('The available settings for incidents.'),
});
export type AnalyzeIncidentReportInput = z.infer<typeof AnalyzeIncidentReportInputSchema>;

const AnalyzeIncidentReportOutputSchema = z.object({
  suggestedTitle: z.string().describe('A suggested title for the incident report.'),
  suggestedCategory: z.string().describe('A suggested category for the incident report.'),
  suggestedPriority: z.string().describe('A suggested priority for the incident report (e.g., High, Medium, Low).'),
  suggestedPriorityReasoning: z.string().describe('A brief explanation for why the priority was chosen.'),
  suggestedStatus: z.string().describe('A suggested status for the incident report (e.g., Open, In Progress, Resolved).'),
  suggestedDescription: z.string().describe('A detailed, structured description of the incident based on the available evidence (photo, audio, text).'),
  inputTokens: z.number().optional().describe('The number of tokens used in the input.'),
  outputTokens: z.number().optional().describe('The number of tokens used in the output.'),
  totalTokens: z.number().optional().describe('The total number of tokens used.'),
});
export type AnalyzeIncidentReportOutput = z.infer<typeof AnalyzeIncidentReportOutputSchema>;

export async function analyzeIncidentReport(
  input: AnalyzeIncidentReportInput
): Promise<AnalyzeIncidentReportOutput> {
  return analyzeIncidentReportFlow(input);
}

const analyzeIncidentReportPrompt = ai.definePrompt({
  name: 'analyzeIncidentReportPrompt',
  input: {schema: AnalyzeIncidentReportInputSchema},
  output: {schema: AnalyzeIncidentReportOutputSchema},
  prompt: `Eres un asistente de IA que analiza reportes de incidencias y sugiere mejoras.

  Basado en la información proporcionada (foto, audio, texto), sugiere un título, categoría, prioridad, estado y una descripción detallada y estructurada para el reporte de incidencia. Todos los campos de salida DEBEN estar en español.
  La descripción debe resumir toda la evidencia proporcionada.

  Al determinar la categoría, DEBES elegir uno de los siguientes valores: {{{JSON.stringify incidentSettings.categories}}}.

  Al determinar la prioridad, usa la siguiente lógica y asegúrate de devolver solo uno de los valores {{{JSON.stringify incidentSettings.priorities}}}:
  - Prioridad 'High': Si la incidencia impide que la tienda opere.
  - Prioridad 'Medium': Si la tienda puede operar, pero con problemas o de forma limitada.
  - Prioridad 'Low': Si la incidencia no afecta la operación principal de la tienda.

  Después de elegir la prioridad, proporciona una breve explicación en 'suggestedPriorityReasoning' de por qué elegiste ese nivel de prioridad, basándote en la lógica anterior.
  
  Responde en formato JSON.

  Considera la siguiente información al hacer tus sugerencias:

  {{#if photoDataUri}}
  Foto de la evidencia: {{media url=photoDataUri}}
  {{/if}}

  {{#if audioTranscription}}
  Transcripción de Audio: {{{audioTranscription}}}
  {{/if}}

  {{#if textDescription}}
  Descripción de Texto del Usuario: {{{textDescription}}}
  {{/if}}`,
});

const analyzeIncidentReportFlow = ai.defineFlow(
  {
    name: 'analyzeIncidentReportFlow',
    inputSchema: AnalyzeIncidentReportInputSchema,
    outputSchema: AnalyzeIncidentReportOutputSchema,
  },
  async input => {
    const {output, usage} = await analyzeIncidentReportPrompt(input);
    return {
      ...output!,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    };
  }
);
