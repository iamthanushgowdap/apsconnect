
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Branch, branches as availableBranches } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, Loader2, Trash2, Edit3, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox'; // For multi-branch selection
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const facultyFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits.").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')), // Optional for edit
  confirmPassword: z.string().optional().or(z.literal('')),
  assignedBranches: z.array(z.enum(availableBranches)).min(1, "At least one branch must be selected."),
  facultyTitle: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.password || data.confirmPassword) { // Only validate confirmPassword if password is being set/changed
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

export default function ManageFacultyTab() {
  const [facultyMembers, setFacultyMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      assignedBranches: [],
      facultyTitle: "",
    },
  });

  const fetchFaculty = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const users: UserProfile[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('campus_connect_user_')) {
          try {
            const user = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
            if (user.role === 'faculty') {
              users.push(user);
            }
          } catch (error) {
            console.error("Failed to parse user from localStorage:", key, error);
          }
        }
      }
      setFacultyMembers(users.sort((a,b) => (a.displayName || "").localeCompare(b.displayName || "")));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const handleFormSubmit = (data: FacultyFormValues) => {
    if (typeof window !== 'undefined') {
      const facultyUserKey = `campus_connect_user_${data.email.toLowerCase()}`;
      
      if (!editingFaculty && localStorage.getItem(facultyUserKey)) {
        toast({
          title: "Error",
          description: "A faculty member with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      if (!editingFaculty && !data.password) {
        form.setError("password", { type: "manual", message: "Password is required for new faculty." });
        return;
      }

      const existingProfile = editingFaculty ? facultyMembers.find(f => f.uid === editingFaculty.uid) : null;

      const facultyProfile: UserProfile = {
        uid: data.email.toLowerCase(),
        displayName: data.displayName,
        email: data.email.toLowerCase(),
        phoneNumber: data.phoneNumber || undefined,
        // Password logic: update if provided, otherwise keep existing (for edit) or set (for new)
        password: data.password ? data.password : (editingFaculty && existingProfile?.password ? existingProfile.password : data.password!),
        assignedBranches: data.assignedBranches,
        facultyTitle: data.facultyTitle || undefined,
        role: 'faculty',
        registrationDate: editingFaculty?.registrationDate || new Date().toISOString(),
        isApproved: true, 
      };

      localStorage.setItem(facultyUserKey, JSON.stringify(facultyProfile));
      toast({
        title: editingFaculty ? "Faculty Updated" : "Faculty Created",
        description: `${data.displayName} has been successfully ${editingFaculty ? 'updated' : 'added'}.`,
      });
      fetchFaculty();
      setIsFormOpen(false);
      setEditingFaculty(null);
      form.reset();
    }
  };

  const openEditDialog = (faculty: UserProfile) => {
    setEditingFaculty(faculty);
    form.reset({
      displayName: faculty.displayName || "",
      email: faculty.email,
      phoneNumber: faculty.phoneNumber || "",
      assignedBranches: faculty.assignedBranches || [],
      facultyTitle: faculty.facultyTitle || "",
      password: "", 
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };
  
  const openCreateDialog = () => {
    setEditingFaculty(null);
    form.reset(); // Reset to default values including empty assignedBranches
    setIsFormOpen(true);
  }

  const handleDeleteFaculty = (email: string) => {
     if (typeof window !== 'undefined') {
        const confirmed = window.confirm("Are you sure you want to delete this faculty member? This action cannot be undone.");
        if (confirmed) {
            localStorage.removeItem(`campus_connect_user_${email.toLowerCase()}`);
            const mockUserStr = localStorage.getItem('mockUser');
            if (mockUserStr) {
                const mockUser = JSON.parse(mockUserStr);
                if (mockUser.email === email.toLowerCase() && mockUser.role === 'faculty') {
                    localStorage.removeItem('mockUser');
                }
            }
            toast({
                title: "Faculty Deleted",
                description: `Faculty member with email ${email} has been deleted.`,
            });
            fetchFaculty();
        }
    }
  };
  
  const filteredFaculty = facultyMembers.filter(faculty => {
    const searchLower = searchTerm.toLowerCase();
    return (
      faculty.displayName?.toLowerCase().includes(searchLower) ||
      faculty.email.toLowerCase().includes(searchLower) ||
      faculty.assignedBranches?.some(b => b.toLowerCase().includes(searchLower)) ||
      faculty.facultyTitle?.toLowerCase().includes(searchLower) ||
      faculty.phoneNumber?.includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading faculty...</span></div>;
  }

  return (
    <div className="space-y-6">
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
            form.reset();
            setEditingFaculty(null);
        }
      }}>
        <DialogTrigger asChild>
          <Button onClick={openCreateDialog} className="mb-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Faculty
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaculty ? "Edit Faculty Member" : "Add New Faculty Member"}</DialogTitle>
            <DialogDescription>
              {editingFaculty ? "Update the details of the faculty member." : "Enter the details for the new faculty member."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Dr. Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="jane.doe@example.com" {...field} disabled={!!editingFaculty} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facultyTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Role (e.g., Professor, HOD)</FormLabel>
                    <FormControl><Input placeholder="Professor of CSE" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedBranches"
                render={() => (
                  <FormItem>
                    <FormLabel>Assigned Branches</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                      {availableBranches.map((branch) => (
                        <FormField
                          key={branch}
                          control={form.control}
                          name="assignedBranches"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={branch}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(branch)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), branch])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== branch
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {branch}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingFaculty ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingFaculty ? "Confirm New Password" : "Confirm Password"}</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingFaculty ? "Update Faculty" : "Create Faculty"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            Faculty List
          </CardTitle>
          <CardDescription>Manage all faculty accounts.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search faculty..."
              className="pl-8 w-full sm:w-1/2 lg:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredFaculty.length === 0 && searchTerm === '' ? (
             <p className="text-muted-foreground">No faculty members found. Click "Add New Faculty" to create one.</p>
          ) : filteredFaculty.length === 0 && searchTerm !== '' ? (
            <p className="text-muted-foreground">No faculty members match your search criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Title/Role</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map(faculty => (
                  <TableRow key={faculty.uid}>
                    <TableCell>{faculty.displayName || 'N/A'}</TableCell>
                    <TableCell>{faculty.email}</TableCell>
                    <TableCell>{faculty.facultyTitle || 'N/A'}</TableCell>
                    <TableCell>
                        {faculty.assignedBranches && faculty.assignedBranches.length > 0 
                          ? faculty.assignedBranches.join(', ') 
                          : 'N/A'}
                    </TableCell>
                    <TableCell>{faculty.phoneNumber || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(faculty)}>
                            <Edit3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteFaculty(faculty.email)}>
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
