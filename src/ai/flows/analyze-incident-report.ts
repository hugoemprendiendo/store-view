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

const AnalyzeIncidentReportInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo related to the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audioTranscription: z.string().optional().describe('The transcribed text from the audio recording of the incident.'),
  textDescription: z.string().optional().describe('A text description of the incident.'),
});
export type AnalyzeIncidentReportInput = z.infer<typeof AnalyzeIncidentReportInputSchema>;

const AnalyzeIncidentReportOutputSchema = z.object({
  suggestedTitle: z.string().describe('A suggested title for the incident report.'),
  suggestedCategory: z.string().describe('A suggested category for the incident report.'),
  suggestedPriority: z.string().describe('A suggested priority for the incident report (e.g., High, Medium, Low).'),
  suggestedStatus: z.string().describe('A suggested status for the incident report (e.g., Open, In Progress, Resolved).'),
  suggestedDescription: z.string().describe('A detailed, structured description of the incident based on the available evidence (photo, audio, text).'),
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
  prompt: `You are an AI assistant that analyzes incident reports and suggests improvements.

  Based on the provided information, suggest a title, category, priority, status, and a detailed, structured description for the incident report.
  The description should summarize all the evidence provided.
  Respond in a JSON format.

  Consider the following information when making your suggestions:

  {{#if photoDataUri}}
  Photo: {{media url=photoDataUri}}
  {{/if}}

  {{#if audioTranscription}}
  Audio Transcription: {{{audioTranscription}}}
  {{/if}}

  {{#if textDescription}}
  User's Text Description: {{{textDescription}}}
  {{/if}}`,
});

const analyzeIncidentReportFlow = ai.defineFlow(
  {
    name: 'analyzeIncidentReportFlow',
    inputSchema: AnalyzeIncidentReportInputSchema,
    outputSchema: AnalyzeIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await analyzeIncidentReportPrompt(input);
    return output!;
  }
);
