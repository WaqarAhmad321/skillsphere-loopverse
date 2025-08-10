
'use server';
/**
 * @fileOverview An AI agent that suggests mentors to learners.
 *
 * - mentorSuggester - A function that suggests mentors based on learner goals.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getAllMentors } from '@/lib/queries';
import { MentorSuggesterInputSchema, MentorSuggesterOutputSchema, type MentorSuggesterInput, type MentorSuggesterOutput } from '@/ai/schemas/mentor-suggester-schemas';


// Define a tool for the AI to get a list of available mentors
const getAvailableMentors = ai.defineTool(
  {
    name: 'getAvailableMentors',
    description: 'Returns a list of all available and approved mentors in the system.',
    inputSchema: z.object({}),
    outputSchema: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            bio: z.string().optional(),
            subjects: z.array(z.string()),
            skills: z.array(z.string()).optional(),
        })
    )
  },
  async () => {
    console.log('Fetching available mentors...');
    const mentors = await getAllMentors();
    // Filter for only approved mentors and sanitize the data for the model
    return mentors
        .filter(m => m.isApproved)
        .map(m => ({
            id: m.id,
            name: m.name,
            bio: m.bio,
            subjects: m.subjects,
            skills: m.skills || []
        }));
  }
)

export async function mentorSuggester(input: MentorSuggesterInput): Promise<MentorSuggesterOutput> {
  return mentorSuggesterFlow(input);
}


const prompt = ai.definePrompt({
  name: 'mentorSuggesterPrompt',
  input: {schema: MentorSuggesterInputSchema},
  output: {schema: MentorSuggesterOutputSchema},
  tools: [getAvailableMentors],
  prompt: `You are an expert at matching learners with mentors on an online learning platform. Your goal is to provide a personalized list of mentor recommendations.

  The learner has provided the following information:
  - Learning Goals: {{{goals}}}
  - Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  First, use the getAvailableMentors tool to fetch the list of all available mentors.

  Then, based on the mentors' subjects, skills, and bios, recommend up to 3 mentors who would be the best fit for the learner's goals and interests. For each recommendation, provide a compelling, one-sentence reason explaining why they are a good match.
  `,
});

const mentorSuggesterFlow = ai.defineFlow(
  {
    name: 'mentorSuggesterFlow',
    inputSchema: MentorSuggesterInputSchema,
    outputSchema: MentorSuggesterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
