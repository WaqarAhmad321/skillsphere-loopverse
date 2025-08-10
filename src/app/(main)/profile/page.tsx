
"use client"

import { useAuth } from "@/lib/auth";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { updateUserProfile } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import type { Mentor } from "@/types";
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { XIcon, PlusIcon } from 'lucide-react';
import { format as formatDate } from 'date-fns';


const profileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  bio: z.string().optional(),
  skills: z.string().optional(),
  interests: z.string().optional(),
  subjects: z.string().optional(),
  portfolioUrl: z.string().url("Please enter a valid URL.").or(z.literal("")).optional(),
});

// Helper to get YYYY-MM-DD, ignoring timezone
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function AvailabilityManager({ availability, onUpdate }: { availability: Record<string, string[]>, onUpdate: (data: any) => Promise<any> }) {
  const [currentAvailability, setCurrentAvailability] = useState(availability || {});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState("");
  const { toast } = useToast();

   // Sync with parent state when prop changes
  useEffect(() => {
    setCurrentAvailability(availability || {});
  }, [availability]);


  const handleAddTime = () => {
    if (!selectedDate || !newTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      toast({
        variant: "destructive",
        title: "Invalid Time",
        description: "Please select a date and enter a valid time in HH:MM format.",
      });
      return;
    }

    const dateKey = getLocalDateString(selectedDate);
    const updatedAvailability = { ...currentAvailability };
    const timesForDate = updatedAvailability[dateKey] || [];
    if (!timesForDate.includes(newTime)) {
      updatedAvailability[dateKey] = [...timesForDate, newTime].sort();
    }
    
    setCurrentAvailability(updatedAvailability);
    setNewTime("");
  };

  const handleRemoveTime = (date: string, time: string) => {
    const updatedAvailability = { ...currentAvailability };
    updatedAvailability[date] = updatedAvailability[date].filter(t => t !== time);
    if (updatedAvailability[date].length === 0) {
      delete updatedAvailability[date];
    }
    setCurrentAvailability(updatedAvailability);
  };
  
  const handleSaveChanges = async () => {
     try {
      await onUpdate({ availability: currentAvailability });
      toast({ title: "Success", description: "Your availability has been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
    }
  };

  const selectedDateKey = selectedDate ? getLocalDateString(selectedDate) : null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Availability</CardTitle>
        <CardDescription>Select a date and add your available time slots.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
             disabled={(d) => d < today}
          />
        </div>
        <div>
          {selectedDate && (
            <div>
              <h4 className="font-semibold mb-2">Available times for {formatDate(selectedDate, 'PPPP')}</h4>
              <div className="flex gap-2 mb-4">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-40"
                />
                <Button size="icon" onClick={handleAddTime}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {(selectedDateKey && currentAvailability[selectedDateKey] || []).map(time => (
                  <div key={time} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                    <span>{time}</span>
                     <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveTime(selectedDateKey!, time)}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 {(!selectedDateKey || !currentAvailability[selectedDateKey] || currentAvailability[selectedDateKey].length === 0) && (
                    <p className="text-sm text-muted-foreground">No slots added for this day.</p>
                 )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
       <CardFooter>
        <Button onClick={handleSaveChanges}>Save Availability</Button>
      </CardFooter>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, role, loading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
      skills: '',
      interests: '',
      subjects: '',
      portfolioUrl: '',
    },
  });
  
  // Set form values once user data is available
 useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        interests: user.interests?.join(', ') || '',
        subjects: (user as Mentor)?.subjects?.join(', ') || '',
        portfolioUrl: (user as Mentor)?.portfolioUrl || '',
      });
    }
  }, [user, form.reset]);


  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    const result = await updateUserProfile(user.id, data);
    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      await refreshAuth();
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.error || "Could not update your profile.",
      });
    }
    setIsSubmitting(false);
  };
  
   const handleUpdate = async (data: any) => {
    if (!user) return;
    setIsSubmitting(true);
    const result = await updateUserProfile(user.id, data);
     if (result.success) {
       await refreshAuth(); // This will re-fetch the user and update the context
     }
     setIsSubmitting(false);
     return result;
  }

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
             <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account and personal information.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{role === 'mentor' ? 'Professional Bio' : 'Learning Goals'}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={role === 'mentor' ? "Tell learners about your experience and teaching style." : "What are your learning goals? What do you want to achieve?"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {role === 'mentor' && (
                <>
                 <FormField
                    control={form.control}
                    name="subjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teaching Subjects</FormLabel>
                        <FormControl>
                          <Input placeholder="Web Development, UI/UX Design..." {...field} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">Enter subjects separated by commas.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="portfolioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-portfolio.com" {...field} />
                        </FormControl>
                         <p className="text-sm text-muted-foreground">Link to your personal website, LinkedIn, or GitHub.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
               )}
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="React, Python, Figma..." {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Enter skills separated by commas.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests</FormLabel>
                    <FormControl>
                      <Input placeholder="Hiking, Reading, Cooking..." {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Enter interests separated by commas.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {role === 'mentor' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Mentor Status</CardTitle>
            </CardHeader>
            <CardContent>
              {(user as Mentor).isApproved ? (
                <Badge>Approved</Badge>
              ) : (
                <Badge variant="destructive">Pending Approval</Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Your mentor profile is currently {(user as Mentor).isApproved ? "visible to learners." : "under review by our admin team."}
              </p>
            </CardContent>
          </Card>
          <AvailabilityManager availability={(user as Mentor).availability || {}} onUpdate={handleUpdate} />
        </>
      )}
    </div>
  );
}
