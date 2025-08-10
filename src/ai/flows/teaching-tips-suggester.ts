
'use server';
/**
 * @fileOverview An AI agent that suggests teaching tips to mentors.
 *
 * - teachingTipsSuggester - A function that suggests tips based on learner goals and mentor subjects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findUserById } from '@/lib/queries';
import { TeachingTipsInputSchema, TeachingTipsOutputSchema, type TeachingTipsInput, type TeachingTipsOutput } from '@/ai/schemas/teaching-tips-suggester-schemas';


// Define a tool for the AI to get learner details
const getLearnerDetails = ai.defineTool(
  {
    name: 'getLearnerDetails',
    description: "Returns a learner's profile information, specifically their stated learning goals and interests.",
    inputSchema: z.object({
        learnerId: z.string().describe("The ID of the learner to fetch.")
    }),
    outputSchema: z.object({
        goals: z.string().optional(),
        interests: z.array(z.string()).optional(),
    })
  },
  async ({ learnerId }) => {
    console.log(`Fetching details for learner ${learnerId}...`);
    const learner = await findUserById(learnerId);
    if (!learner) {
        return { goals: "User not found.", interests: [] };
    }
    return {
        goals: learner.bio,
        interests: learner.interests
    };
  }
)

export async function teachingTipsSuggester(input: TeachingTipsInput): Promise<TeachingTipsOutput> {
  return teachingTipsSuggesterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'teachingTipsPrompt',
  input: {schema: TeachingTipsInputSchema},
  output: {schema: TeachingTipsOutputSchema},
  tools: [getLearnerDetails],
  prompt: `You are an expert mentor coach. Your goal is to provide specific, actionable teaching tips to a mentor for an upcoming session.

  The mentor teaches the following subjects: {{#each mentorSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

  First, use the getLearnerDetails tool to get the learner's profile information using their ID: {{{learnerId}}}.

  Then, based on the learner's goals and interests, and the mentor's subjects, provide 2-3 concise, actionable tips to help the mentor prepare for the session. Frame the tips to be encouraging and helpful.
  `,
});

const teachingTipsSuggesterFlow = ai.defineFlow(
  {
    name: 'teachingTipsSuggesterFlow',
    inputSchema: TeachingTipsInputSchema,
    outputSchema: TeachingTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
