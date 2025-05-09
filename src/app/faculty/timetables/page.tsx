"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { TimetableForm } from '@/components/timetables/timetable-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Info, CalendarClock } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import type { Branch } from '@/types';


export default function FacultyTimetablePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [assignedBranches, setAssignedBranches] = useState<Branch[] | undefined>(undefined);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'faculty') {
        router.push(user ? '/dashboard' : '/login');
      } else {
        setAssignedBranches(user.assignedBranches);
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'faculty') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader><CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle></CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignedBranches || assignedBranches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary text-xl sm:text-2xl flex items-center">
              <Info className="mr-2 h-6 w-6" /> No Assigned Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-md text-muted-foreground">
              You are not currently assigned to any branches. Please contact an administrator to get assigned to manage timetables.
            </p>
            <Link href="/faculty">
              <Button variant="outline" className="mt-6">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TimetableForm role="faculty" facultyAssignedBranches={assignedBranches} />
    </div>
  );
}

