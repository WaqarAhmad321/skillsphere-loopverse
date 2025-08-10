

"use client"

import { createSession } from '@/lib/queries';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Star, User as UserIcon, LinkIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useState, useEffect } from 'react';
import { StarRating } from '@/components/star-rating';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import type { Mentor, Session } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { format as formatDate } from 'date-fns';
import { useMentor } from '@/hooks/use-mentors';
import { useSessionsByMentor } from '@/hooks/use-sessions';


const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

// Helper to get YYYY-MM-DD, ignoring timezone
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function MentorProfileSkeleton() {
    return (
        <div className="container mx-auto py-8">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <Skeleton className="w-24 h-24 rounded-full mb-4" />
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-5 w-32" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle><Skeleton className="h-6 w-20" /></CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20" />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><CardTitle><Skeleton className="h-7 w-32" /></CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle><Skeleton className="h-7 w-48" /></CardTitle></CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { data: mentor, isLoading: isMentorLoading } = useMentor(mentorId);
  const { data: sessions = [], isLoading: isSessionsLoading } = useSessionsByMentor(mentorId);
  
  const [isBooking, setIsBooking] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const isLoading = authLoading || isMentorLoading || isSessionsLoading;

  useEffect(() => {
    if (!isMentorLoading && (!mentor || !mentor.isApproved)) {
        notFound();
    }
  }, [mentor, isMentorLoading]);


  const handleBooking = async () => {
    if (!user || !date || !selectedTime || !mentor) return;

    if (user.role !== 'learner') {
      toast({
        variant: 'destructive',
        title: "Booking Failed",
        description: `Only learners can book sessions.`,
      });
      return;
    }

    setIsBooking(true);
    const result = await createSession({
        mentorId: mentor.id,
        learnerId: user.id,
        date: getLocalDateString(date), // Format as YYYY-MM-DD
        time: selectedTime,
    });

    if (result.success) {
        toast({
            title: "Booking Request Sent!",
            description: `Your request to book a session with ${mentor.name} has been sent for approval.`,
        });
        router.push('/dashboard');
    } else {
        toast({
            variant: 'destructive',
            title: "Booking Failed",
            description: result.error || "Could not request the session. Please try again.",
        });
    }
    setIsBooking(false);
    setSelectedTime(null);
  };

  if (isLoading) {
    return <MentorProfileSkeleton />;
  }

  if (!mentor) {
    return notFound();
  }

  const reviews = sessions.filter(s => s.feedback && s.status === 'completed').map(s => s.feedback!);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDateKey = date ? getLocalDateString(date) : null;
  const availableTimesForDate = selectedDateKey ? mentor.availability?.[selectedDateKey] || [] : [];


  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 border-2 border-primary mb-4">
                  <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
                  <AvatarFallback className="text-3xl">{getInitials(mentor.name)}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold">{mentor.name}</h1>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{mentor.rating.toFixed(1)} ({mentor.reviews} reviews)</span>
                </div>
                 {mentor.portfolioUrl && (
                    <Button variant="link" asChild className="mt-2">
                        <Link href={mentor.portfolioUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            View Portfolio
                        </Link>
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Teaching Subjects</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                  {mentor.subjects?.map(subject => (
                      <Badge key={subject} variant="secondary">{subject}</Badge>
                  ))}
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                  {mentor.skills?.map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>Interests</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                  {mentor.interests?.map(interest => (
                      <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
              </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader><CardTitle>About Me</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{mentor.bio}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" /> Request a Session
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 items-start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => { setDate(d); setSelectedTime(null); }}
                        className="rounded-md border"
                        disabled={(d) => d < today}
                    />
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Available Times</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {date ? formatDate(date, 'PPPP') : 'Select a date'}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {availableTimesForDate.length > 0 ?
                                availableTimesForDate.map(time => (
                                    <Button
                                        key={time}
                                        variant={selectedTime === time ? "default" : "outline"}
                                        onClick={() => setSelectedTime(time)}
                                    >
                                        {time}
                                    </Button>
                                ))
                                : <p className="col-span-3 text-sm text-muted-foreground">No availability on this date.</p>
                            }
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full mt-4" disabled={!selectedTime || !user || user.role !== 'learner'}>
                                    Request Session
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Confirm Your Request</DialogTitle>
                                <DialogDescription>
                                    You are about to request a session with {mentor.name} on {date?.toLocaleDateString()} at {selectedTime}. The mentor will need to approve it.
                                </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost" disabled={isBooking}>Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleBooking} disabled={isBooking}>
                                    {isBooking ? 'Sending...' : 'Confirm Request'}
                                </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                         {user?.role !== 'learner' && <p className="text-xs text-center mt-2 text-destructive">You must be logged in as a Learner to book a session.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Reviews ({reviews.length})</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {reviews.length > 0 ? reviews.map((review, index) => (
                        <div key={index} className="flex gap-4">
                           <Avatar>
                                <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">Anonymous Learner</p>
                                <StarRating value={review.rating} isEditable={false} size={16} />
                                <p className="text-sm text-muted-foreground mt-1 italic">"{review.comment}"</p>
                            </div>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No reviews yet.</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
