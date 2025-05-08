
"use client";

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, User } from '@/components/auth-provider';
import type { UserProfile } from '@/types';
import { Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

const ADMIN_EMAIL_CONST = "admin@gmail.com"; 
const ADMIN_PASSWORD_CONST = "admin123";


const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }).optional(),
  confirmNewPassword: z.string().optional(),
})
.superRefine((data, ctx) => {
  if (data.newPassword && !data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Current password is required to change your password.",
      path: ["currentPassword"],
    });
  }
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New passwords do not match.",
      path: ["confirmNewPassword"],
    });
  }
  if (!data.displayName && !data.newPassword) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a new display name or set a new password to update.",
        path: ["displayName"], 
    });
  }
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isLoading: authLoading, updateUserContext } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        form.reset({ displayName: authUser.displayName || "" });
      } else {
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!authUser) {
        toast({ title: "Error", description: "You are not logged in.", variant: "destructive", duration: 3000 });
        return;
    }
    if (!data.displayName && !data.newPassword) {
        toast({ title: "No Changes", description: "Please enter a new display name or password to update.", variant: "destructive", duration: 3000});
        form.setError("displayName", {message: "Please provide a new display name or set a new password to update."});
        return;
    }

    setFormSubmitting(true);

    try {
      const userProfileKey = `apsconnect_user_${authUser.uid}`; 
      const userProfileStr = typeof window !== 'undefined' ? localStorage.getItem(userProfileKey) : null;
      let userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

      let currentPasswordMatches = false;
      if (data.newPassword) { 
        if (!data.currentPassword) {
            toast({ title: "Error", description: "Current password is required to change password.", variant: "destructive", duration: 3000});
            setFormSubmitting(false);
            return;
        }
        if (authUser.uid === ADMIN_EMAIL_CONST) {
            currentPasswordMatches = data.currentPassword === (userProfile?.password || ADMIN_PASSWORD_CONST);
        } else {
            currentPasswordMatches = userProfile ? data.currentPassword === userProfile.password : false;
        }

        if (!currentPasswordMatches) {
          toast({ title: "Incorrect Password", description: "The current password you entered is incorrect.", variant: "destructive", duration: 3000 });
          form.setError("currentPassword", { message: "Incorrect current password." });
          setFormSubmitting(false);
          return;
        }
      }

      if (!userProfile) {
        if (authUser.uid === ADMIN_EMAIL_CONST) {
            userProfile = {
                uid: authUser.uid,
                email: authUser.email!,
                displayName: authUser.displayName || ADMIN_EMAIL_CONST.split('@')[0],
                role: 'admin',
                isApproved: true,
                registrationDate: new Date().toISOString(),
            };
        } else {
            toast({ title: "Profile Error", description: "User profile not found.", variant: "destructive", duration: 3000});
            setFormSubmitting(false);
            return;
        }
      }
      
      let changesMade = false;
      if (data.displayName && data.displayName !== userProfile.displayName) {
        userProfile.displayName = data.displayName;
        changesMade = true;
      }
      if (data.newPassword && currentPasswordMatches) { 
        userProfile.password = data.newPassword;
        changesMade = true;
      }

      if (!changesMade && (!data.displayName || data.displayName === authUser.displayName) && !data.newPassword) {
        toast({ title: "No Changes Detected", description: "Your profile information is already up to date.", duration: 3000 });
        setFormSubmitting(false);
        return;
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(userProfileKey, JSON.stringify(userProfile));

        const updatedMockUser = {
          ...authUser,
          displayName: userProfile.displayName || authUser.displayName,
        };
        localStorage.setItem('mockUser', JSON.stringify(updatedMockUser));
        
        updateUserContext(updatedMockUser);
      }

      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully updated.",
        duration: 3000,
      });
      form.reset({ 
        displayName: userProfile.displayName, 
        currentPassword: "", 
        newPassword: "", 
        confirmNewPassword: "" 
      });

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setFormSubmitting(false);
    }
  }

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You must be logged in to view this page.</p>
            <Link href="/login">
              <Button variant="outline" className="mt-6">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-xl mx-auto shadow-xl">
        <CardHeader className="text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <UserCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Profile Settings</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Update your display name or password. Email: {authUser.email || authUser.usn}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-1 pt-4 border-t">
                <h3 className="text-md font-medium text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">Leave password fields blank if you do not wish to change your password.</p>
              </div>
              
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Required if changing password.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
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
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={formSubmitting}>
                {formSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Profile"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/dashboard">
              <Button variant="link" className="text-sm text-muted-foreground">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
