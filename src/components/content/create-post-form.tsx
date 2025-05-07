
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Branch, branches as availableBranches, PostCategory, postCategories, Post, PostAttachment } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2, Paperclip, Trash2, UploadCloud } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'video/mp4', 'video/webm', 'video/ogg'
];

const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(150, "Title cannot exceed 150 characters."),
  content: z.string().min(20, "Content must be at least 20 characters.").max(5000, "Content cannot exceed 5000 characters."),
  category: z.enum(postCategories, { required_error: "Please select a category." }),
  targetAllBranches: z.boolean().default(false),
  targetBranches: z.array(z.enum(availableBranches)).optional(),
  attachments: z.custom<FileList>((val) => val instanceof FileList, "Please upload valid files.").optional()
    .refine(files => { // Validate total size
      if (!files) return true;
      const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
      return totalSize <= MAX_TOTAL_SIZE;
    }, `Total file size should not exceed ${MAX_TOTAL_SIZE / (1024*1024)}MB.`)
    .refine(files => { // Validate individual file size
        if (!files) return true;
        return Array.from(files).every(file => file.size <= MAX_FILE_SIZE);
    }, `Each file should not exceed ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine(files => { // Validate file types
        if (!files) return true;
        return Array.from(files).every(file => ALLOWED_FILE_TYPES.includes(file.type));
    }, "Invalid file type. Allowed types: images, PDF, Office documents, text files, common video formats."),
}).refine(data => {
  if (!data.targetAllBranches && (!data.targetBranches || data.targetBranches.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "If not targeting all branches, at least one specific branch must be selected.",
  path: ["targetBranches"],
});

export type PostFormValues = z.infer<typeof postFormSchema>;

interface CreatePostFormProps {
  onFormSubmit: (data: Post, attachmentsToUpload: File[]) => Promise<void>;
  initialData?: Post; // For editing
  isLoading: boolean;
  submitButtonText?: string;
  formTitle?: string;
  formDescription?: string;
}

export function CreatePostForm({
  onFormSubmit,
  initialData,
  isLoading,
  submitButtonText = initialData ? 'Update Post' : 'Create Post',
  formTitle = initialData ? 'Edit Post' : 'Create New Post',
  formDescription = initialData ? 'Update the details of the post.' : 'Fill in the details to create a new post for the campus community.',
}: CreatePostFormProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialData?.attachments.map(att => new File([], att.name, {type: att.type})) ?? []); // For displaying names
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      category: initialData?.category || postCategories[0],
      targetAllBranches: initialData ? initialData.targetBranches.length === 0 : true,
      targetBranches: initialData?.targetBranches || [],
      attachments: undefined,
    },
  });

  const targetAllBranches = form.watch("targetAllBranches");

  useEffect(() => {
    if (targetAllBranches) {
      form.setValue("targetBranches", []);
    }
  }, [targetAllBranches, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFilesArray = Array.from(files);
       // Basic client-side validation (Zod will do more thorough)
      const currentTotalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      const newFilesTotalSize = newFilesArray.reduce((acc, file) => acc + file.size, 0);

      if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE) {
        toast({ title: "File Limit Exceeded", description: `Total attachment size cannot exceed ${MAX_TOTAL_SIZE / (1024*1024)}MB.`, variant: "destructive" });
        form.setValue('attachments', undefined); // Clear the input
        event.target.value = ""; // Clear the file input visually
        return;
      }
      if (newFilesArray.some(file => file.size > MAX_FILE_SIZE)) {
        toast({ title: "File Too Large", description: `One or more files exceed the ${MAX_FILE_SIZE / (1024*1024)}MB limit.`, variant: "destructive" });
        form.setValue('attachments', undefined);
         event.target.value = "";
        return;
      }
       if (newFilesArray.some(file => !ALLOWED_FILE_TYPES.includes(file.type))) {
        toast({ title: "Invalid File Type", description: `One or more files have an unsupported type.`, variant: "destructive" });
        form.setValue('attachments', undefined);
         event.target.value = "";
        return;
      }
      setSelectedFiles(prev => [...prev, ...newFilesArray]); // Add to display list
      // For react-hook-form, FileList is tricky. Let's update it if needed or just pass selectedFiles on submit.
      // For now, we'll manage `selectedFiles` and pass it separately. Zod handles FileList from input.
      // The form will receive the FileList directly if a new selection is made.
      // If editing, initial attachments are just names. New files are added via input.
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    // If react-hook-form holds a FileList in `attachments`, we'd need to update it.
    // This simple removal is for the display list. Actual form state for `attachments` comes from input.
    // To clear the actual file input's FileList is tricky.
    // Best to rely on Zod validation on submit.
    const currentFormFiles = form.getValues('attachments');
    if (currentFormFiles) {
        const newFileList = new DataTransfer();
        Array.from(currentFormFiles)
            .filter(file => file.name !== fileName)
            .forEach(file => newFileList.items.add(file));
        form.setValue('attachments', newFileList.files.length > 0 ? newFileList.files : undefined, { shouldValidate: true });
    }
  };


  const onSubmit = async (data: PostFormValues) => {
    const { user } = useAuth(); // Get user inside submit to ensure it's current
    if (!user || (user.role !== 'admin' && user.role !== 'faculty')) {
      toast({ title: "Unauthorized", description: "You are not authorized to create posts.", variant: "destructive" });
      return;
    }

    const filesToUpload: File[] = data.attachments ? Array.from(data.attachments) : [];
    const newAttachments: PostAttachment[] = filesToUpload.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    
    // For edit, merge existing attachments if not replaced
    let finalAttachments = newAttachments;
    if (initialData && initialData.attachments) {
      const existingAttachmentsNotReplaced = initialData.attachments.filter(
        existingAtt => !filesToUpload.some(newFile => newFile.name === existingAtt.name)
      );
      finalAttachments = [...existingAttachmentsNotReplaced, ...newAttachments];
    }


    const postData: Post = {
      id: initialData?.id || crypto.randomUUID(),
      title: data.title,
      content: data.content,
      category: data.category,
      targetBranches: data.targetAllBranches ? [] : data.targetBranches || [], // Empty array for "All Branches"
      attachments: finalAttachments,
      authorId: user.uid,
      authorName: user.displayName || user.email || "CampusConnect User",
      authorRole: user.role,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await onFormSubmit(postData, filesToUpload);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-primary">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="E.g., Upcoming Workshop on AI" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea placeholder="Detailed description of the post..." {...field} rows={8} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {postCategories.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAllBranches"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Target All Branches</FormLabel>
                    <FormDescription>Check this if the post is for all students and faculty, regardless of branch.</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            {!targetAllBranches && (
              <FormField
                control={form.control}
                name="targetBranches"
                render={() => (
                  <FormItem>
                    <FormLabel>Target Specific Branches</FormLabel>
                    <FormDescription>Select the branches this post is relevant to. If none are selected, it will be considered a general post if "Target All Branches" is also unchecked (validation will catch this).</FormDescription>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-2 border rounded-md">
                      {availableBranches.map((branch) => (
                        <FormField
                          key={branch}
                          control={form.control}
                          name="targetBranches"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(branch)}
                                  onCheckedChange={(checked) => {
                                    const newValue = field.value ? [...field.value] : [];
                                    if (checked) {
                                      newValue.push(branch);
                                    } else {
                                      const index = newValue.indexOf(branch);
                                      if (index > -1) newValue.splice(index, 1);
                                    }
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">{branch}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="attachments"
              render={({ field: { onChange, value, ...restField } }) => ( // Exclude value from restField for input type="file"
                <FormItem>
                  <FormLabel>Attachments (Optional)</FormLabel>
                   <FormControl>
                    <div className="relative flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">Max 5MB/file, 20MB total. Images, PDF, Docs, Videos.</p>
                            </div>
                            <Input 
                                id="file-upload" 
                                type="file" 
                                multiple 
                                className="sr-only" 
                                onChange={(e) => {
                                    onChange(e.target.files); // Update form state
                                    handleFileChange(e);    // Update local state for display
                                }}
                                {...restField} // Pass name, ref, onBlur
                            />
                        </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    You can upload multiple files. Allowed types: images, PDF, Office documents, text files, common video formats. Max 5MB per file, 20MB total.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Files:</h4>
                <ul className="list-disc list-inside space-y-1 pl-1 max-h-32 overflow-y-auto rounded-md border p-2 bg-muted/20">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-xs flex items-center justify-between">
                      <span className="truncate max-w-[80%]">
                        <Paperclip className="inline h-3 w-3 mr-1" />{file.name} ({ (file.size / (1024*1024)).toFixed(2) } MB)
                      </span>
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.name)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
