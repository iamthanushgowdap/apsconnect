
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, UserCircle, Bell, AlertTriangle, Newspaper, BookOpen, CalendarDays, FileText } from "lucide-react";
import type { Post, Branch } from "@/types";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface RecentPostItemProps {
  post: Post;
}

function RecentPostItem({ post }: RecentPostItemProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-md font-semibold text-primary leading-tight line-clamp-2">
            {post.title}
          </CardTitle>
          <Badge variant={post.category === "event" || post.category === "schedule" ? "default" : "secondary"} className="text-xs whitespace-nowrap ml-2 shrink-0">
            {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          By {post.authorName} - {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="pt-3">
        {/* Link to full post view could be added here, e.g., /feed#post-id or /post/[id] if a dedicated page exists */}
        <Link href="/feed" className="w-full">
          <Button variant="outline" size="sm" className="w-full">Read More on Feed</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}


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
        
        // Fetch and filter recent posts
        if (typeof window !== 'undefined') {
          const postsStr = localStorage.getItem('campus_connect_posts');
          const allPosts: Post[] = postsStr ? JSON.parse(postsStr) : [];
          
          let relevantPosts = allPosts;
          if (authUser.role === 'student' && authUser.branch) {
            const studentBranch = authUser.branch;
            relevantPosts = allPosts.filter(post => 
              post.targetBranches.length === 0 || 
              post.targetBranches.includes(studentBranch)
            );
          } else { // For pending users or users without a branch (though should have one)
            relevantPosts = allPosts.filter(post => post.targetBranches.length === 0);
          }

          relevantPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
          setRecentPosts(relevantPosts.slice(0, 3));
        }

      } else if (authUser) { // User exists but not student/pending, redirect
        router.push('/dashboard'); 
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
  const isApprovedStudent = studentUser.role === 'student';

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
        <Card className="mb-6 bg-yellow-50 border-yellow-300 shadow-md dark:bg-yellow-900/30 dark:border-yellow-700">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-lg text-yellow-700 dark:text-yellow-300">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Your registration is currently under review by the administration. 
              Please check back later for an update on your account status. You will be able to access all features once approved.
            </p>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="mb-6 bg-red-50 border-red-300 shadow-md dark:bg-red-900/30 dark:border-red-700">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <CardTitle className="text-lg text-red-700 dark:text-red-300">Account Registration Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 dark:text-red-400">
              Unfortunately, your registration could not be approved at this time.
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              <span className="font-semibold">Reason:</span> {studentUser.rejectionReason}
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-2">
              If you believe this is an error, please contact the college administration.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <ActionCard
          title="My Profile"
          description="View and update your personal information and password."
          icon={<UserCircle className="h-8 w-8 text-accent" />}
          link="/profile/settings"
          actionText="Manage Profile"
          disabled={isRejected}
        />
        <ActionCard
          title="Campus Feed"
          description="See the latest news, events, and announcements."
          icon={<Newspaper className="h-8 w-8 text-accent" />}
          link="/feed"
          actionText="View Feed"
          disabled={isPendingApproval || isRejected}
        />
      </div>

      {/* Recent Posts Section */}
      {isApprovedStudent && (
        <section className="mt-10">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-primary mb-6">Recent Updates</h2>
          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map(post => (
                <RecentPostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-md text-muted-foreground">No recent posts available for you at the moment.</p>
                <p className="text-sm text-muted-foreground">Check the full <Link href="/feed" className="text-primary hover:underline">Campus Feed</Link> for all updates.</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
      
      {/* Placeholder for other dashboard sections */}
      {/* 
      {isApprovedStudent && (
        <section className="mt-12">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-primary mb-6">My Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResourceCard title="My Courses" description="Access your course materials and schedules." icon={<BookOpen className="h-8 w-8 text-accent" />} link="#" />
            <ResourceCard title="Events Calendar" description="Upcoming campus events and deadlines." icon={<CalendarDays className="h-8 w-8 text-accent" />} link="#" />
          </div>
        </section>
      )}
      */}

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
    <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col ${disabled ? 'opacity-60 bg-muted/50 dark:bg-muted/20' : 'bg-card'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-3 mb-3">
          <div className={`p-2 sm:p-3 rounded-full ${disabled ? 'bg-muted dark:bg-muted/30' : 'bg-accent/10 dark:bg-accent/20'}`}>{icon}</div>
          <div>
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end mt-auto">
        <Link href={disabled ? "#" : link} className={`w-full ${disabled ? 'pointer-events-none' : ''}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base" disabled={disabled}>
            {actionText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/*
interface ResourceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

function ResourceCard({ title, description, icon, link }: ResourceCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center space-x-4 pb-3">
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          {icon}
        </div>
        <div>
          <CardTitle className="text-md font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <Link href={link} className="w-full">
          <Button variant="outline" size="sm" className="w-full">Access Resource</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
*/

