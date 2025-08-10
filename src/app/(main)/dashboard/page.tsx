"use client"

import { useAuth } from "@/lib/auth";
import type { Mentor } from "@/types";
import LearnerDashboard from "@/components/dashboard/learner-dashboard";
import MentorDashboard from "@/components/dashboard/mentor-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton";


export default function DashboardPage() {
  const { user, role, loading } = useAuth();

  if (loading || !user || !role) {
    return <DashboardSkeleton />
  }
  
  return (
    <div>
        {role === 'learner' && <LearnerDashboard user={user} />}
        {role === 'mentor' && <MentorDashboard user={user as Mentor} />}
        {role === 'admin' && <AdminDashboard user={user} />}
    </div>
  );
}
