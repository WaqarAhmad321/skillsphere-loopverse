
"use client"

import type { Session, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TeachingTipsCard from "./teaching-tips-card";
import { useAuth } from "@/lib/auth";
import { useUser } from "@/hooks/use-users";

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';


function SessionCard({ session }: { session: Session }) {
    const { user: mentor } = useAuth();
    const { data: learner } = useUser(session.learnerId);

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-secondary/50">
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={learner?.avatarUrl} />
                        <AvatarFallback>{learner ? getInitials(learner.name) : 'L'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{learner?.name}</p>
                        <p className="text-sm text-muted-foreground">{new Date(session.date).toLocaleDateString()} at {session.time}</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href={`/session/${session.id}`}>Join Session <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
            <div className="p-4">
                {learner && mentor && <TeachingTipsCard learner={learner} mentor={mentor}/>}
            </div>
        </Card>
    );
}


export default function UpcomingMentorSessionsList({ sessions, isLoading }: { sessions: Session[], isLoading: boolean }) {
    if(isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-28" />
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Upcoming Sessions</CardTitle>
                <CardDescription>Here are your confirmed sessions. Prepare to connect and share your knowledge!</CardDescription>
            </CardHeader>
            <CardContent>
                {sessions.length > 0 ? (
                    <div className="space-y-6">
                    {sessions.map(session => (
                        <SessionCard key={session.id} session={session} />
                    ))}
                    </div>
                ) : <p className="py-8 text-center text-muted-foreground">No upcoming sessions.</p>}
            </CardContent>
        </Card>
    );
}
