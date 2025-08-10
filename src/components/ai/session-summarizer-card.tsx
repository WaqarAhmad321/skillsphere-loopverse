
"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sessionSummarizer } from "@/ai/flows/session-summarizer";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/types";

const summarizerSchema = z.object({
  sessionKeywords: z.string().min(10, {
    message: "Please enter at least 10 characters of keywords.",
  }),
});

interface SessionSummarizerCardProps {
  session: Session;
  onSummaryGenerated: (sessionId: string, summary: string, keywords: string) => void;
}

export default function SessionSummarizerCard({ session, onSummaryGenerated }: SessionSummarizerCardProps) {
  const [summary, setSummary] = useState(session.summary || "");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof summarizerSchema>>({
    resolver: zodResolver(summarizerSchema),
    defaultValues: {
      sessionKeywords: session.keywords || "",
    },
  });

  async function onSubmit(values: z.infer<typeof summarizerSchema>) {
    setIsLoading(true);
    setSummary("");
    try {
      const result = await sessionSummarizer(values);
      if (result.summary) {
        setSummary(result.summary);
        onSummaryGenerated(session.id, result.summary, values.sessionKeywords);
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" />
          AI Session Summarizer
        </CardTitle>
        <CardDescription>
          Enter keywords from the session to generate a summary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="sessionKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Keywords</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., React hooks, state management, context API, custom hooks..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Generating..." : "Generate Summary"}
            </Button>
          </form>
        </Form>

        {(isLoading || summary) && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Generated Summary:</h3>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : (
                <div className="prose prose-sm max-w-none text-muted-foreground p-4 bg-secondary rounded-md">
                    <p>{summary}</p>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
