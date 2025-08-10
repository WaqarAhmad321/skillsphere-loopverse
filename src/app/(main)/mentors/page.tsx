
"use client"

import { useState, useMemo, useEffect } from 'react';
import type { Mentor } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useMentors } from '@/hooks/use-mentors';

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

// A custom hook for debouncing a value
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

function MentorCard({ mentor }: { mentor: Mentor }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row gap-4 items-center">
        <Avatar className="w-16 h-16 border">
          <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
          <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{mentor.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {mentor.rating.toFixed(1)} ({mentor.reviews} reviews)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
            {mentor.subjects.slice(0, 3).map(subject => (
                <Badge key={subject} variant="secondary">{subject}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href={`/mentors/${mentor.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function MentorPageSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex-row gap-4 items-center">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-14" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

export default function MentorsPage() {
  const { data: mentors = [], isLoading } = useMentors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    mentors.forEach(mentor => {
        mentor.subjects.forEach(skill => skills.add(skill));
    });
    return Array.from(skills).sort();
  }, [mentors]);

  const filteredMentors = useMemo(() => {
    let filtered = [...mentors];

    if (debouncedSearchTerm) {
        filtered = filtered.filter(mentor => 
            mentor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            mentor.bio?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }

    if (selectedSkill !== 'all') {
        filtered = filtered.filter(mentor => mentor.subjects.includes(selectedSkill));
    }
    
    if (sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'reviews') {
        filtered.sort((a, b) => b.reviews - a.reviews);
    }

    return filtered;
  }, [debouncedSearchTerm, selectedSkill, sortBy, mentors]);


  return (
    <div className="container mx-auto py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Find Your Mentor</h1>
        <p className="text-muted-foreground md:text-xl/relaxed">
          Browse our community of expert mentors to find the perfect match for your learning goals.
        </p>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-card sticky top-16 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
                placeholder="Search by name or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    {allSkills.map(skill => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="rating">Sort by Rating</SelectItem>
                    <SelectItem value="reviews">Sort by Reviews</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {isLoading ? <MentorPageSkeleton /> : (
        <>
            {filteredMentors.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMentors.map(mentor => (
                        <MentorCard key={mentor.id} mentor={mentor} />
                    ))}
                </div>
            ) : (
                <div className="text-center col-span-full py-16">
                    <p className="text-lg font-medium">No mentors found</p>
                    <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
}
