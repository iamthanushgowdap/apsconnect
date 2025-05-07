
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Branch, defaultBranches } from '@/types';
import type { User } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Users, Loader2, Search, XCircle, MessageSquareWarning, Info, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


interface ManageStudentsTabProps {
  actor: User; // The user performing the actions (admin or faculty)
}

const rejectionFormSchema = z.object({
  reason: z.string().min(10, { message: "Rejection reason must be at least 10 characters." }).max(500, { message: "Reason cannot exceed 500 characters." }),
});
type RejectionFormValues = z.infer<typeof rejectionFormSchema>;

const adminChangePasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});
type AdminChangePasswordFormValues = z.infer<typeof adminChangePasswordSchema>;


export default function ManageStudentsTab({ actor }: ManageStudentsTabProps) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [studentToProcess, setStudentToProcess] = useState<UserProfile | null>(null);
  const [isApproveDialogVisible, setIsApproveDialogVisible] = useState(false);
  const [isRejectDialogVisible, setIsRejectDialogVisible] = useState(false);

  const [studentToChangePassword, setStudentToChangePassword] = useState<UserProfile | null>(null);
  const [isChangePasswordDialogVisible, setIsChangePasswordDialogVisible] = useState(false);

  const rejectionForm = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues: { reason: "" },
  });

  const adminChangePasswordForm = useForm<AdminChangePasswordFormValues>({
    resolver: zodResolver(adminChangePasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });


  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      let users: UserProfile[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('campus_connect_user_')) {
          try {
            const user = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
            if (user.uid && user.usn) { 
              users.push(user);
            }
          } catch (error) {
            console.error("Failed to parse user from localStorage:", key, error);
          }
        }
      }

      if (actor.role === 'faculty' && actor.assignedBranches) {
        users = users.filter(user => {
          const studentBranch = user.branch; 
          return studentBranch && actor.assignedBranches!.includes(studentBranch);
        });
      }
      setAllUsers(users.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
    }
    setIsLoading(false);
  }, [actor]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openApproveDialog = (student: UserProfile) => {
    setStudentToProcess(student);
    setIsApproveDialogVisible(true);
  };

  const openRejectDialog = (student: UserProfile) => {
    setStudentToProcess(student);
    rejectionForm.reset();
    setIsRejectDialogVisible(true);
  };
  
  const openChangePasswordDialog = (student: UserProfile) => {
    setStudentToChangePassword(student);
    adminChangePasswordForm.reset();
    setIsChangePasswordDialogVisible(true);
  };

  const handleApproveStudent = () => {
    if (!studentToProcess || !studentToProcess.usn) return;
    const usn = studentToProcess.usn;

    if (typeof window !== 'undefined' && actor) {
      const userKey = `campus_connect_user_${usn}`;
      const userDataStr = localStorage.getItem(userKey);
      if (userDataStr) {
        try {
          const user = JSON.parse(userDataStr) as UserProfile;
          user.role = 'student';
          user.isApproved = true;
          user.approvedByUid = actor.uid;
          user.approvedByDisplayName = actor.displayName || actor.email || 'System';
          user.approvalDate = new Date().toISOString();
          user.rejectionReason = undefined; 
          user.rejectedByUid = undefined;
          user.rejectedByDisplayName = undefined;
          user.rejectedDate = undefined;
          
          localStorage.setItem(userKey, JSON.stringify(user));
          
          const mockUserStr = localStorage.getItem('mockUser');
          if (mockUserStr) {
            const mockUser = JSON.parse(mockUserStr);
            if (mockUser.usn === usn && mockUser.role === 'pending') {
              mockUser.role = 'student';
              mockUser.isApproved = true;
              localStorage.setItem('mockUser', JSON.stringify(mockUser));
            }
          }

          toast({
            title: 'Student Approved',
            description: `${user.displayName || user.usn} has been approved by ${user.approvedByDisplayName}.`,
          });
          fetchUsers(); 
        } catch (error) {
          toast({
            title: 'Error Approving Student',
            description: 'Could not update student status.',
            variant: 'destructive',
          });
          console.error("Error approving student:", error);
        }
      }
    }
    setIsApproveDialogVisible(false);
    setStudentToProcess(null);
  };

  const handleRejectStudent = (data: RejectionFormValues) => {
    if (!studentToProcess || !studentToProcess.usn) return;
    const usn = studentToProcess.usn;

    if (typeof window !== 'undefined' && actor) {
      const userKey = `campus_connect_user_${usn}`;
      const userDataStr = localStorage.getItem(userKey);
      if (userDataStr) {
        try {
          const user = JSON.parse(userDataStr) as UserProfile;
          user.role = 'pending'; 
          user.isApproved = false;
          user.rejectionReason = data.reason;
          user.rejectedByUid = actor.uid;
          user.rejectedByDisplayName = actor.displayName || actor.email || 'System';
          user.rejectedDate = new Date().toISOString();
          user.approvedByUid = undefined; 
          user.approvedByDisplayName = undefined;
          user.approvalDate = undefined;

          localStorage.setItem(userKey, JSON.stringify(user));

           const mockUserStr = localStorage.getItem('mockUser');
            if (mockUserStr) {
                const mockUser = JSON.parse(mockUserStr);
                if (mockUser.usn === usn) { 
                    mockUser.role = 'pending';
                    mockUser.isApproved = false; 
                    localStorage.setItem('mockUser', JSON.stringify(mockUser));
                }
            }

          toast({
            title: 'Student Rejected',
            description: `${user.displayName || user.usn} has been rejected. Reason: ${data.reason}`,
            variant: "default" 
          });
          fetchUsers();
        } catch (error) {
          toast({
            title: 'Error Rejecting Student',
            description: 'Could not update student status.',
            variant: 'destructive',
          });
          console.error("Error rejecting student:", error);
        }
      }
    }
    setIsRejectDialogVisible(false);
    setStudentToProcess(null);
    rejectionForm.reset();
  };

  const handleAdminChangePassword = (data: AdminChangePasswordFormValues) => {
    if (!studentToChangePassword || !studentToChangePassword.usn) return;
    const usn = studentToChangePassword.usn;

    if (typeof window !== 'undefined' && actor.role === 'admin') {
      const userKey = `campus_connect_user_${usn}`;
      const userDataStr = localStorage.getItem(userKey);
      if (userDataStr) {
        try {
          const userProfile = JSON.parse(userDataStr) as UserProfile;
          userProfile.password = data.newPassword;
          localStorage.setItem(userKey, JSON.stringify(userProfile));
          toast({
            title: "Password Changed",
            description: `Password for ${userProfile.displayName || usn} has been updated by admin.`,
          });
        } catch (error) {
          toast({
            title: 'Error Changing Password',
            description: 'Could not update student password.',
            variant: 'destructive',
          });
          console.error("Error changing student password by admin:", error);
        }
      }
    } else {
       toast({
            title: 'Unauthorized',
            description: 'Only administrators can perform this action.',
            variant: 'destructive',
        });
    }
    setIsChangePasswordDialogVisible(false);
    setStudentToChangePassword(null);
    adminChangePasswordForm.reset();
  };
  
  const filteredUsers = allUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const branch = user.branch; 
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.usn?.toLowerCase().includes(searchLower) ||
      branch?.toLowerCase().includes(searchLower) ||
      user.approvedByDisplayName?.toLowerCase().includes(searchLower) ||
      user.rejectedByDisplayName?.toLowerCase().includes(searchLower) ||
      user.rejectionReason?.toLowerCase().includes(searchLower)
    );
  });

  const pendingActionStudents = filteredUsers.filter(user => user.role === 'pending' && !user.isApproved && !user.rejectionReason);
  const processedStudents = filteredUsers.filter(user => user.role === 'student' || (user.role === 'pending' && user.rejectionReason));


  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading students...</span></div>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-6 w-6" />
            Pending Student Actions
          </CardTitle>
          <CardDescription>Review and approve or reject new student registrations.
             {actor.role === 'faculty' && ' Students listed are from your assigned branches.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingActionStudents.length === 0 ? (
            <p className="text-muted-foreground">No students pending action.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingActionStudents.map(student => (
                  <TableRow key={student.uid}>
                    <TableCell>{student.displayName || 'N/A'}</TableCell>
                    <TableCell>{student.usn}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.branch || 'N/A'}</TableCell>
                    <TableCell>{new Date(student.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openApproveDialog(student)} className="bg-green-500/10 hover:bg-green-500/20 text-green-700 border-green-500">
                        <CheckCircle className="mr-1 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Approve</span>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openRejectDialog(student)}>
                        <XCircle className="mr-1 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Reject</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            Student Records
          </CardTitle>
           <CardDescription>View all processed (approved or rejected) student accounts. Search by name, USN, email, branch, or processor.
            {actor.role === 'faculty' && ' Students listed are from your assigned branches.'}
           </CardDescription>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search student records..."
              className="pl-8 w-full sm:w-1/2 lg:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {processedStudents.length === 0 && searchTerm === '' ? (
             <p className="text-muted-foreground">No processed student records found.</p>
          ) : processedStudents.length === 0 && searchTerm !== '' ? (
             <p className="text-muted-foreground">No student records match your search criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedStudents.map(student => (
                  <TableRow key={student.uid}>
                    <TableCell>{student.displayName || 'N/A'}</TableCell>
                    <TableCell>{student.usn}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.branch || 'N/A'}</TableCell>
                    <TableCell>
                      {student.isApproved && student.role === 'student' ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">Approved</Badge>
                      ) : student.rejectionReason ? (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-700 hover:bg-red-500/30">Rejected</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge> 
                      )}
                    </TableCell>
                    <TableCell>
                      {student.isApproved ? student.approvedByDisplayName : student.rejectedByDisplayName}
                       {' '}({student.isApproved ? student.approvedByUid : student.rejectedByUid})
                    </TableCell>
                    <TableCell>
                      {student.isApproved && student.approvalDate ? new Date(student.approvalDate).toLocaleDateString() : 
                       student.rejectedDate ? new Date(student.rejectedDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {student.rejectionReason && (
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default">
                                        <MessageSquareWarning className="mr-2 h-4 w-4 text-destructive" />
                                        <span>Reason: {student.rejectionReason.substring(0,20)}{student.rejectionReason.length > 20 ? '...' : ''}</span>
                                        {/* Full reason can be in a tooltip for the item or a separate view details dialog */}
                                    </DropdownMenuItem>
                                )}
                                {student.isApproved && (
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default">
                                        <Info className="mr-2 h-4 w-4 text-green-600" /> Approved
                                    </DropdownMenuItem>
                                )}
                                {actor.role === 'admin' && (student.role === 'student' || student.role === 'pending') && (
                                    <DropdownMenuItem onClick={() => openChangePasswordDialog(student)}>
                                        <KeyRound className="mr-2 h-4 w-4" /> Change Password
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={isApproveDialogVisible} onOpenChange={setIsApproveDialogVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve student {studentToProcess?.displayName || studentToProcess?.usn}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToProcess(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveStudent} className="bg-green-600 hover:bg-green-700">Confirm Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogVisible} onOpenChange={(isOpen) => {
        setIsRejectDialogVisible(isOpen);
        if (!isOpen) {
          setStudentToProcess(null);
          rejectionForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Student Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {studentToProcess?.displayName || studentToProcess?.usn}. This reason will be recorded.
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectionForm}>
            <form onSubmit={rejectionForm.handleSubmit(handleRejectStudent)} className="space-y-4 py-2 pb-4">
              <FormField
                control={rejectionForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason (Mandatory)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Incomplete application details, document mismatch..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={() => setStudentToProcess(null)}>Cancel</Button>
                </DialogClose>
                <Button type="submit" variant="destructive" disabled={rejectionForm.formState.isSubmitting}>
                  {rejectionForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Reject
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Admin Change Student Password Dialog */}
      <Dialog open={isChangePasswordDialogVisible && actor.role === 'admin'} onOpenChange={(isOpen) => {
        setIsChangePasswordDialogVisible(isOpen);
        if (!isOpen) {
          setStudentToChangePassword(null);
          adminChangePasswordForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password for {studentToChangePassword?.displayName || studentToChangePassword?.usn}</DialogTitle>
            <DialogDescription>
              Set a new password for this student. The student will need to be informed of their new password.
            </DialogDescription>
          </DialogHeader>
          <Form {...adminChangePasswordForm}>
            <form onSubmit={adminChangePasswordForm.handleSubmit(handleAdminChangePassword)} className="space-y-4 py-2 pb-4">
              <FormField
                control={adminChangePasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminChangePasswordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={() => setStudentToChangePassword(null)}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={adminChangePasswordForm.formState.isSubmitting}>
                  {adminChangePasswordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set New Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
    </TooltipProvider>
  );
}

