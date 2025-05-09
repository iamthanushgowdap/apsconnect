
"use client";

import React from 'react';
import type { TimeTable, Branch, Semester, DayOfWeek } from '@/types';
import { daysOfWeek, defaultTimeSlots } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

interface TimetableViewProps {
  timetable: TimeTable | null;
  isLoading: boolean;
  studentBranch?: Branch; // Optional, for student view context
  studentSemester?: Semester; // Optional, for student view context
  displayContext?: { // For admin/faculty view context
    branch?: Branch; 
    semester?: Semester;
  };
}

export function TimetableView({ timetable, isLoading, studentBranch, studentSemester, displayContext }: TimetableViewProps) {
  if (isLoading) {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Loading Timetable...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-20">
           <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
        </CardContent>
      </Card>
    );
  }

  const branchToDisplay = displayContext?.branch || studentBranch;
  const semesterToDisplay = displayContext?.semester || studentSemester;

  if (!timetable || !timetable.schedule || timetable.schedule.length === 0) {
    return (
      <Card className="w-full shadow-xl mt-4">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-primary flex items-center">
            <AlertTriangle className="mr-3 h-6 w-6 text-orange-500"/> Timetable Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {branchToDisplay && semesterToDisplay 
              ? `The timetable for ${branchToDisplay} - ${semesterToDisplay} has not been created or is currently empty.`
              : "The requested timetable has not been created or is empty."}
            {' '}Please check back later or contact the relevant department/administration if you are a student.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Ensure the schedule is in the correct order of daysOfWeek
  const orderedSchedule = daysOfWeek.map(dayString => {
    const daySchedule = timetable.schedule.find(ds => ds.day === dayString);
    if (daySchedule) {
      // Ensure entries are ordered by period index and cover all defaultTimeSlots
      const orderedEntries = defaultTimeSlots.map((_, periodIdx) => {
        const entry = daySchedule.entries.find(e => e.period === periodIdx);
        return entry || { period: periodIdx, subject: "-" }; // Default for missing entries
      });
      return { ...daySchedule, entries: orderedEntries };
    }
    // If a day is missing entirely from the stored schedule, create a blank one
    return {
      day: dayString as DayOfWeek,
      entries: defaultTimeSlots.map((_, periodIdx) => ({ period: periodIdx, subject: "-" })),
    };
  });


  return (
    <Card className="w-full shadow-xl mt-4">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-primary flex items-center">
            <CalendarDays className="mr-3 h-6 w-6 sm:h-7 sm:w-7"/> Timetable Details
        </CardTitle>
        <CardDescription>
          Viewing timetable for Branch: <strong>{timetable.branch}</strong>, Semester: <strong>{timetable.semester}</strong>.
        </CardDescription>
        <CardDescription className="text-xs text-muted-foreground pt-1">
            Last Updated: {new Date(timetable.lastUpdatedAt).toLocaleString()} by User ID: {timetable.lastUpdatedBy}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <Table className="min-w-full border-collapse border border-border">
          <TableHeader>
            <TableRow>
              <TableHead className="border border-border p-2 font-semibold bg-muted/50 w-[150px] sticky left-0 z-10">Time / Day</TableHead>
              {daysOfWeek.map(day => (
                <TableHead key={day} className="border border-border p-2 font-semibold bg-muted/50 text-center min-w-[120px]">{day}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaultTimeSlots.map((slot, periodIndex) => (
              <TableRow key={periodIndex}>
                <TableCell className="border border-border p-2 font-medium bg-muted/30 text-muted-foreground text-xs sm:text-sm sticky left-0 z-10 w-[150px]">
                  {slot} <br/> (Period {periodIndex + 1})
                </TableCell>
                {orderedSchedule.map(daySchedule => (
                  <TableCell key={`${daySchedule.day}-${periodIndex}`} className="border border-border p-2 text-center text-xs sm:text-sm min-w-[120px]">
                    {daySchedule.entries[periodIndex]?.subject || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
