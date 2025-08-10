 "use client"
import Logo from '@/components/logo';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
     return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
       <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
