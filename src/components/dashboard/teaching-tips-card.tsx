
"use client";

import { useState } from "react";
import type { User } from "@/types";
import { teachingTipsSuggester } from "@/ai/flows/teaching-tips-suggester";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2 } from "lucide-react";

export default function TeachingTipsCard({ learner, mentor }: { learner: User, mentor: User }) {
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const handleGetTips = async () => {
    setIsLoading(true);
    setHasFetched(true);
    try {
      const result = await teachingTipsSuggester({
        learnerId: learner.id,
        mentorSubjects: (mentor as any).subjects || [],
      });
      setTips(result.tips || []);
    } catch (error) {
      console.error("Failed to get teaching tips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            AI Teaching Assistant
        </h4>
      {hasFetched ? (
        isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          tips.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Could not generate tips at this time.
            </p>
          )
        )
      ) : (
        <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
                Learner's Goal: <span className="italic">"{learner.bio || 'Not specified'}"</span>
            </p>
            <Button onClick={handleGetTips} disabled={isLoading} size="sm" variant="outline">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get AI Teaching Tips
            </Button>
        </div>
      )}
    </div>
  );
}
