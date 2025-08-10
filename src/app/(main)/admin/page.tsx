
"use client";

import { useState, useEffect } from 'react';
import type { User, Mentor, Session } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Check, X, ShieldAlert, Trash2, Star, Loader2, Users, BookOpen, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateMentorApproval, removeFeedbackFromSession } from '@/lib/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/use-users';
import { useSessions } from '@/hooks/use-sessions';
import { StarRating } from '@/components/star-rating';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';

const getInitials = (name?: string) => (name || '').split(' ').map(n => n[0]).join('').toUpperCase();

function UsersTable({ users, isLoading }: { users: User[], isLoading: boolean }) {
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-5 w-28" /></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'mentor' ? 'secondary' : 'outline'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function MentorsApprovalTable({ mentors, isLoading, onMentorUpdate }: { mentors: Mentor[], isLoading: boolean, onMentorUpdate: (mentorId: string, isApproved: boolean) => void }) {
    const { toast } = useToast();

    const handleApproval = async (mentorId: string, isApproved: boolean) => {
        const result = await updateMentorApproval(mentorId, isApproved);
        if(result.success) {
            const mentor = mentors.find(m => m.id === mentorId);
            onMentorUpdate(mentorId, isApproved);
            toast({
                title: `Mentor ${isApproved ? 'Approved' : 'Rejected'}`,
                description: `${mentor?.name}'s application has been updated.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error || 'Could not update mentor status.',
            });
        }
    };
    
    const pendingMentors = mentors.filter(m => !m.isApproved);
    
     if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-80" /></CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 2 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                                    <TableCell><div className="flex flex-wrap gap-1"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div></TableCell>
                                    <TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }
    
    return (
         <Card>
            <CardHeader>
                <CardTitle>Mentor Approvals</CardTitle>
                <CardDescription>Review and approve new mentor applications.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mentor</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingMentors.length > 0 ? pendingMentors.map(mentor => (
                            <TableRow key={mentor.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
                                            <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{mentor.name}</p>
                                            <p className="text-sm text-muted-foreground">{mentor.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {mentor.subjects.map(subject => <Badge key={subject} variant="outline">{subject}</Badge>)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleApproval(mentor.id, true)}>
                                            <Check className="h-4 w-4 text-green-500" />
                                        </Button>
                                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleApproval(mentor.id, false)}>
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No pending mentor approvals.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ReviewModerationTable({ sessions, users, isLoading, onReviewDeleted }: { sessions: Session[], users: User[], isLoading: boolean, onReviewDeleted: (sessionId: string) => void }) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const usersMap = new Map(users.map(u => [u.id, u]));

    const handleDelete = async (session: Session) => {
        if (!session.feedback) return;
        setIsDeleting(session.id);
        const result = await removeFeedbackFromSession(session.id, session.mentorId, session.feedback.rating);
        if (result.success) {
            toast({ title: "Review Deleted", description: "The review has been successfully removed." });
            onReviewDeleted(session.id);
        } else {
            toast({ variant: 'destructive', title: "Deletion Failed", description: result.error });
        }
        setIsDeleting(null);
    };

    const sessionsWithFeedback = sessions.filter(s => s.feedback);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-80" /></CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {['Mentor', 'Learner', 'Rating', 'Comment', 'Actions'].map(h => <TableHead key={h}><Skeleton className="h-5 w-24" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review and manage user-submitted feedback.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mentor</TableHead>
                            <TableHead>Learner</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessionsWithFeedback.length > 0 ? sessionsWithFeedback.map(session => {
                            const mentor = usersMap.get(session.mentorId);
                            const learner = usersMap.get(session.learnerId);
                            return (
                                <TableRow key={session.id}>
                                    <TableCell>{mentor?.name || 'Unknown'}</TableCell>
                                    <TableCell>{learner?.name || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <StarRating value={session.feedback!.rating} isEditable={false} size={16} />
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        <p className="italic">"{session.feedback!.comment}"</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" disabled={isDeleting === session.id}>
                                                    {isDeleting === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action will permanently delete the review. The mentor's average rating will be recalculated. This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(session)} className="bg-destructive hover:bg-destructive/90">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            );
                        }) : (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No reviews found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AdminPage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const { data: allUsers = [], isLoading: isUsersLoading, refetch: refetchUsers } = useUsers();
    const { data: allSessions = [], isLoading: isSessionsLoading, refetch: refetchSessions } = useSessions();
    const [localUsers, setLocalUsers] = useState<User[]>([]);

    useEffect(() => {
        setLocalUsers(allUsers);
    }, [allUsers]);

    const handleMentorUpdate = (mentorId: string, isApproved: boolean) => {
        setLocalUsers(prev => prev.map(u => u.id === mentorId ? {...u, isApproved} : u));
    }

    // Protect the route client-side
    if (!loading && role !== 'admin') {
        router.replace('/dashboard');
        return (
            <div className="flex items-center justify-center h-full">
                 <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle className="mt-4">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            You do not have permission to view this page. You are being redirected.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Show a loading state or a blank page while auth is being checked
    if (loading || role !== 'admin') {
        return <DashboardSkeleton />;
    }

    const mentors = localUsers.filter(u => u.role === 'mentor') as Mentor[];
    const isLoading = isUsersLoading || isSessionsLoading;
    
    const stats = {
      totalUsers: allUsers?.length || 0,
      totalMentors: mentors.length,
      totalSessions: allSessions?.length || 0,
      pendingApprovals: mentors.filter(m => !m.isApproved).length
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tighter">Admin Panel</h1>
                <p className="text-muted-foreground">Oversee users and manage mentor applications.</p>
            </div>
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
                </CardContent>
                </Card>
            </div>
            
            <div className="space-y-6">
                <MentorsApprovalTable mentors={mentors} isLoading={isLoading} onMentorUpdate={handleMentorUpdate} />
                <ReviewModerationTable 
                    sessions={allSessions} 
                    users={allUsers} 
                    isLoading={isLoading} 
                    onReviewDeleted={() => { refetchSessions(); refetchUsers(); }}
                />
                <UsersTable users={allUsers} isLoading={isLoading} />
            </div>
        </div>
    );
}
