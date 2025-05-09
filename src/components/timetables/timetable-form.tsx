
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import type { Branch, Semester, TimeTable, TimeTableDaySchedule, TimeTableEntry, DayOfWeek } from '@/types';
import { defaultBranches, semesters, daysOfWeek, defaultTimeSlots } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { Loader2, Save, CalendarDays, AlertTriangle } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

const TIMETABLE_STORAGE_KEY_PREFIX = 'apsconnect_timetable_';
const BRANCH_STORAGE_KEY = 'apsconnect_managed_branches';

const timeTableEntrySchema = z.object({
  period: z.number(),
  subject: z.string().max(100, "Subject name too long").optional(),
});

const timeTableDayScheduleSchema = z.object({
  day: z.string(), // DayOfWeek will be validated by parent
  entries: z.array(timeTableEntrySchema),
});

const timetableFormSchema = z.object({
  branch: z.string({ required_error: "Branch is required." }),
  semester: z.custom<Semester>(val => semesters.includes(val as Semester), { required_error: "Semester is required." }),
  schedule: z.array(timeTableDayScheduleSchema),
});

export type TimetableFormValues = z.infer<typeof timetableFormSchema>;

interface TimetableFormProps {
  role: 'admin' | 'faculty';
  facultyAssignedBranches?: Branch[];
  onTimetableUpdate?: () => void; // Callback to refresh view tab
}

const createEmptySchedule = (): TimeTableDaySchedule[] => {
  return daysOfWeek.map(day => ({
    day,
    entries: defaultTimeSlots.map((_, periodIndex) => ({
      period: periodIndex,
      subject: "",
    })),
  }));
};

export function TimetableForm({ role, facultyAssignedBranches, onTimetableUpdate }: TimetableFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [managedBranches, setManagedBranches] = useState<Branch[]>(defaultBranches);
  
  const availableBranchesForForm = role === 'admin' ? managedBranches : (facultyAssignedBranches || []);

  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      branch: availableBranchesForForm.length > 0 ? availableBranchesForForm[0] : undefined,
      semester: semesters[0],
      schedule: createEmptySchedule(),
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "schedule",
  });
  
  const selectedBranch = form.watch("branch");
  const selectedSemester = form.watch("semester");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranches = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (storedBranches) {
        try {
          const parsed = JSON.parse(storedBranches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setManagedBranches(parsed);
            if (role === 'admin' && (!form.getValues("branch") || !parsed.includes(form.getValues("branch")))) {
              form.setValue("branch", parsed[0]);
            }
          }
        } catch (e) { console.error("Error parsing managed branches:", e); }
      }
       if (role === 'faculty' && facultyAssignedBranches && facultyAssignedBranches.length > 0 && !form.getValues("branch")) {
        form.setValue("branch", facultyAssignedBranches[0]);
      }
    }
  }, [role, facultyAssignedBranches, form]);

  useEffect(() => {
    const loadSchedule = async () => {
      if (selectedBranch && selectedSemester) {
        setFormLoading(true);
        if (typeof window !== 'undefined') {
          const key = `${TIMETABLE_STORAGE_KEY_PREFIX}${selectedBranch}_${selectedSemester}`;
          const storedData = localStorage.getItem(key);
          if (storedData) {
            try {
              const timetable = JSON.parse(storedData) as Partial<TimeTable>; // Use Partial for safety
              if (timetable && Array.isArray(timetable.schedule)) {
                // Ensure schedule has the correct structure
                const validSchedule = daysOfWeek.map(dayString => {
                  const existingDaySchedule = timetable.schedule!.find(ds => ds.day === dayString); // Safe with ! due to Array.isArray check
                  return {
                    day: dayString,
                    entries: defaultTimeSlots.map((_, periodIdx) => {
                      const existingEntry = existingDaySchedule?.entries.find(e => e.period === periodIdx);
                      return {
                        period: periodIdx,
                        subject: existingEntry?.subject || "",
                      };
                    }),
                  };
                });
                replace(validSchedule);
              } else {
                 console.warn("Stored timetable data is malformed or schedule is missing for form. Initializing with empty schedule.");
                 replace(createEmptySchedule());
              }
            } catch (error) {
              console.error("Error parsing timetable from localStorage for form:", error);
              replace(createEmptySchedule());
            }
          } else {
            replace(createEmptySchedule());
          }
        }
        setFormLoading(false);
      } else {
         replace(createEmptySchedule()); // Clear form if branch/sem not selected
         setFormLoading(false);
      }
    };
    loadSchedule();
  }, [selectedBranch, selectedSemester, replace]);


  const onSubmit = async (data: TimetableFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (!data.branch || !data.semester) {
      toast({ title: "Error", description: "Branch and Semester must be selected.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const timetableData: TimeTable = {
        id: `${data.branch}_${data.semester}`,
        branch: data.branch,
        semester: data.semester,
        schedule: data.schedule.map(daySchedule => ({
          day: daySchedule.day as DayOfWeek,
          entries: daySchedule.entries.map(entry => ({
            period: entry.period,
            subject: entry.subject || "", 
          })),
        })),
        lastUpdatedBy: user.uid,
        lastUpdatedAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(`${TIMETABLE_STORAGE_KEY_PREFIX}${data.branch}_${data.semester}`, JSON.stringify(timetableData));
      }

      toast({
        title: "Timetable Saved",
        description: `Timetable for ${data.branch} - ${data.semester} has been created/updated.`,
      });
      if (onTimetableUpdate) onTimetableUpdate();

    } catch (error) {
      console.error("Error saving timetable:", error);
      toast({ title: "Error Saving Timetable", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center">
            <CalendarDays className="mr-3 h-6 w-6 sm:h-7 sm:w-7"/> Create/Update Timetable
        </CardTitle>
        <ShadCnCardDescription>Enter or modify the class schedule for a specific branch and semester.</ShadCnCardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={role === 'faculty' && facultyAssignedBranches?.length === 1 && facultyAssignedBranches.includes(field.value)}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableBranchesForForm.length > 0 ? availableBranchesForForm.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        )) : <SelectItem value="-" disabled>No branches available</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formLoading ? (
                 <div className="flex justify-center items-center py-10 text-muted-foreground">
                    <SimpleRotatingSpinner className="mr-2 h-5 w-5 text-primary" /> Loading schedule editor...
                </div>
            ) : !selectedBranch || !selectedSemester ? (
                <div className="text-center text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
                    <AlertTriangle className="mx-auto h-10 w-10 mb-2 text-orange-500" />
                    Please select a branch and semester to load or create a timetable.
                </div>
            ) : (
            <div className="overflow-x-auto">
                <Table className="min-w-full border-collapse border border-border">
                    <TableHeader>
                        <TableRow>
                        <TableHead className="border border-border p-2 font-semibold bg-muted/50 w-[150px]">Time / Day</TableHead>
                        {daysOfWeek.map(day => (
                            <TableHead key={day} className="border border-border p-2 font-semibold bg-muted/50 text-center">{day}</TableHead>
                        ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {defaultTimeSlots.map((slot, periodIndex) => (
                        <TableRow key={periodIndex}>
                            <TableCell className="border border-border p-2 font-medium bg-muted/30 text-muted-foreground text-xs sm:text-sm">
                            {slot} <br/> (Period {periodIndex + 1})
                            </TableCell>
                            {fields.map((dayField, dayIndex) => (
                            <TableCell key={dayField.id + '-' + periodIndex} className="border border-border p-1">
                                <FormField
                                control={form.control}
                                name={`schedule.${dayIndex}.entries.${periodIndex}.subject`}
                                render={({ field }) => (
                                    <Input 
                                    {...field} 
                                    placeholder="Subject" 
                                    className="w-full h-10 text-xs sm:text-sm p-1 sm:p-2"
                                    />
                                )}
                                />
                            </TableCell>
                            ))}
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}
            <div className="pt-6 border-t mt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || formLoading || !selectedBranch || !selectedSemester}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Timetable
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

