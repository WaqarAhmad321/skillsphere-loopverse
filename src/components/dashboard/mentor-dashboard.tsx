
"use client"

import { useState, useEffect } from "react";
import type { Session, Mentor } from "@/types";
import { checkAndCompleteSessions } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/star-rating";
import { BookOpen, Calendar, MailQuestion, Star } from "lucide-react";
import BookingRequestsList from "./booking-requests-list";
import UpcomingMentorSessionsList from "./upcoming-mentor-sessions-list";
import CompletedMentorSessionsList from "./completed-mentor-sessions-list";
import { useSessionsByMentor } from "@/hooks/use-sessions";


export default function MentorDashboard({ user }: { user: Mentor }) {
  const { toast } = useToast();
  const { data: initialSessions, isLoading, refetch: refetchSessions } = useSessionsByMentor(user.id);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function checkSessions() {
        if (initialSessions) {
            const updatedSessions = await checkAndCompleteSessions(initialSessions);
            setSessions(updatedSessions);
            // If sessions were completed, refetch to get latest summary data
            if (JSON.stringify(initialSessions) !== JSON.stringify(updatedSessions)) {
                refetchSessions();
            }
        }
    }
    checkSessions();
  }, [initialSessions, refetchSessions]);
  
  const handleSessionUpdate = (sessionId: string, newStatus: 'upcoming' | 'cancelled') => {
    if (newStatus === 'cancelled') {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    } else {
        setSessions(prev => 
            prev.map(s => s.id === sessionId ? {...s, status: newStatus} : s)
        );
    }
  }

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  
  return (
    <div className="grid gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tighter">Mentor Dashboard</h1>
        <p className="text-muted-foreground">Manage your mentoring sessions and availability.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Your Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{user.rating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">from {user.reviews} reviews</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <MailQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{pendingSessions.length}</div>}
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{upcomingSessions.length}</div>}
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{completedSessions.length}</div>}
            </CardContent>
            </Card>
      </div>
        
      {!isLoading && pendingSessions.length > 0 && (
        <BookingRequestsList sessions={pendingSessions} onSessionUpdate={handleSessionUpdate} mentorId={user.id} />
      )}

      <div className="space-y-6">
          <UpcomingMentorSessionsList sessions={upcomingSessions} isLoading={isLoading} />
          <CompletedMentorSessionsList sessions={completedSessions} isLoading={isLoading} />
      </div>
    </div>
  );
}
