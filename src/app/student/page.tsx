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
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShieldCheck,
  UserCircle,
  Bell,
  AlertTriangle,
  Newspaper,
  BookOpen,
  CalendarDays,
  FileText,
  ArrowRight,
  Paperclip
} from "lucide-react";
import type { Post } from "@/types";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface RecentPostItemProps {
  post: Post;
}

function RecentPostItem({ post }: RecentPostItemProps) {
  const categoryIcons: Partial<Record<Post['category'], React.ElementType>> = {
    event: CalendarDays,
    news: Newspaper,
    link: Paperclip,
    note: BookOpen,
    schedule: CalendarDays,
  };

  const IconComponent = post?.category && categoryIcons[post.category] ? categoryIcons[post.category] : FileText;

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col h-full bg-background border border-border/50 rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <IconComponent className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary leading-tight line-clamp-2">
              {post.title}
            </CardTitle>
          </div>
          <Badge
            variant={post.category === "event" || post.category === "schedule" ? "default" : "secondary"}
            className="text-xs ml-2 px-2 py-1 rounded-full"
          >
            {post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : "Other"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          By {post.authorName || "Unknown"} — {post.createdAt ? formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true }) : "some time ago"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4 flex-grow">
        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
          {post.content || "No content available."}
        </p>
      </CardContent>
      <CardFooter className="pt-3 px-6 pb-5 border-t border-border/50">
        <Link href="/feed" className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-between text-primary hover:bg-primary/10 group">
            Read More on Feed <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// StudentDashboardPage Component
const StudentDashboardPage = () => {
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
          const postsStr = localStorage.getItem('campus_connect_posts');
          const allPosts: Post[] = postsStr ? JSON.parse(postsStr) : [];
          
          let relevantPosts = allPosts;
          if (authUser.role === 'student' && authUser.branch) {
            const studentBranch = authUser.branch;
            relevantPosts = allPosts.filter(post => 
              post.targetBranches.length === 0 || 
              post.targetBranches.includes(studentBranch)
            );
          } else { 
            relevantPosts = allPosts.filter(post => post.targetBranches.length === 0);
          }

          relevantPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
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
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentUser) {
    return (
      <div className="text-center">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            title="My Profile"
            description="View and update your personal information and password."
            icon={<UserCircle className="h-10 w-10 text-accent" />}
            link="/profile/settings"
            actionText="Manage Profile"
            disabled={isRejected}
          />
           {/* Campus Feed card removed from here */}
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
    <Card className={`shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col rounded-xl border ${disabled ? 'opacity-60 bg-muted/30 dark:bg-muted/10 pointer-events-none' : 'bg-card border-border/70 hover:border-primary/50'}`}>
      <CardHeader className="pb-4 pt-5 px-5">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${disabled ? 'bg-muted dark:bg-muted/30' : 'bg-accent/10 dark:bg-accent/20'}`}>
            {React.cloneElement(icon as React.ReactElement, { className: `h-10 w-10 ${disabled ? 'text-muted-foreground' : 'text-accent'}`})}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="text-sm mt-1 text-muted-foreground">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end mt-auto px-5 pb-5">
        <Link href={disabled ? "#" : link} className={`w-full ${disabled ? 'pointer-events-none' : ''}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-3 rounded-lg" disabled={disabled}>
            {actionText} <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default StudentDashboardPage;
