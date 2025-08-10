
"use client";

import { useQuery } from '@tanstack/react-query';
import { 
    getAllSessions, 
    getSessionById,
    getSessionsByLearnerId, 
    getSessionsByMentorId
} from '@/lib/queries';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getAllSessions(),
  });
}

export function useSession(sessionId: string) {
    return useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => getSessionById(sessionId),
        enabled: !!sessionId,
    });
}

export function useSessionsByLearner(learnerId: string) {
    return useQuery({
        queryKey: ['sessions', 'learner', learnerId],
        queryFn: () => getSessionsByLearnerId(learnerId),
        enabled: !!learnerId,
    });
}

export function useSessionsByMentor(mentorId: string) {
    return useQuery({
        queryKey: ['sessions', 'mentor', mentorId],
        queryFn: () => getSessionsByMentorId(mentorId),
        enabled: !!mentorId,
    });
}
