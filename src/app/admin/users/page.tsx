
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import type { User } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Loader2 } from "lucide-react";
import ManageStudentsTab from "./manage-students-tab";
import ManageFacultyTab from "./manage-faculty-tab";

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actor, setActor] = useState<User | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user && (user.role === 'admin' || user.role === 'faculty')) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">User Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {actor.role === 'admin' 
            ? "View, approve, and manage student and faculty accounts."
            : "View and manage student accounts for your assigned branches."}
        </p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className={`grid w-full ${actor.role === 'admin' ? 'grid-cols-2 md:w-1/2 lg:w-1/3' : 'grid-cols-1 md:w-1/4 lg:w-1/6'}`}>
          <TabsTrigger value="students">Manage Students</TabsTrigger>
          {actor.role === 'admin' && (
            <TabsTrigger value="faculty">Manage Faculty</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="students">
          <ManageStudentsTab actor={actor} />
        </TabsContent>
        {actor.role === 'admin' && (
          <TabsContent value="faculty">
            <ManageFacultyTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
