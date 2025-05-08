
"use client";

import React, { useEffect, useState, useRef } from 'react';
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
import { Loader2, ShieldCheck, UserCircle, Edit3, Trash2, Camera } from 'lucide-react';
import Link from 'next/link';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ADMIN_EMAIL_CONST = "admin@gmail.com"; 
const ADMIN_PASSWORD_CONST = "admin123";


const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
  currentEmail: z.string().email({ message: "Invalid current email address." }).optional(),
  newEmail: z.string().email({ message: "Invalid new email address." }).optional(),
  confirmNewEmail: z.string().optional(),
})
.superRefine((data, ctx) => {
  // Password change validation
  if (data.newPassword) {
    if (!data.currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Current password is required to change password.", path: ["currentPassword"] });
    }
    if (data.newPassword.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New password must be at least 6 characters.", path: ["newPassword"] });
    }
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New passwords do not match.", path: ["confirmNewPassword"] });
    }
  } else if (data.currentPassword && !data.newPassword && !data.confirmNewPassword) { 
     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a new password.", path: ["newPassword"] });
  } else if (data.currentPassword && data.confirmNewPassword && !data.newPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a new password.", path: ["newPassword"] });
  }


  // Email change validation
  if (data.newEmail) {
    if (!data.currentEmail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Current email is required to change email.", path: ["currentEmail"] });
    }
    if (data.newEmail === data.currentEmail) { // This will be checked against actual current email in submit
      // This specific check can be complex here if currentEmail field might not match authUser.email
    }
    if (data.newEmail !== data.confirmNewEmail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New emails do not match.", path: ["confirmNewEmail"] });
    }
  } else if (data.currentEmail && !data.newEmail && !data.confirmNewEmail) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a new email address.", path: ["newEmail"] });
  } else if (data.currentEmail && data.confirmNewEmail && !data.newEmail) {
     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a new email address.", path: ["newEmail"] });
  }
});


type ProfileFormValues = z.infer<typeof profileSchema>;

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isLoading: authLoading, updateUserContext } = useAuth();
  
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      currentEmail: "",
      newEmail: "",
      confirmNewEmail: "",
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (authUser && typeof window !== 'undefined') {
        const profileKey = `apsconnect_user_${authUser.uid}`;
        const profileStr = localStorage.getItem(profileKey);
        if (profileStr) {
          const parsedProfile = JSON.parse(profileStr) as UserProfile;
          setUserProfileState(parsedProfile);
          setAvatarPreview(parsedProfile.avatarDataUrl || null);
          form.reset({ 
            displayName: parsedProfile.displayName || "",
            // Email fields are not pre-filled by default for change operation
            currentEmail: "", 
            newEmail: "",
            confirmNewEmail: ""
          });
        } else if (authUser.role === 'admin' && authUser.uid === ADMIN_EMAIL_CONST) {
           const defaultAdminProfile: UserProfile = {
            uid: ADMIN_EMAIL_CONST,
            email: ADMIN_EMAIL_CONST,
            role: 'admin',
            displayName: 'Admin User',
            registrationDate: new Date().toISOString(),
            isApproved: true,
            password: ADMIN_PASSWORD_CONST,
          };
          setUserProfileState(defaultAdminProfile);
          setAvatarPreview(null);
          form.reset({ displayName: defaultAdminProfile.displayName || "" });
        } else {
          router.push('/login'); // Profile not found, redirect
        }
      } else if (!authUser) {
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB for avatar
        toast({ title: "File too large", description: "Avatar image must be less than 2MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const dataUrl = await readFileAsDataURL(file);
      setAvatarPreview(dataUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!authUser || !userProfile) {
        toast({ title: "Error", description: "User session or profile not found.", variant: "destructive", duration: 3000 });
        return;
    }

    let changesMade = false;
    const updatedProfileData = { ...userProfile };

    // Check if any actual data to update is provided
    const isDisplayNameChanged = data.displayName && data.displayName !== userProfile.displayName;
    const isPasswordChanged = !!data.newPassword;
    const isEmailChanged = !!data.newEmail;
    const isAvatarChanged = selectedFile || (avatarPreview === null && userProfile.avatarDataUrl);


    if (!isDisplayNameChanged && !isPasswordChanged && !isEmailChanged && !isAvatarChanged) {
        toast({ title: "No Changes", description: "Please provide new information to update.", variant: "default", duration: 3000});
        return;
    }
    
    setFormSubmitting(true);

    try {
      // Profile Picture Update
      if (selectedFile) {
        updatedProfileData.avatarDataUrl = await readFileAsDataURL(selectedFile);
        changesMade = true;
      } else if (avatarPreview === null && userProfile.avatarDataUrl) { // Avatar removed
        updatedProfileData.avatarDataUrl = undefined;
        changesMade = true;
      }

      // Display Name Update
      if (data.displayName && data.displayName !== userProfile.displayName) {
        updatedProfileData.displayName = data.displayName;
        changesMade = true;
      }

      // Password Update
      if (data.newPassword) {
        if (!data.currentPassword) { // Redundant due to schema, but good practice
             form.setError("currentPassword", { message: "Current password is required."});
             setFormSubmitting(false); return;
        }
        const actualCurrentPassword = userProfile.password || (userProfile.uid === ADMIN_EMAIL_CONST ? ADMIN_PASSWORD_CONST : "");
        if (data.currentPassword !== actualCurrentPassword) {
          toast({ title: "Incorrect Password", description: "The current password you entered is incorrect.", variant: "destructive", duration: 3000 });
          form.setError("currentPassword", { message: "Incorrect current password." });
          setFormSubmitting(false);
          return;
        }
        updatedProfileData.password = data.newPassword;
        changesMade = true;
      }

      // Email Update
      let oldEmailKey: string | null = null;
      let newEmailKey: string | null = null;

      if (data.newEmail) {
        if (!data.currentEmail) { // Redundant
            form.setError("currentEmail", { message: "Current email is required."});
            setFormSubmitting(false); return;
        }
        if (data.currentEmail.toLowerCase() !== userProfile.email.toLowerCase()) {
          toast({ title: "Incorrect Email", description: "The current email you entered is incorrect.", variant: "destructive", duration: 3000 });
          form.setError("currentEmail", { message: "Incorrect current email." });
          setFormSubmitting(false);
          return;
        }
         if (data.newEmail.toLowerCase() === userProfile.email.toLowerCase()) {
          toast({ title: "Same Email", description: "New email cannot be the same as the current email.", variant: "destructive", duration: 3000});
          form.setError("newEmail", { message: "New email cannot be the same as the current email." });
          setFormSubmitting(false); return;
        }

        oldEmailKey = `apsconnect_user_${userProfile.uid}`; // uid is email for admin/faculty
        updatedProfileData.email = data.newEmail.toLowerCase();
        if (userProfile.role === 'admin' || userProfile.role === 'faculty') {
          updatedProfileData.uid = data.newEmail.toLowerCase(); // UID changes for admin/faculty
          newEmailKey = `apsconnect_user_${updatedProfileData.uid}`;
        }
        changesMade = true;
      }

      if (!changesMade) {
        toast({ title: "No Effective Changes", description: "Profile information is already up to date.", duration: 3000 });
        setFormSubmitting(false);
        return;
      }
      
      if (typeof window !== 'undefined') {
        if (newEmailKey && oldEmailKey && oldEmailKey !== newEmailKey && (userProfile.role === 'admin' || userProfile.role === 'faculty')) {
          localStorage.removeItem(oldEmailKey);
          localStorage.setItem(newEmailKey, JSON.stringify(updatedProfileData));
        } else {
          localStorage.setItem(`apsconnect_user_${updatedProfileData.uid}`, JSON.stringify(updatedProfileData));
        }

        const updatedAuthUser: User = {
          ...authUser,
          uid: updatedProfileData.uid, // Update UID if it changed (for admin/faculty)
          email: updatedProfileData.email,
          displayName: updatedProfileData.displayName || authUser.displayName,
          // avatarDataUrl could be added to User interface if needed in navbar directly
        };
        localStorage.setItem('mockUser', JSON.stringify(updatedAuthUser));
        updateUserContext(updatedAuthUser); // This updates the auth context
        setUserProfileState(updatedProfileData); // Update local component state
      }

      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully updated.",
        duration: 3000,
      });
      form.reset({ 
        displayName: updatedProfileData.displayName, 
        currentPassword: "", newPassword: "", confirmNewPassword: "",
        currentEmail: "", newEmail: "", confirmNewEmail: ""
      });
      setSelectedFile(null); // Clear selected file after successful upload

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

  if (pageLoading || authLoading || !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!authUser) { // Should be caught by useEffect too, but as a fallback
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader><CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle></CardHeader>
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
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="items-center text-center sm:text-left">
           <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={avatarPreview || undefined} alt={userProfile.displayName || "User"} data-ai-hint="person avatar" />
              <AvatarFallback className="text-3xl">
                {userProfile.displayName ? userProfile.displayName.substring(0, 2).toUpperCase() : <UserCircle className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> Change Photo
              </Button>
              <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/gif, image/webp" 
                onChange={handleFileChange} 
              />
              {avatarPreview && (
                <Button size="sm" variant="destructive" onClick={handleRemoveAvatar}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-primary text-center">{userProfile.displayName || "User Profile"}</CardTitle>
            <CardDescription className="text-base sm:text-lg text-center">
              Email: {userProfile.email}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {userProfile.role === 'student' && userProfile.usn && (
                <FormItem>
                  <FormLabel>University Seat Number (USN)</FormLabel>
                  <FormControl>
                    <Input value={userProfile.usn} readOnly disabled className="bg-muted/50" />
                  </FormControl>
                  <FormDescription>Your USN is not editable.</FormDescription>
                </FormItem>
              )}
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
                <p className="text-xs text-muted-foreground">Leave blank if you do not wish to change password.</p>
              </div>
              <FormField control={form.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />

              <div className="space-y-1 pt-4 border-t">
                <h3 className="text-md font-medium text-foreground">Change Email</h3>
                <p className="text-xs text-muted-foreground">Leave blank if you do not wish to change email.</p>
              </div>
              <FormField control={form.control} name="currentEmail" render={({ field }) => (<FormItem><FormLabel>Current Email ({userProfile.email})</FormLabel><FormControl><Input type="email" placeholder="Enter your current email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="newEmail" render={({ field }) => (<FormItem><FormLabel>New Email</FormLabel><FormControl><Input type="email" placeholder="Enter new email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="confirmNewEmail" render={({ field }) => (<FormItem><FormLabel>Confirm New Email</FormLabel><FormControl><Input type="email" placeholder="Confirm new email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              
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

