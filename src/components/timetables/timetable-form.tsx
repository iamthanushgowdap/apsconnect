
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Branch, Semester, TimeTable } from '@/types';
import { defaultBranches, semesters } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { Loader2, Save, CalendarDays, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';

const TIMETABLE_STORAGE_KEY_PREFIX = 'apsconnect_timetable_';
const BRANCH_STORAGE_KEY = 'apsconnect_managed_branches';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const timetableFormSchema = z.object({
  branch: z.string({ required_error: "Branch is required." }),
  semester: z.custom<Semester>(val => semesters.includes(val as Semester), { required_error: "Semester is required." }),
  timetableImage: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, "Timetable image is required.")
    .refine(files => files?.[0]?.size <= MAX_IMAGE_SIZE, `Image size should not exceed ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`)
    .refine(files => ALLOWED_IMAGE_TYPES.includes(files?.[0]?.type), "Invalid image type. Allowed types: JPG, PNG, GIF, WEBP."),
});

export type TimetableFormValues = z.infer<typeof timetableFormSchema>;

interface TimetableFormProps {
  role: 'admin' | 'faculty';
  facultyAssignedBranches?: Branch[];
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export function TimetableForm({ role, facultyAssignedBranches }: TimetableFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [managedBranches, setManagedBranches] = useState<Branch[]>(defaultBranches);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      timetableImage: undefined,
    },
  });
  
  const selectedBranch = form.watch("branch");
  const selectedSemester = form.watch("semester");

  useEffect(() => {
    if (selectedBranch && selectedSemester) {
      loadTimetableImage(selectedBranch, selectedSemester);
    } else {
      setImagePreview(null); // Clear preview if branch/sem not selected
      form.resetField("timetableImage");
    }
  }, [selectedBranch, selectedSemester]);


  const loadTimetableImage = (branch: Branch, semester: Semester) => {
    if (typeof window !== 'undefined') {
      const key = `${TIMETABLE_STORAGE_KEY_PREFIX}${branch}_${semester}`;
      const storedData = localStorage.getItem(key);
      if (storedData) {
        try {
          const timetable: TimeTable = JSON.parse(storedData);
          setImagePreview(timetable.imageDataUrl);
          // No need to set form.setValue for timetableImage here, as it's for upload
          // User must re-upload if they want to change it.
        } catch (error) {
          console.error("Error parsing timetable from localStorage:", error);
          setImagePreview(null);
        }
      } else {
        setImagePreview(null);
      }
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("timetableImage", event.target.files as FileList, { shouldValidate: true });
      const validationResult = timetableFormSchema.shape.timetableImage.safeParse(event.target.files);
      if (validationResult.success) {
        const dataUrl = await readFileAsDataURL(file);
        setImagePreview(dataUrl);
      } else {
        setImagePreview(null);
        // Errors will be shown by FormMessage
      }
    } else {
        form.setValue("timetableImage", undefined, {shouldValidate: true});
        setImagePreview(null);
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.resetField("timetableImage");
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const onSubmit = async (data: TimetableFormValues) => {
    if (!user || !data.timetableImage || data.timetableImage.length === 0) {
      toast({ title: "Error", description: "User not authenticated or image not selected.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const imageFile = data.timetableImage[0];
      const imageDataUrl = await readFileAsDataURL(imageFile);

      const timetableData: TimeTable = {
        id: `${data.branch}_${data.semester}`,
        branch: data.branch,
        semester: data.semester,
        imageDataUrl: imageDataUrl,
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
        <ShadCnCardDescription>Upload an image of the class schedule for a specific branch and semester.</ShadCnCardDescription>
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        setImagePreview(null); // Clear preview on branch change
                        form.resetField("timetableImage");
                      }} 
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
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setImagePreview(null); // Clear preview on semester change
                        form.resetField("timetableImage");
                      }}
                      defaultValue={field.value}
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

            <FormField
              control={form.control}
              name="timetableImage"
              render={({ fieldState }) => ( // field is not directly used for input value due to FileList
                <FormItem>
                  <FormLabel>Timetable Image</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center justify-center w-full">
                        <label htmlFor="timetable-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                            </div>
                            <Input 
                                id="timetable-image-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only" 
                                onChange={handleFileChange}
                                ref={fileInputRef} // Use ref for clearing
                            />
                        </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a clear image of the timetable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {imagePreview && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Image Preview:</h4>
                <div className="relative border rounded-md overflow-hidden aspect-video max-w-md mx-auto bg-muted/20">
                   <Image src={imagePreview} alt="Timetable preview" layout="fill" objectFit="contain" />
                   <Button
                     type="button"
                     variant="destructive"
                     size="icon"
                     onClick={handleRemoveImage}
                     className="absolute top-2 right-2 h-7 w-7"
                     aria-label="Remove image"
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            )}
             {!imagePreview && selectedBranch && selectedSemester && (
                 <div className="text-center text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
                    <ImageIcon className="mx-auto h-10 w-10 mb-2" />
                    No timetable image currently uploaded for {selectedBranch} - {selectedSemester}.
                </div>
             )}


            <div className="pt-6 border-t mt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !selectedBranch || !selectedSemester || !form.formState.isValid}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Timetable Image
              </Button>
              <FormDescription className="mt-2 text-xs">
                This will overwrite any existing timetable image for the selected branch and semester.
              </FormDescription>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
