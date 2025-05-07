
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FilePlus2, Users, Settings, ShieldCheck, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { UserProfile, Post } from "@/types";

interface MockUserFromAuth { 
  displayName: string | null;
  email: string | null; 
  role: 'admin' | 'student' | 'pending' | 'faculty';
  usn?: string; 
}

interface AdminStat {
  title: string;
  value: string;
  icon: React.ReactNode;
  breakdown?: string; // Optional field for user breakdown
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
            if (key && key.startsWith('campus_connect_user_')) {
              try {
                const profile = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
                if (profile.role === 'student' && profile.isApproved) { // Count only approved students
                  currentStudentCount++;
                } else if (profile.role === 'faculty') {
                  currentFacultyCount++;
                }
              } catch (e) { /* ignore parse errors */ }
            }
          }
          setStudentCount(currentStudentCount);
          setFacultyCount(currentFacultyCount);

          const postsStr = localStorage.getItem('campus_connect_posts');
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
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-1/2 rounded bg-muted"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 rounded-lg bg-muted"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) { 
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

  const adminStats: AdminStat[] = [
    { 
      title: "Total Users", 
      value: (studentCount + facultyCount).toString(), 
      breakdown: `Students: ${studentCount}, Faculty: ${facultyCount}`,
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /> 
    },
    { 
      title: "Content Posts", 
      value: contentPostsCount.toString(), 
      icon: <FilePlus2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /> 
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage CampusConnect content, users, and settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {adminStats.map(stat => (
          <Card key={stat.title} className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
              {stat.breakdown && <p className="text-xs text-muted-foreground pt-1">{stat.breakdown}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminActionCard
          title="User Management"
          description="View, approve, and manage student and faculty accounts."
          icon={<Users className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/admin/users"
          actionText="Manage Users"
        />
        <AdminActionCard
          title="Content Creation"
          description="Post news, events, notes, and schedules for specific branches."
          icon={<FilePlus2 className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/admin/posts/new"
          actionText="Create New Post"
        />
        <AdminActionCard
          title="Branch Management"
          description="Define and manage college branches (CSE, ISE, etc.)."
          icon={<BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/admin/branches" 
          actionText="Manage Branches"
        />
        <AdminActionCard
          title="Site Settings"
          description="Configure general application settings and preferences."
          icon={<Settings className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/admin/settings" 
          actionText="Configure Settings"
        />
         <AdminActionCard
          title="My Profile"
          description="View and edit your admin profile details."
          icon={<UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/profile/settings" 
          actionText="View Profile"
        />
      </div>
    </div>
  );
}

interface AdminActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  actionText: string;
}

function AdminActionCard({ title, description, icon, link, actionText }: AdminActionCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 sm:p-3 bg-accent/10 rounded-full">{icon}</div>
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <Link href={link} className="w-full mt-auto">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base">
            {actionText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
