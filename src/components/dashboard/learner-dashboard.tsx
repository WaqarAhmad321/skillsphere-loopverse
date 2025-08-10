
"use client"

import { useState, useEffect } from "react";
import type { Session, User } from "@/types";
import { checkAndCompleteSessions } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Calendar, CheckCircle, MailQuestion, ArrowRight } from "lucide-react";
import UpcomingLearnerSessionsList from "./upcoming-learner-sessions-list";
import PendingLearnerSessionsList from "./pending-learner-sessions-list";
import CompletedLearnerSessionsList from "./completed-learner-sessions-list";
import RecommendedMentors from "./recommended-mentors";
import { useSessionsByLearner } from "@/hooks/use-sessions";

export default function LearnerDashboard({ user }: { user: User }) {
  const { data: initialSessions, isLoading, refetch: refetchSessions } = useSessionsByLearner(user.id);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function checkSessions() {
      if (initialSessions) {
        const updatedSessions = await checkAndCompleteSessions(initialSessions);
        setSessions(updatedSessions);
         if (JSON.stringify(initialSessions) !== JSON.stringify(updatedSessions)) {
            refetchSessions();
        }
      }
    }
    checkSessions();
  }, [initialSessions, refetchSessions]);
  
  const handleSessionsUpdate = (updatedSessions: Session[]) => {
    setSessions(updatedSessions);
  }

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingSessions = sessions.filter(s => s.status === 'pending');

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user.name.split(' ')[0]}!</CardTitle>
          <CardDescription>Here's what's happening with your mentorship journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{completedSessions.length}</div>}
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
          </div>
        </CardContent>
        <CardFooter>
            <Button asChild>
                <Link href="/mentors">Find a New Mentor <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>

      <RecommendedMentors user={user} />
      
      <div className="space-y-6">
        <UpcomingLearnerSessionsList sessions={upcomingSessions} isLoading={isLoading} />
        <PendingLearnerSessionsList sessions={pendingSessions} isLoading={isLoading} />
        <CompletedLearnerSessionsList sessions={completedSessions} onSessionsUpdate={handleSessionsUpdate} isLoading={isLoading} />
      </div>

    </div>
  )
}
