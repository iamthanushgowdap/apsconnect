
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import ManageStudentsTab from "@/app/admin/users/manage-students-tab"; // Reusing the component

export default function FacultyUserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actor, setActor] = useState<User | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user && user.role === 'faculty') {
        setIsAuthorized(true);
        setActor(user);
      } else if (user) {
        router.push('/dashboard'); 
      } else {
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized || !actor) {
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
  
  const assignedBranchesText = actor.assignedBranches && actor.assignedBranches.length > 0 
    ? actor.assignedBranches.join(', ') 
    : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Manage Students</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View, approve, and manage student accounts for your assigned branches: {assignedBranchesText}.
        </p>
      </div>
      <ManageStudentsTab actor={actor} />
    </div>
  );
}
