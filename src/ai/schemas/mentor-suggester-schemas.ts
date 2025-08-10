/**
 * @fileOverview Schemas for the mentor suggester AI agent.
 *
 * - MentorSuggesterInput - The input type for the mentorSuggester function.
 * - MentorSuggesterOutput - The return type for the mentorSuggester function.
 */
import {z} from 'genkit';

export const MentorSuggesterInputSchema = z.object({
  goals: z.string().describe('The learning goals of the user.'),
  interests: z.array(z.string()).describe("A list of the user's interests."),
});
export type MentorSuggesterInput = z.infer<typeof MentorSuggesterInputSchema>;

export const MentorSuggesterOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        mentorId: z.string().describe('The ID of the recommended mentor.'),
        reason: z
          .string()
          .describe(
            'A short, compelling reason why this mentor is a good match for the learner.'
          ),
      })
    )
    .describe('A list of up to 3 recommended mentors.'),
});
export type MentorSuggesterOutput = z.infer<
  typeof MentorSuggesterOutputSchema
>;
