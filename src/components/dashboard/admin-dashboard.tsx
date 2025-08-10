
"use client"

import type { User, Mentor, Session } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/use-users";
import { useSessions } from "@/hooks/use-sessions";

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();


export default function AdminDashboard({ user }: { user: User }) {
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: sessions, isLoading: isSessionsLoading } = useSessions();
  
  const isLoading = isUsersLoading || isSessionsLoading;
  
  const mentors = users?.filter(u => u.role === 'mentor') as Mentor[] || [];
  
  const stats = {
      totalUsers: users?.length || 0,
      totalMentors: mentors.length,
      totalSessions: sessions?.length || 0,
      pendingApprovals: mentors.filter(m => !m.isApproved).length
  }

  const recentSessions = sessions?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) || [];
  
  const userMap = users?.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
  }, {} as Record<string, User>) || {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalUsers}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalMentors}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalSessions}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.pendingApprovals}</div>}
            <p className="text-xs text-muted-foreground">Mentors waiting for approval</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>The 5 most recently scheduled sessions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Learner</TableHead>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Date</TableHead>
                         <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : recentSessions.map(session => {
                        const learner = userMap[session.learnerId];
                        const mentor = userMap[session.mentorId];
                        return (
                             <TableRow key={session.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={learner?.avatarUrl} />
                                            <AvatarFallback>{learner ? getInitials(learner.name) : 'L'}</AvatarFallback>
                                        </Avatar>
                                        {learner?.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={mentor?.avatarUrl} />
                                            <AvatarFallback>{mentor ? getInitials(mentor.name) : 'M'}</AvatarFallback>
                                        </Avatar>
                                        {mentor?.name}
                                    </div>
                                </TableCell>
                                <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant="outline">{session.status}</Badge></TableCell>
                            </TableRow>
                        )
                    })}
                     {!isLoading && recentSessions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">No sessions found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
       </Card>
    </div>
  )
}
