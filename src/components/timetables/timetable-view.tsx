"use client";

import React from 'react';
import type { TimeTable, Branch, Semester } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

interface TimetableViewProps {
  timetable: TimeTable | null;
  isLoading: boolean;
  displayContext?: { 
    branch?: Branch; 
    semester?: Semester;
  };
}

export function TimetableView({ timetable, isLoading, displayContext }: TimetableViewProps) {
  if (isLoading) {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Loading Timetable...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-20">
           <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
        </CardContent>
      </Card>
    );
  }

  const contextBranch = displayContext?.branch;
  const contextSemester = displayContext?.semester;

  if (!timetable || !timetable.imageDataUrl) { // Explicitly check for imageDataUrl
    return (
      <Card className="w-full shadow-xl mt-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight text-primary flex items-center">
            <ImageIcon className="mr-3 h-6 w-6 text-muted-foreground"/> Timetable Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {contextBranch && contextSemester 
              ? `The timetable image for ${contextBranch} - ${contextSemester} has not been uploaded or is missing.`
              : "The requested timetable image has not been uploaded or is missing."}
            {' '}Please check back later or contact the relevant department/administration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl mt-4">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight text-primary flex items-center">
            <CalendarDays className="mr-3 h-6 w-6"/> Timetable Details
        </CardTitle>
        <CardDescription>
          Viewing timetable for Branch: <strong>{timetable.branch}</strong>, Semester: <strong>{timetable.semester}</strong>.
        </CardDescription>
        <CardDescription className="text-xs text-muted-foreground pt-1">
            Last Updated: {new Date(timetable.lastUpdatedAt).toLocaleString()} by user ID: {timetable.lastUpdatedBy}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-w-4 aspect-h-3 border rounded-md overflow-hidden bg-muted sm:aspect-w-16 sm:aspect-h-9">
            <Image 
                src={timetable.imageDataUrl} 
                alt={`Timetable for ${timetable.branch} - ${timetable.semester}`} 
                layout="fill"
                objectFit="contain"
                className="rounded-md"
                data-ai-hint="timetable schedule"
            />
        </div>
        <p className="text-xs text-muted-foreground text-center">
            Pinch to zoom or open image in a new tab for a better view if needed.
        </p>
      </CardContent>
    </Card>
  );
}
