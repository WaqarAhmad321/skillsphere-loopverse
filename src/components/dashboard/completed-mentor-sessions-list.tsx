
"use client"

import type { Session, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-users";
import { BrainCircuit } from "lucide-react";

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

function SessionCard({ session }: { session: Session }) {
    const { data: learner } = useUser(session.learnerId);

    return (
        <Card>
            <CardHeader>
            <div className="flex items-center gap-3">
                <Avatar>
                <AvatarImage src={learner?.avatarUrl} />
                <AvatarFallback>{learner ? getInitials(learner?.name || '') : 'L'}</AvatarFallback>
                </Avatar>
                <div>
                <CardTitle className="text-base">{learner?.name}</CardTitle>
                <CardDescription>{new Date(session.date).toLocaleDateString()}</CardDescription>
                </div>
            </div>
            </CardHeader>
            <CardContent>
            {session.feedback && (
                <>
                <p className="text-sm font-semibold mb-2">Learner Feedback</p>
                <StarRating value={session.feedback.rating} isEditable={false} size={20} />
                <p className="text-sm text-muted-foreground mt-2 italic">"{session.feedback.comment}"</p>
                </>
            )}
            <Separator className="my-4" />
             <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                    <BrainCircuit className="h-4 w-4" />
                    AI-Generated Summary
                </h4>
                {session.summary ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground p-3 bg-secondary rounded-md">
                        <p>{session.summary}</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">Summary is being generated...</p>
                )}
            </div>
            </CardContent>
        </Card>
    );
}

export default function CompletedMentorSessionsList({ sessions, isLoading }: { sessions: Session[], isLoading: boolean }) {

     if(isLoading) {
        return (
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                               <Skeleton className="h-5 w-24" />
                               <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-44 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                               <Skeleton className="h-5 w-24" />
                               <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-44 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Session History & Summaries</CardTitle>
                <CardDescription>Review past sessions and their automatically generated AI summaries.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                {sessions.map(session => (
                    <SessionCard 
                        key={session.id} 
                        session={session} 
                    />
                ))}
                {sessions.length === 0 && <p className="py-8 text-center text-muted-foreground col-span-full">No completed sessions yet.</p>}
            </CardContent>
        </Card>
    );
}
