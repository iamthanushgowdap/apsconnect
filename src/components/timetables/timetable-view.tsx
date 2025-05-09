
"use client";

import React from 'react';
import type { TimeTable, TimeTableDaySchedule, DayOfWeek } from '@/types';
import { daysOfWeek } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Clock, BookOpen, User, MapPin } from 'lucide-react';

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
              <div className="h-40 bg-muted rounded w-full"></div>
              <div className="h-8 bg-muted rounded w-1/3 mt-6"></div>
              <div className="h-40 bg-muted rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timetable) {
    return (
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Timetable Not Available</CardTitle>
          <CardDescription>
            The timetable for {studentBranch} - {studentSemester} has not been uploaded yet. Please check back later or contact your department.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getDaySchedule = (day: DayOfWeek): TimeTableDaySchedule | undefined => {
    return timetable.schedule.find(s => s.day === day);
  };

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
            Last Updated: {new Date(timetable.lastUpdatedAt).toLocaleString()} by {timetable.lastUpdatedBy === 'admin' ? 'Admin' : 'Faculty'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysOfWeek.map((day) => {
          const daySchedule = getDaySchedule(day);
          return (
            <div key={day}>
              <h3 className="text-xl font-semibold text-foreground mb-3 border-b pb-2">{day}</h3>
              {daySchedule && daySchedule.entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%] sm:w-[20%]"><Clock className="inline h-4 w-4 mr-1" />Time</TableHead>
                      <TableHead className="w-[35%] sm:w-[30%]"><BookOpen className="inline h-4 w-4 mr-1" />Subject</TableHead>
                      <TableHead className="w-[20%] hidden sm:table-cell"><User className="inline h-4 w-4 mr-1" />Faculty</TableHead>
                      <TableHead className="w-[20%] hidden sm:table-cell"><MapPin className="inline h-4 w-4 mr-1" />Room/Lab</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daySchedule.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.time}</TableCell>
                        <TableCell>{entry.subject}</TableCell>
                        <TableCell className="hidden sm:table-cell">{entry.faculty || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{entry.roomLab || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No classes scheduled for {day}.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
