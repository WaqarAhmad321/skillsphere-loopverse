
"use client"

import { useState, useEffect } from "react";
import type { User, Mentor } from "@/types";
import { mentorSuggester } from "@/ai/flows/mentor-suggester";
import type { MentorSuggesterOutput } from "@/ai/schemas/mentor-suggester-schemas";
import { findMentorById } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

function RecommendedMentorCard({ mentor, reason }: { mentor: Mentor, reason: string }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
                        <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{mentor.name}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {mentor.subjects.slice(0, 2).map(subject => (
                                <Badge key={subject} variant="secondary">{subject}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground italic">"{reason}"</p>
            </CardContent>
            <CardFooter>
                <Button asChild size="sm" className="w-full">
                    <Link href={`/mentors/${mentor.id}`}>View Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function RecommendedMentors({ user }: { user: User }) {
    const [recommendations, setRecommendations] = useState<MentorSuggesterOutput['recommendations']>([]);
    const [recommendedMentors, setRecommendedMentors] = useState<Mentor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        async function fetchMentorDetails() {
            if (recommendations.length > 0) {
                const mentorPromises = recommendations.map(rec => findMentorById(rec.mentorId));
                const fetchedMentors = await Promise.all(mentorPromises);
                setRecommendedMentors(fetchedMentors.filter(m => m !== null) as Mentor[]);
            }
        }
        fetchMentorDetails();
    }, [recommendations]);


    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setHasFetched(true);
        try {
            const result = await mentorSuggester({
                goals: user.bio || "",
                interests: user.interests || [],
            });
            setRecommendations(result.recommendations || []);
        } catch (error) {
            console.error("Failed to get mentor recommendations:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const hasProfileInfo = user.bio || (user.interests && user.interests.length > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    AI Mentor Recommendations
                </CardTitle>
                <CardDescription>
                    {hasProfileInfo ? "Get personalized mentor suggestions based on your goals and interests." : "Add your goals and interests to your profile to get personalized recommendations."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasFetched ? (
                    isLoading ? (
                        <div className="grid md:grid-cols-3 gap-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : (
                        recommendedMentors.length > 0 ? (
                           <div className="grid md:grid-cols-3 gap-4">
                                {recommendedMentors.map(mentor => {
                                    const rec = recommendations.find(r => r.mentorId === mentor.id);
                                    if (!rec) return null;
                                    return <RecommendedMentorCard key={mentor.id} mentor={mentor} reason={rec.reason} />
                                })}
                           </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Could not find any recommendations at this time. Try updating your profile.</p>
                        )
                    )
                ) : (
                     <div className="text-center py-8">
                        <Button onClick={handleGetRecommendations} disabled={isLoading || !hasProfileInfo}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Get Recommendations
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
