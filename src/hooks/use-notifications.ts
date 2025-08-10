
"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotificationsByUserId } from '@/lib/queries';
import { useEffect } from 'react';
import type { Notification } from '@/types';

export function useNotifications(userId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = getNotificationsByUserId(userId, (newNotifications) => {
            // When new data arrives from the real-time listener,
            // update the React Query cache.
            queryClient.setQueryData(['notifications', userId], newNotifications);
        });

        // Unsubscribe from the listener when the component unmounts
        return () => unsubscribe();
    }, [userId, queryClient]);

    return useQuery<Notification[]>({
        queryKey: ['notifications', userId],
        // The initial data fetch is handled by the real-time listener,
        // so the queryFn can be a no-op that returns an empty array.
        queryFn: async () => {
            return []; // Initially empty, will be populated by the listener
        },
        enabled: !!userId,
        staleTime: Infinity, // Data is real-time, so it's never stale
    });
}
