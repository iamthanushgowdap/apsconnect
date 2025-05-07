
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

// This constant is needed if we're dealing with the special hardcoded admin
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
  // User must attempt to change at least one thing
  if (!data.displayName && !data.newPassword) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a new display name or set a new password to update.",
        path: ["displayName"], // Or a general error for the form
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
        toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
        return;
    }
    if (!data.displayName && !data.newPassword) {
        toast({ title: "No Changes", description: "Please enter a new display name or password to update.", variant: "destructive"});
        form.setError("displayName", {message: "Please provide a new display name or set a new password to update."});
        return;
    }

    setFormSubmitting(true);

    try {
      const userProfileKey = `campus_connect_user_${authUser.uid}`;
      const userProfileStr = typeof window !== 'undefined' ? localStorage.getItem(userProfileKey) : null;
      let userProfile: UserProfile | null = userProfileStr ? JSON.parse(userProfileStr) : null;

      let currentPasswordMatches = false;
      if (data.newPassword) { // Password change attempt
        if (!data.currentPassword) {
            toast({ title: "Error", description: "Current password is required to change password.", variant: "destructive"});
            setFormSubmitting(false);
            return;
        }
        if (authUser.uid === ADMIN_EMAIL_CONST) {
            currentPasswordMatches = data.currentPassword === (userProfile?.password || ADMIN_PASSWORD_CONST);
        } else {
            currentPasswordMatches = userProfile ? data.currentPassword === userProfile.password : false;
        }

        if (!currentPasswordMatches) {
          toast({ title: "Incorrect Password", description: "The current password you entered is incorrect.", variant: "destructive" });
          form.setError("currentPassword", { message: "Incorrect current password." });
          setFormSubmitting(false);
          return;
        }
      }


      // Initialize profile if it doesn't exist (especially for the hardcoded admin first time editing)
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
            // This case should ideally not happen for non-admin users if they logged in via profile
            toast({ title: "Profile Error", description: "User profile not found.", variant: "destructive"});
            setFormSubmitting(false);
            return;
        }
      }
      
      let changesMade = false;
      if (data.displayName && data.displayName !== userProfile.displayName) {
        userProfile.displayName = data.displayName;
        changesMade = true;
      }
      if (data.newPassword && currentPasswordMatches) { // currentPasswordMatches ensure this block only runs if pass change is valid
        userProfile.password = data.newPassword;
        changesMade = true;
      }

      if (!changesMade && (!data.displayName || data.displayName === authUser.displayName) && !data.newPassword) {
        toast({ title: "No Changes Detected", description: "Your profile information is already up to date." });
        setFormSubmitting(false);
        return;
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(userProfileKey, JSON.stringify(userProfile));

        // Update mockUser in localStorage for AuthProvider to pick up on next load/refresh
        const updatedMockUser: User = {
          ...authUser,
          displayName: userProfile.displayName || authUser.displayName,
          // Password is not directly in mockUser for security but is in UserProfile
        };
        localStorage.setItem('mockUser', JSON.stringify(updatedMockUser));
        
        // Update context immediately
        updateUserContext(updatedMockUser);
      }

      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully updated.",
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
      });
    } finally {
      setFormSubmitting(false);
    }
  }

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!authUser) {
    // This should be caught by useEffect redirect, but as a fallback
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You must be logged in to view this page.</p>
            <Link href="/login"><Button variant="outline" className="mt-6">Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container flex min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] items-center justify-center py-8 sm:py-12 px-4">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Profile Settings</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Update your display name or password. Email: {authUser.email || authUser.usn}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              
              <div className="space-y-1 pt-2">
                <h3 className="text-md font-medium">Change Password</h3>
                 <FormDescription className="text-xs">
                    Leave password fields blank if you do not wish to change your password.
                </FormDescription>
              </div>

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormDescription className="text-xs">Required if changing password.</FormDescription>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base" disabled={formSubmitting}>
                {formSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Profile"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
            <Link href="/dashboard" className="font-medium text-primary hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
