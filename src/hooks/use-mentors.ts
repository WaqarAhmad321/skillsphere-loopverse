
"use client";

import { useQuery } from '@tanstack/react-query';
import { getAllMentors, findMentorById } from '@/lib/queries';

export function useMentors() {
  return useQuery({
    queryKey: ['mentors'],
    queryFn: () => getAllMentors(),
  });
}

export function useMentor(mentorId: string) {
    return useQuery({
        queryKey: ['mentor', mentorId],
        queryFn: () => findMentorById(mentorId),
        enabled: !!mentorId, // Only run the query if mentorId is available
    });
}
