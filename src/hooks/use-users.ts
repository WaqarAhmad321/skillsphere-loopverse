
"use client";

import { useQuery } from '@tanstack/react-query';
import { getAllUsers, findUserById } from '@/lib/queries';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers(),
  });
}

export function useUser(userId?: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => findUserById(userId!),
        enabled: !!userId && enabled,
    });
}
