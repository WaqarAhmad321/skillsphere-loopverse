
'use server';

/**
 * @fileOverview Generates a summary of a mentoring session from its chat transcript.
 *
 * - sessionSummarizer - A function that generates the session summary.
 * - SessionSummarizerInput - The input type for the sessionSummarizer function.
 * - SessionSummarizerOutput - The return type for the sessionSummarizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Message } from '@/types';


const SessionSummarizerInputSchema = z.object({
  chatHistory: z.string().describe('The full transcript of the mentoring session chat.'),
});
export type SessionSummarizerInput = z.infer<typeof SessionSummarizerInputSchema>;

const SessionSummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the mentoring session, including key topics, advice, and action items.'),
});
export type SessionSummarizerOutput = z.infer<typeof SessionSummarizerOutputSchema>;

export async function sessionSummarizer(input: SessionSummarizerInput): Promise<SessionSummarizerOutput> {
  return sessionSummarizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sessionSummarizerPrompt',
  input: {schema: SessionSummarizerInputSchema},
  output: {schema: SessionSummarizerOutputSchema},
  prompt: `You are an AI assistant designed to summarize mentoring sessions. Your task is to provide a clear, concise, and helpful summary from the provided chat transcript.

  The summary should:
  1.  Identify the main topics discussed during the session.
  2.  Highlight key advice or suggestions given by the mentor.
  3.  List any clear action items or next steps for the learner.

  Please analyze the following chat transcript and generate the summary.

  Chat Transcript:
  {{{chatHistory}}}
  `,
});

const sessionSummarizerFlow = ai.defineFlow(
  {
    name: 'sessionSummarizerFlow',
    inputSchema: SessionSummarizerInputSchema,
    outputSchema: SessionSummarizerOutputSchema,
  },
  async input => {
    // Return an empty summary if the chat history is too short to be meaningful
    if (input.chatHistory.length < 50) {
        return { summary: "Not enough conversation to generate a summary." };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
