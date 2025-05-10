
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  UserCircle,
  Bell,
  AlertTriangle,
  Newspaper,
  BookOpen,
  CalendarClock,
  CreditCard,
  MessageSquareWarning,
  Wrench,
  FileText,
  ArrowRight,
} from "lucide-react";
import type { Post } from "@/types";
import { DownloadAppSection } from "@/components/layout/download-app-section";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";
import { RecentPostItem } from '@/components/dashboard/RecentPostItem';
import { ActionCard } from '@/components/dashboard/ActionCard';

// StudentDashboardPage Component
export default function StudentDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (authUser && (authUser.role === 'student' || authUser.role === 'pending')) {
        setStudentUser(authUser);
        
        if (typeof window !== 'undefined') {
          const postsStr = localStorage.getItem('apsconnect_posts'); 
          const allPosts: Post[] = postsStr ? JSON.parse(postsStr) : [];
          
          let relevantPosts = allPosts;
          if (authUser.role === 'student' && authUser.branch) {
            const studentBranch = authUser.branch;
            relevantPosts = allPosts.filter(post => 
              !post.targetBranches || post.targetBranches.length === 0 || 
              post.targetBranches.includes(studentBranch)
            );
          } else { 
            relevantPosts = allPosts.filter(post => !post.targetBranches || post.targetBranches.length === 0);
          }

          relevantPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentPosts(relevantPosts.slice(0, 3));
        }

      } else if (authUser) { 
        router.push('/dashboard'); 
      } else { 
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!studentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-6 border-primary text-primary hover:bg-primary/10">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPendingApproval = studentUser.role === 'pending' && !studentUser.rejectionReason;
  const isRejected = studentUser.role === 'pending' && studentUser.rejectionReason;
  const isApprovedStudent = studentUser.role === 'student';

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
          Hello, {studentUser.displayName || studentUser.usn}!
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Welcome to your Student Dashboard. Access resources and stay updated.
        </p>
        {studentUser.branch && <p className="text-sm text-muted-foreground mt-1">Branch: <span className="font-semibold">{studentUser.branch}</span></p>}
      </header>

      {isPendingApproval && (
        <Card className="mb-8 bg-yellow-50 border-2 border-yellow-400 shadow-lg dark:bg-yellow-900/30 dark:border-yellow-600 rounded-xl">
          <CardHeader className="flex flex-row items-center gap-4 pb-3 pt-5 px-5">
            <Bell className="h-8 w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <CardTitle className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">Account Pending Approval</CardTitle>
              <CardDescription className="text-sm text-yellow-600 dark:text-yellow-400">
                Your registration is under review. Full access will be granted upon approval.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {isRejected && (
        <Card className="mb-8 bg-red-50 border-2 border-red-400 shadow-lg dark:bg-red-900/30 dark:border-red-600 rounded-xl">
          <CardHeader className="flex flex-row items-center gap-4 pb-3 pt-5 px-5">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
             <div>
              <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-300">Account Registration Rejected</CardTitle>
               <CardDescription className="text-sm text-red-600 dark:text-red-400">
                Reason: {studentUser.rejectionReason}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm text-red-700 dark:text-red-400">
              If you believe this is an error, please contact the college administration for assistance.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-6 text-center sm:text-left">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="My Profile"
            description="View and update your personal information and password."
            icon={<UserCircle className="h-10 w-10 text-accent" />}
            link="/profile/settings"
            actionText="Manage Profile"
            disabled={isRejected}
          />
           <ActionCard
            title="View Timetable"
            description="Check your class and lab schedules for the current semester."
            icon={<CalendarClock className="h-10 w-10 text-accent" />}
            link="/student/timetable"
            actionText="View Timetable"
            disabled={isPendingApproval || isRejected}
          />
           <ActionCard
            title="Study Materials"
            description="Access notes, presentations, and other materials shared by faculty."
            icon={<BookOpen className="h-10 w-10 text-accent" />}
            link="/student/study-materials"
            actionText="View Materials"
            disabled={isPendingApproval || isRejected}
          />
          <ActionCard
            title="Digital ID Card"
            description="Access your digital student identification card."
            icon={<CreditCard className="h-10 w-10 text-accent" />}
            link="/student/digital-id"
            actionText="View Digital ID"
            disabled={isPendingApproval || isRejected}
          />
           <ActionCard
            title="Report a Concern"
            description="Submit anonymous feedback or report issues to faculty/admin."
            icon={<MessageSquareWarning className="h-10 w-10 text-accent" />}
            link="/student/report-concern"
            actionText="Submit Report"
            disabled={isRejected} 
          />
          <ActionCard
            title="Useful Tools"
            description="Access various utility tools like scanners and converters."
            icon={<Wrench />}
            link="/tools"
            actionText="Access Tools"
            disabled={isPendingApproval || isRejected}
          />
        </div>
      </section>
      
      {isApprovedStudent && (
        <section className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-primary">Recent Updates</h2>
            <Link href="/feed" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map(post => (
                <RecentPostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-border/50 rounded-xl">
              <CardContent className="py-10 text-center">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No recent posts relevant to you.</p>
                <p className="text-sm text-muted-foreground mt-1">The campus feed might have more updates.</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
      <DownloadAppSection />
    </div>
  );
}

