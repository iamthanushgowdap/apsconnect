
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Branch, Semester, DayOfWeek, TimeTable, TimeTableEntry, TimeTableDaySchedule } from '@/types';
import { defaultBranches, semesters, daysOfWeek } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { Loader2, PlusCircle, Trash2, Save, CalendarDays } from 'lucide-react';

const TIMETABLE_STORAGE_KEY_PREFIX = 'apsconnect_timetable_';
const BRANCH_STORAGE_KEY = 'apsconnect_managed_branches';

const timeTableEntrySchema = z.object({
  id: z.string().uuid(),
  time: z.string().min(1, "Time slot is required."), // e.g., "09:00-10:00"
  subject: z.string().min(1, "Subject is required."),
  faculty: z.string().optional(),
  roomLab: z.string().optional(),
});

const timeTableDayScheduleSchema = z.object({
  day: z.custom<DayOfWeek>(val => daysOfWeek.includes(val as DayOfWeek)),
  entries: z.array(timeTableEntrySchema),
});

const timetableFormSchema = z.object({
  branch: z.string({ required_error: "Branch is required." }),
  semester: z.custom<Semester>(val => semesters.includes(val as Semester), { required_error: "Semester is required." }),
  schedule: z.array(timeTableDayScheduleSchema).length(daysOfWeek.length, "Schedule for all days must be provided."),
});

export type TimetableFormValues = z.infer<typeof timetableFormSchema>;

interface TimetableFormProps {
  role: 'admin' | 'faculty';
  facultyAssignedBranches?: Branch[]; // Only for faculty role
}

export function TimetableForm({ role, facultyAssignedBranches }: TimetableFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [managedBranches, setManagedBranches] = useState<Branch[]>(defaultBranches);
  const [currentDayIndex, setCurrentDayIndex] = useState(0); // To manage active day tab

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranches = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (storedBranches) {
        try {
          const parsed = JSON.parse(storedBranches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setManagedBranches(parsed);
          }
        } catch (e) {
          console.error("Error parsing managed branches for timetable form:", e);
        }
      }
    }
  }, []);
  
  const availableBranchesForForm = role === 'admin' ? managedBranches : (facultyAssignedBranches || []);


  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      branch: availableBranchesForForm.length > 0 ? availableBranchesForForm[0] : undefined,
      semester: semesters[0],
      schedule: daysOfWeek.map(day => ({
        day: day,
        entries: []
      })),
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: `schedule.${currentDayIndex}.entries`,
    keyName: "fieldId", // to avoid potential conflicts with 'id' in TimeTableEntry
  });
  
  const selectedBranch = form.watch("branch");
  const selectedSemester = form.watch("semester");

  useEffect(() => {
    if (selectedBranch && selectedSemester) {
      loadTimetable(selectedBranch, selectedSemester);
    }
     // Reset current day index when branch or semester changes to show Monday by default.
    setCurrentDayIndex(0); 
  }, [selectedBranch, selectedSemester]);

  useEffect(() => {
    // This effect updates the 'fields' from useFieldArray when currentDayIndex changes.
    // It re-initializes the field array for the new current day.
    // It's important that this runs *after* the schedule for the new day is potentially loaded/set in form.setValue.
    // RHF's useFieldArray listens to changes in the form state for `schedule.${currentDayIndex}.entries`.
  }, [currentDayIndex, form.getValues]);


  const loadTimetable = (branch: Branch, semester: Semester) => {
    if (typeof window !== 'undefined') {
      const key = `${TIMETABLE_STORAGE_KEY_PREFIX}${branch}_${semester}`;
      const storedData = localStorage.getItem(key);
      if (storedData) {
        try {
          const timetable: TimeTable = JSON.parse(storedData);
          form.setValue("schedule", timetable.schedule, { shouldValidate: true, shouldDirty: true });
        } catch (error) {
          console.error("Error parsing timetable from localStorage:", error);
          // Reset to default if parsing fails
           form.setValue("schedule", daysOfWeek.map(day => ({ day, entries: [] })), { shouldValidate: true, shouldDirty: true });
        }
      } else {
        // No existing timetable, ensure form is reset to default for this combo
        form.setValue("schedule", daysOfWeek.map(day => ({ day, entries: [] })), { shouldValidate: true, shouldDirty: true });
      }
    }
  };
  
  const addNewEntry = () => {
    append({ id: crypto.randomUUID(), time: "", subject: "", faculty: "", roomLab: "" });
  };

  const removeEntry = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: TimetableFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const timetableData: TimeTable = {
        id: `${data.branch}_${data.semester}`,
        branch: data.branch,
        semester: data.semester,
        schedule: data.schedule,
        lastUpdatedBy: user.uid,
        lastUpdatedAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(`${TIMETABLE_STORAGE_KEY_PREFIX}${data.branch}_${data.semester}`, JSON.stringify(timetableData));
      }

      toast({
        title: "Timetable Saved",
        description: `Timetable for ${data.branch} - ${data.semester} has been saved successfully.`,
      });
    } catch (error) {
      console.error("Error saving timetable:", error);
      toast({
        title: "Error Saving Timetable",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-primary flex items-center">
            <CalendarDays className="mr-3 h-7 w-7"/> Manage Timetables
        </CardTitle>
        <ShadCnCardDescription>Create, view, and update class schedules for different branches and semesters.</ShadCnCardDescription>
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
                      defaultValue={field.value}
                      disabled={role === 'faculty' && facultyAssignedBranches?.length === 1}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {selectedBranch && selectedSemester && (
              <>
                <div className="border-b border-border">
                  <div className="flex space-x-1 overflow-x-auto pb-px">
                    {daysOfWeek.map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        variant={currentDayIndex === index ? "default" : "ghost"}
                        onClick={() => setCurrentDayIndex(index)}
                        className={`px-3 py-2 text-sm font-medium rounded-t-md ${currentDayIndex === index ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Schedule for {daysOfWeek[currentDayIndex]}
                  </h3>
                  {fields.map((entry, index) => (
                    <Card key={entry.fieldId} className="p-4 bg-muted/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <FormField
                          control={form.control}
                          name={`schedule.${currentDayIndex}.entries.${index}.time`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel className="text-xs">Time Slot</FormLabel>
                              <FormControl><Input placeholder="e.g., 09:00-10:00" {...field} /></FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`schedule.${currentDayIndex}.entries.${index}.subject`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel className="text-xs">Subject</FormLabel>
                              <FormControl><Input placeholder="Subject Name" {...field} /></FormControl>
                               <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`schedule.${currentDayIndex}.entries.${index}.faculty`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel className="text-xs">Faculty (Optional)</FormLabel>
                              <FormControl><Input placeholder="Faculty Name" {...field} /></FormControl>
                               <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`schedule.${currentDayIndex}.entries.${index}.roomLab`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel className="text-xs">Room/Lab (Optional)</FormLabel>
                              <FormControl><Input placeholder="Room/Lab No." {...field} /></FormControl>
                               <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeEntry(index)} className="self-end mb-1 h-9">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={addNewEntry}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Period to {daysOfWeek[currentDayIndex]}
                  </Button>
                </div>
              </>
            )}

            <div className="pt-6 border-t mt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !selectedBranch || !selectedSemester}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Timetable
              </Button>
              <FormDescription className="mt-2 text-xs">
                Ensure all details are correct. This will overwrite any existing timetable for the selected branch and semester.
              </FormDescription>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
