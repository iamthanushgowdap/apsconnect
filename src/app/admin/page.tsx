
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FilePlus2, Users, Settings, ShieldCheck, UserCircle, ArrowRight, Newspaper, CalendarClock, BookOpen, ListChecks, Wrench } from "lucide-react"; // Changed Tool to Wrench
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { UserProfile, Post } from "@/types";
import { DownloadAppSection } from "@/components/layout/download-app-section";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";


interface MockUserFromAuth { 
  displayName: string | null;
  email: string | null; 
  role: 'admin' | 'student' | 'pending' | 'faculty';
  usn?: string; 
}

interface AdminStat {
  title: string;
  value: string;
  icon: React.ReactElement; 
  breakdown?: string; 
  bgColorClass: string; 
  iconColorClass: string; 
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<MockUserFromAuth | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [contentPostsCount, setContentPostsCount] = useState(0);


  useEffect(() => {
    if (!authLoading) {
      if (authUser && authUser.role === 'admin') {
        setUser(authUser as MockUserFromAuth); 
        
        if (typeof window !== 'undefined') {
          let currentStudentCount = 0;
          let currentFacultyCount = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('apsconnect_user_')) { 
              try {
                const profile = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
                if (profile.role === 'student' && profile.isApproved) { 
                  currentStudentCount++;
                } else if (profile.role === 'faculty') {
                  currentFacultyCount++;
                }
              } catch (e) { /* ignore parse errors */ }
            }
          }
          setStudentCount(currentStudentCount);
          setFacultyCount(currentFacultyCount);

          const postsStr = localStorage.getItem('apsconnect_posts'); 
          const posts: Post[] = postsStr ? JSON.parse(postsStr) : [];
          setContentPostsCount(posts.length);
        }

      } else if (authUser && authUser.role !== 'admin'){
        setUser(null); 
        router.push('/dashboard'); 
      } else { 
        setUser(null);
        router.push('/login'); 
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading, router]);


  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
         <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) { 
    return (
       <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto shadow-2xl border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
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

  const adminStats: AdminStat[] = [
    { 
      title: "Total Users", 
      value: (studentCount + facultyCount).toString(), 
      breakdown: `Students: ${studentCount}, Faculty: ${facultyCount}`,
      icon: <Users className="h-6 w-6" />,
      bgColorClass: "bg-accent/10 dark:bg-accent/20",
      iconColorClass: "text-accent",
    },
    { 
      title: "Content Posts", 
      value: contentPostsCount.toString(), 
      icon: <FilePlus2 className="h-6 w-6" />,
      bgColorClass: "bg-primary/10 dark:bg-primary/20",
      iconColorClass: "text-primary",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <header className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">Admin Dashboard</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Manage APSConnect content, users, and settings.</p>
      </header>

      <Card className="shadow-xl rounded-xl border border-border/70">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminStats.map(stat => (
              <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColorClass}`}>
                    {React.cloneElement(stat.icon, { className: `${stat.iconColorClass} h-6 w-6`})}
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  {stat.breakdown && <p className="text-xs text-muted-foreground pt-1">{stat.breakdown}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl rounded-xl border border-border/70">
        <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Management Tools</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StyledActionCard
                title="User Management"
                description="View, approve, and manage student and faculty accounts."
                icon={<Users />}
                link="/admin/users"
                actionText="Manage Users"
            />
            <StyledActionCard
                title="Content Creation"
                description="Post news, events, notes, and schedules for specific branches."
                icon={<FilePlus2 />}
                link="/admin/posts/new"
                actionText="Create New Post"
            />
            <StyledActionCard
                title="Manage Timetables"
                description="Create and update class and lab timetables for branches."
                icon={<CalendarClock />}
                link="/admin/timetables"
                actionText="Manage Timetables"
            />
             <StyledActionCard
                title="Study Materials"
                description="Upload and manage study materials for various branches."
                icon={<BookOpen />}
                link="/admin/study-materials"
                actionText="Manage Materials"
            />
            <StyledActionCard
                title="Branch Management"
                description="Define and manage college branches (CSE, ISE, etc.)."
                icon={<BarChart3 />}
                link="/admin/branches" 
                actionText="Manage Branches"
            />
            <StyledActionCard
                title="View Student Reports"
                description="Review and manage reports submitted by students."
                icon={<ListChecks />}
                link="/admin/reports"
                actionText="View Reports"
            />
             <StyledActionCard
                title="Activity Feed"
                description="View all posts on the platform."
                icon={<Newspaper />}
                link="/feed"
                actionText="View Feed"
            />
            <StyledActionCard
                title="Useful Tools"
                description="Access various utility tools like scanners and converters."
                icon={<Wrench />} // Changed from Tool
                link="/tools"
                actionText="Access Tools"
            />
            <StyledActionCard
                title="Site Settings"
                description="Configure general application settings and preferences."
                icon={<Settings />}
                link="/admin/settings" 
                actionText="Configure Settings"
            />
            <StyledActionCard
                title="My Profile"
                description="View and edit your admin profile details."
                icon={<UserCircle />}
                link="/profile/settings" 
                actionText="View Profile"
            />
            </div>
        </CardContent>
      </Card>
      <DownloadAppSection />
    </div>
  );
}

interface StyledActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode; 
  link: string;
  actionText: string;
  disabled?: boolean;
}

function StyledActionCard({ title, description, icon, link, actionText, disabled = false }: StyledActionCardProps) {
  return (
    <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col rounded-xl border ${disabled ? 'opacity-60 bg-muted/30 dark:bg-muted/10 pointer-events-none' : 'bg-card border-border/70 hover:border-primary/50'}`}>
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

