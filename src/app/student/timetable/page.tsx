
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import type { TimeTable, Branch, Semester } from '@/types';
import { TimetableView } from '@/components/timetables/timetable-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

const TIMETABLE_STORAGE_KEY_PREFIX = 'apsconnect_timetable_';

export default function StudentTimetablePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimeTable | null>(null);
  const [studentDetails, setStudentDetails] = useState<{branch?: Branch, semester?: Semester}>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'student' && user.role !== 'pending')) {
        router.push(user ? '/dashboard' : '/login');
        return;
      }

      if (user.role === 'pending' && !user.rejectionReason) {
        // Allow pending (non-rejected) students to see this page, but timetable might be unavailable
        setStudentDetails({ branch: user.branch, semester: undefined }); // Semester might not be set for pending
        setPageLoading(false);
        return; // Skip timetable loading for pending users until approved
      }
      
      if (user.role === 'student' && user.branch && user.semester) {
        setStudentDetails({ branch: user.branch, semester: user.semester });
        if (typeof window !== 'undefined') {
          const key = `${TIMETABLE_STORAGE_KEY_PREFIX}${user.branch}_${user.semester}`;
          const storedData = localStorage.getItem(key);
          if (storedData) {
            try {
              setTimetable(JSON.parse(storedData));
            } catch (error) {
              console.error("Error parsing timetable for student:", error);
              setTimetable(null);
            }
          } else {
            setTimetable(null); // No timetable found
          }
        }
      } else if (user.role === 'student' && (!user.branch || !user.semester)) {
         // Student profile might be incomplete
         setStudentDetails({ branch: user.branch, semester: user.semester });
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== 'student' && user.role !== 'pending')) {
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
  
  if (user.role === 'pending' && !user.rejectionReason) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg border-yellow-400">
                <CardHeader><CardTitle className="text-yellow-600 text-xl sm:text-2xl">Account Pending</CardTitle></CardHeader>
                <CardContent>
                    <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-4" />
                    <p className="text-md sm:text-lg text-muted-foreground">
                        Your account is pending approval. The timetable will be available once your account is approved.
                    </p>
                    <Link href="/student"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (user.role === 'student' && (!studentDetails.branch || !studentDetails.semester)) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg border-orange-400">
                <CardHeader><CardTitle className="text-orange-600 text-xl sm:text-2xl">Profile Incomplete</CardTitle></CardHeader>
                <CardContent>
                    <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-orange-500 mx-auto mb-4" />
                    <p className="text-md sm:text-lg text-muted-foreground">
                        Your profile information (branch or semester) is incomplete. Please contact administration.
                    </p>
                    <Link href="/student"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <TimetableView 
        timetable={timetable} 
        isLoading={pageLoading} 
        studentBranch={studentDetails.branch}
        studentSemester={studentDetails.semester}
      />
    </div>
  );
}
