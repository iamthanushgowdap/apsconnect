
"use client";

import React from 'react';
import type { TimeTable } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface TimetableViewProps {
  timetable: TimeTable | null;
  isLoading: boolean;
  studentBranch?: string;
  studentSemester?: string;
}

export function TimetableView({ timetable, isLoading, studentBranch, studentSemester }: TimetableViewProps) {
  if (isLoading) {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Loading Timetable...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-10">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-60 bg-muted rounded w-full"></div> {/* Placeholder for image */}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timetable || !timetable.imageDataUrl) {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary flex items-center">
            <ImageIcon className="mr-3 h-7 w-7 text-muted-foreground"/> Timetable Not Available
          </CardTitle>
          <CardDescription>
            The timetable for {studentBranch} - {studentSemester} has not been uploaded yet. Please check back later or contact your department.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-primary flex items-center">
            <CalendarDays className="mr-3 h-7 w-7"/> Timetable
        </CardTitle>
        <CardDescription>
          Class schedule for Branch: <strong>{timetable.branch}</strong>, Semester: <strong>{timetable.semester}</strong>.
        </CardDescription>
        <CardDescription className="text-xs text-muted-foreground">
            Last Updated: {new Date(timetable.lastUpdatedAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-full aspect-[4/3] border rounded-md overflow-hidden bg-muted">
            <Image 
                src={timetable.imageDataUrl} 
                alt={`Timetable for ${timetable.branch} - ${timetable.semester}`} 
                layout="fill"
                objectFit="contain"
                data-ai-hint="timetable schedule"
            />
        </div>
        <p className="text-sm text-muted-foreground text-center">
            Pinch to zoom or open image in new tab for better view if needed.
        </p>
      </CardContent>
    </Card>
  );
}
