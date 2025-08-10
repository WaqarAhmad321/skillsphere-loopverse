
"use client"

import type { Session, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/hooks/use-users";

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';


function SessionRow({ session }: { session: Session }) {
    const { data: mentor } = useUser(session.mentorId);

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={mentor?.avatarUrl} />
                    <AvatarFallback>{mentor ? getInitials(mentor.name) : 'M'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{mentor?.name || '...'}</p>
                    <p className="text-sm text-muted-foreground">{new Date(session.date).toLocaleDateString()} at {session.time}</p>
                </div>
            </div>
            <Button asChild>
                <Link href={`/session/${session.id}`}>Join Session <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
    );
}

export default function UpcomingLearnerSessionsList({ sessions, isLoading }: { sessions: Session[], isLoading: boolean }) {
    if(isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle><Skeleton className="h-6 w-48" /></CardTitle></CardHeader>
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
            </CardHeader>
            <CardContent>
                {sessions.length > 0 ? (
                    <div className="space-y-4">
                    {sessions.map(session => (
                        <SessionRow key={session.id} session={session} />
                    ))}
                    </div>
                ) : <p className="py-8 text-center text-muted-foreground">No upcoming sessions. Time to book one!</p>}
            </CardContent>
        </Card>
    )
}
