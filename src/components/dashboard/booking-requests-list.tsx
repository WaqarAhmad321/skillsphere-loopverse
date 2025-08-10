
"use client"

import { useState, useEffect } from "react";
import type { Session, User } from "@/types";
import { updateSessionStatus } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-users";

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

function RequestRow({ session, onSessionUpdate, mentorId }: { session: Session, onSessionUpdate: (sessionId: string, newStatus: 'upcoming' | 'cancelled') => void, mentorId: string }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const { data: learner } = useUser(session.learnerId);

    const handleUpdate = async (newStatus: 'upcoming' | 'cancelled') => {
        setIsUpdating(true);
        const result = await updateSessionStatus(session.id, newStatus, mentorId, session.date, session.time);
        if (result.success) {
            toast({
                title: `Request ${newStatus === 'upcoming' ? 'Accepted' : 'Declined'}`,
                description: `The session has been updated.`,
            });
            onSessionUpdate(session.id, newStatus);
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error || 'Could not update the session.',
            });
        }
        setIsUpdating(false);
    };
    
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={learner?.avatarUrl} alt={learner?.name} />
                        <AvatarFallback>{learner ? getInitials(learner.name) : 'L'}</AvatarFallback>
                    </Avatar>
                    <span>{learner?.name || '...'}</span>
                </div>
            </TableCell>
            <TableCell>{new Date(session.date).toLocaleDateString()} at {session.time}</TableCell>
            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    {isUpdating ? (
                        <Button size="sm" disabled>
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                    ) : (
                        <>
                            <Button size="sm" variant="outline" onClick={() => handleUpdate('upcoming')} disabled={isUpdating}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdate('cancelled')} disabled={isUpdating}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Decline
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function BookingRequestsList({ sessions, onSessionUpdate, mentorId }: { sessions: Session[], onSessionUpdate: (sessionId: string, newStatus: 'upcoming' | 'cancelled') => void, mentorId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>New Booking Requests</CardTitle>
                <CardDescription>You have {sessions.length} new session request(s) waiting for your approval.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Learner</TableHead>
                            <TableHead>Requested Date & Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map(session => (
                           <RequestRow 
                             key={session.id} 
                             session={session}
                             onSessionUpdate={onSessionUpdate} 
                             mentorId={mentorId} 
                            />
                         ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
