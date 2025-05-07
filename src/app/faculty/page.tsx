
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, ShieldCheck, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth, User } from "@/components/auth-provider";

export default function FacultyDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser && authUser.role === 'faculty') {
        setFacultyUser(authUser);
      } else if (authUser && authUser.role !== 'faculty') {
        router.push('/dashboard'); // Redirect non-faculty to their generic dashboard
      } else {
        router.push('/login'); // Redirect unauthenticated users to login
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

  if (!facultyUser) {
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
  
  const assignedBranchesText = facultyUser.assignedBranches && facultyUser.assignedBranches.length > 0 
    ? facultyUser.assignedBranches.join(', ') 
    : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Faculty Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome, {facultyUser.displayName || facultyUser.email}! Manage your students and resources.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Assigned Branches: {assignedBranchesText}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FacultyActionCard
          title="Manage Students"
          description="View, approve, and manage student accounts within your assigned branches."
          icon={<Users className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/faculty/user-management"
          actionText="Manage Students"
          dataAiHint="students group"
        />
        <FacultyActionCard
          title="My Profile"
          description="View and edit your faculty profile details."
          icon={<UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/profile/settings" 
          actionText="View Profile"
          dataAiHint="profile page"
        />
         <FacultyActionCard
          title="Content Management"
          description="View and manage content relevant to your branches."
          icon={<FileText className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />}
          link="/faculty/content" // Placeholder, to be implemented later
          actionText="Manage Content"
          dataAiHint="documents files"
        />
      </div>
    </div>
  );
}

interface FacultyActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  actionText: string;
  dataAiHint: string;
}

function FacultyActionCard({ title, description, icon, link, actionText, dataAiHint }: FacultyActionCardProps) {
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
        <Image 
            src={`https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/300/180`} 
            alt={title} 
            width={300} 
            height={180} 
            className="mb-4 rounded-md object-cover w-full aspect-[16/9]"
            data-ai-hint={dataAiHint}
        />
        <Link href={link} className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base">
            {actionText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
