
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, UserCircle, Bell, AlertTriangle } from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser && (authUser.role === 'student' || authUser.role === 'pending')) {
        setStudentUser(authUser);
      } else if (authUser) { // User exists but not student/pending, redirect
        router.push('/dashboard'); // Let dashboard handle role-based redirect
      } else { // No user
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentUser) {
    // This should be caught by useEffect redirect, but as a fallback
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-6">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPendingApproval = studentUser.role === 'pending' && !studentUser.rejectionReason;
  const isRejected = studentUser.role === 'pending' && studentUser.rejectionReason;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Student Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome, {studentUser.displayName || studentUser.usn}! Access your resources and campus updates.
        </p>
        {studentUser.branch && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Branch: {studentUser.branch}</p>}
      </div>

      {isPendingApproval && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300 shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Bell className="h-6 w-6 text-yellow-600" />
            <CardTitle className="text-lg text-yellow-700">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              Your registration is currently under review by the administration. 
              Please check back later for an update on your account status. You will be able to access all features once approved.
            </p>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="mb-6 bg-red-50 border-red-300 shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-lg text-red-700">Account Registration Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              Unfortunately, your registration could not be approved at this time.
            </p>
            <p className="text-sm text-red-700 mt-1">
              <span className="font-semibold">Reason:</span> {studentUser.rejectionReason}
            </p>
            <p className="text-sm text-red-700 mt-2">
              If you believe this is an error, please contact the college administration.
            </p>
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard
          title="My Profile"
          description="View and update your personal information and password."
          icon={<UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/profile/settings"
          actionText="Manage Profile"
          disabled={isRejected}
        />
        <ActionCard
          title="Campus Feed"
          description="See the latest news, events, and announcements."
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 sm:h-10 sm:w-10 text-accent"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V9s1-1 4-1 5 2 5 2"/></svg>}
          link="/feed"
          actionText="View Feed"
           disabled={isPendingApproval || isRejected}
        />
        {/* Add more student-specific cards here as features are developed */}
        {/* Example:
        <ActionCard
          title="My Courses"
          description="Access your course materials and schedules."
          icon={<BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/student/courses"
          actionText="View Courses"
          disabled={isPendingApproval || isRejected}
        />
        <ActionCard
          title="Results"
          description="Check your academic results and performance."
          icon={<BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/student/results"
          actionText="View Results"
          disabled={isPendingApproval || isRejected}
        />
        */}
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  actionText: string;
  disabled?: boolean;
}

function ActionCard({ title, description, icon, link, actionText, disabled = false }: ActionCardProps) {
  return (
    <Card className={`shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col ${disabled ? 'opacity-60 bg-muted/50' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 sm:p-3 rounded-full ${disabled ? 'bg-muted' : 'bg-accent/10'}`}>{icon}</div>
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <Link href={disabled ? "#" : link} className={`w-full mt-auto ${disabled ? 'pointer-events-none' : ''}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base" disabled={disabled}>
            {actionText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
