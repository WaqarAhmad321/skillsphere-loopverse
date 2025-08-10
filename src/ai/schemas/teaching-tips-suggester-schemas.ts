
/**
 * @fileOverview Schemas for the teaching tips suggester AI agent.
 */
import {z} from 'genkit';

export const TeachingTipsInputSchema = z.object({
  learnerId: z.string().describe("The ID of the learner for the upcoming session."),
  mentorSubjects: z.array(z.string()).describe("A list of the mentor's teaching subjects."),
});
export type TeachingTipsInput = z.infer<typeof TeachingTipsInputSchema>;

export const TeachingTipsOutputSchema = z.object({
  tips: z
    .array(
      z.string().describe('A single, actionable teaching tip.')
    )
    .describe('A list of 2-3 personalized teaching tips for the mentor.'),
});
export type TeachingTipsOutput = z.infer<
  typeof TeachingTipsOutputSchema
>;
