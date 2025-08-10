
"use client"

import { useState, useEffect } from "react";
import type { Session, User } from "@/types";
import { addFeedbackToSession } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import { MessageSquare, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-users";

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

function FeedbackDialog({ session, mentor, onFeedbackSubmitted }: { session: Session, mentor: User | null, onFeedbackSubmitted: (sessionId: string, feedback: {rating: number, comment: string}) => void }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ variant: "destructive", title: "Rating Required", description: "Please select a star rating." });
            return;
        }
        setIsSubmitting(true);
        const result = await addFeedbackToSession(session.id, session.mentorId, { rating, comment });
        if (result.success) {
            toast({ title: "Feedback Submitted!", description: `Your feedback for the session with ${mentor?.name} has been recorded.` });
            onFeedbackSubmitted(session.id, {rating, comment});
            setIsOpen(false);
        } else {
            toast({ variant: "destructive", title: "Submission Failed", description: result.error || "Could not submit your feedback." });
        }
        setIsSubmitting(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Leave Feedback
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave Feedback for {mentor?.name}</DialogTitle>
                    <DialogDescription>
                        Your feedback helps other learners find the right mentor.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                        <p className="font-medium">Overall Rating</p>
                        <StarRating value={rating} onChange={setRating} size={32} />
                    </div>
                    <Textarea 
                        placeholder="Tell us about your experience (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Feedback
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SessionRow({ session, onFeedbackSubmitted }: { session: Session, onFeedbackSubmitted: (sessionId: string, feedback: {rating: number, comment: string}) => void }) {
    const { data: mentor } = useUser(session.mentorId);

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={mentor?.avatarUrl} />
                        <AvatarFallback>{mentor ? getInitials(mentor.name) : 'M'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{mentor?.name}</p>
                        <p className="text-sm text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                </div>
                {!session.feedback && (
                   <FeedbackDialog session={session} mentor={mentor || null} onFeedbackSubmitted={onFeedbackSubmitted} />
                )}
            </div>
            {session.feedback && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Your Feedback</p>
                    <StarRating value={session.feedback.rating} isEditable={false} size={20} />
                    <p className="text-sm text-muted-foreground mt-2 italic">"{session.feedback.comment}"</p>
                </div>
            )}
        </div>
    )
}

export default function CompletedLearnerSessionsList({ sessions, onSessionsUpdate, isLoading }: { sessions: Session[], onSessionsUpdate: (updatedSessions: Session[]) => void, isLoading: boolean }) {

    const handleFeedbackSubmitted = (sessionId: string, feedback: {rating: number, comment: string}) => {
        const updatedSessions = sessions.map(s => s.id === sessionId ? {...s, feedback} : s);
        onSessionsUpdate(updatedSessions);
    }

     if(isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle><Skeleton className="h-6 w-48" /></CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-9 w-36" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Completed Sessions</CardTitle>
            </CardHeader>
            <CardContent>
                {sessions.length > 0 ? (
                    <div className="space-y-4">
                    {sessions.map(session => (
                        <SessionRow 
                            key={session.id} 
                            session={session}
                            onFeedbackSubmitted={handleFeedbackSubmitted}
                        />
                    ))}
                    </div>
                ) : <p className="py-8 text-center text-muted-foreground">No completed sessions yet.</p>}
            </CardContent>
        </Card>
    );
}
