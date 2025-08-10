import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BookOpen, Users, BrainCircuit } from 'lucide-react';
import Logo from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/login" className="text-sm font-medium">
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Unlock Your Potential with SkillVerse
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Connect with expert mentors, schedule sessions, and accelerate your learning journey with our AI-powered platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/signup">Find a Mentor</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  A Platform Built for Growth
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to find the right mentor and excel in your chosen field.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <div className="grid gap-1 text-center">
                <Users className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Mentor Discovery</h3>
                <p className="text-sm text-muted-foreground">
                  Easily find and filter mentors by skill, rating, and availability.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold">Live Video Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Connect face-to-face with mentors using our built-in video calling.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <BrainCircuit className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold">AI Session Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered summaries of your chat history to review key topics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SkillVerse. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
