
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, User } from '@/components/auth-provider';
import type { UserProfile, Semester, NotificationPreferences } from '@/types'; 
import { semesters as allSemesters, postCategories } from '@/types'; 
import { Loader2, ShieldCheck, Camera, Trash2, ArrowLeft, UserSpeak, Bell } from 'lucide-react';
import Link from 'next/link';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

const ADMIN_EMAIL_CONST = "admin@gmail.com";
const ADMIN_PASSWORD_CONST = "admin123";

const defaultNotificationPreferences: NotificationPreferences = {
  news: true,
  events: true,
  notes: true,
  schedules: true,
  general: true,
};


const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).optional().or(z.literal('')),
  pronouns: z.string().max(50, { message: "Pronouns cannot exceed 50 characters." }).optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
  currentEmail: z.string().email({ message: "Invalid current email address." }).optional().or(z.literal('')),
  newEmail: z.string().email({ message: "Invalid new email address." }).optional().or(z.literal('')),
  confirmNewEmail: z.string().optional().or(z.literal('')),
  notificationPreferences: z.object({
    news: z.boolean(),
    events: z.boolean(),
    notes: z.boolean(),
    schedules: z.boolean(),
    general: z.boolean(),
  }).optional(),
})
.superRefine((data, ctx) => {
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


  if (data.newEmail) {
    if (!data.currentEmail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Current email is required to change email.", path: ["currentEmail"] });
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

const getProfileInitials = (profile: UserProfile | User | null): string => {
  if (!profile) return "??";
  const nameSource = profile.displayName || profile.email || ('usn' in profile && profile.usn ? profile.usn : undefined);
  if (!nameSource) return "??";

  const nameParts = nameSource.split(/[\s@]+/);
  if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
    const firstInitial = nameParts[0][0];
    let secondInitial = '';
    const lastPart = nameParts[nameParts.length - 1];
    if (lastPart && lastPart.length > 0 && nameParts.length > 1) {
       secondInitial = lastPart[0];
    } else if (nameParts[0].length > 1) {
      secondInitial = nameParts[0][1];
    }
    return `${firstInitial}${secondInitial}`.toUpperCase();
  }
  if (nameSource.length >=2) return nameSource.substring(0, 2).toUpperCase();
  if (nameSource.length === 1) return nameSource.substring(0,1).toUpperCase();
  return "??";
};


export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isLoading: authLoading, updateUserContext } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      pronouns: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      currentEmail: "",
      newEmail: "",
      confirmNewEmail: "",
      notificationPreferences: defaultNotificationPreferences,
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        if (typeof window !== 'undefined') {
          const profileKey = `apsconnect_user_${authUser.uid}`;
          const profileStr = localStorage.getItem(profileKey);
          if (profileStr) {
            const fetchedProfile = JSON.parse(profileStr) as UserProfile;
            setUserProfile(fetchedProfile);
            form.reset({
              displayName: fetchedProfile.displayName || "",
              pronouns: fetchedProfile.pronouns || "",
              currentEmail: fetchedProfile.email, // For verification if changing email
              notificationPreferences: fetchedProfile.notificationPreferences || defaultNotificationPreferences,
            });
            setAvatarPreview(fetchedProfile.avatarDataUrl);
          } else {
            // This case should ideally not happen for a logged-in user
            // For safety, redirect or show an error
            toast({ title: "Profile Error", description: "Could not load your profile data.", variant: "destructive"});
            router.push('/dashboard'); 
          }
        }
        setPageLoading(false);
      }
    }
  }, [authUser, authLoading, router, form, toast]);


  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File too large", description: "Avatar image must be less than 2MB.", variant: "destructive" });
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a PNG, JPG, or GIF.", variant: "destructive" });
        return;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        setAvatarPreview(dataUrl);
      } catch (error) {
        toast({ title: "Error processing image", variant: "destructive" });
      }
    }
  };
  
  const removeAvatar = () => {
    setAvatarPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };


  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);
    if (!userProfile || !authUser) {
      toast({ title: "Error", description: "User session not found.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    let updatedProfileData = { ...userProfile };
    let passwordChanged = false;
    let emailChanged = false;

    // Update display name and pronouns
    updatedProfileData.displayName = data.displayName || userProfile.displayName;
    updatedProfileData.pronouns = data.pronouns || undefined;
    updatedProfileData.avatarDataUrl = avatarPreview;

    // Handle Password Change
    if (data.newPassword) {
      if (userProfile.role === 'admin' && userProfile.email === ADMIN_EMAIL_CONST) {
        // Special handling for default admin
        if (data.currentPassword !== (userProfile.password || ADMIN_PASSWORD_CONST) ) {
          form.setError("currentPassword", { type: "manual", message: "Incorrect current password for admin." });
          setIsSaving(false);
          return;
        }
      } else if (data.currentPassword !== userProfile.password) {
        form.setError("currentPassword", { type: "manual", message: "Incorrect current password." });
        setIsSaving(false);
        return;
      }
      updatedProfileData.password = data.newPassword;
      passwordChanged = true;
    }

    // Handle Email Change
    if (data.newEmail && data.currentEmail && data.newEmail.toLowerCase() !== data.currentEmail.toLowerCase()) {
        if (data.currentEmail.toLowerCase() !== userProfile.email.toLowerCase()) {
            form.setError("currentEmail", { type: "manual", message: "Current email address does not match records." });
            setIsSaving(false);
            return;
        }
        // Check if new email already exists
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('apsconnect_user_') && key !== `apsconnect_user_${userProfile.uid}`) {
              const otherProfileStr = localStorage.getItem(key);
              if (otherProfileStr) {
                const otherProfile = JSON.parse(otherProfileStr) as UserProfile;
                if (otherProfile.email.toLowerCase() === data.newEmail.toLowerCase()) {
                  form.setError("newEmail", { type: "manual", message: "This email address is already in use." });
                  setIsSaving(false);
                  return;
                }
              }
            }
          }
        }
        updatedProfileData.email = data.newEmail.toLowerCase();
        // Note: UID for admin/faculty is their email. If email changes, UID should change.
        // This requires deleting the old record and creating a new one.
        emailChanged = true;
    }
    
    // Update notification preferences
    updatedProfileData.notificationPreferences = data.notificationPreferences || userProfile.notificationPreferences || defaultNotificationPreferences;


    try {
      if (typeof window !== 'undefined') {
        if (emailChanged && (userProfile.role === 'admin' || userProfile.role === 'faculty')) {
          // UID changes, so remove old and add new
          localStorage.removeItem(`apsconnect_user_${userProfile.uid}`); // Remove old record
          updatedProfileData.uid = updatedProfileData.email; // New UID
          localStorage.setItem(`apsconnect_user_${updatedProfileData.uid}`, JSON.stringify(updatedProfileData));
           // If the logged-in user themselves changed email, update mockUser and re-authenticate or redirect
          if (authUser.uid === userProfile.uid) {
            updateUserContext({ ...authUser, ...updatedProfileData, email: updatedProfileData.email, uid: updatedProfileData.uid, displayName: updatedProfileData.displayName, avatarDataUrl: updatedProfileData.avatarDataUrl, pronouns: updatedProfileData.pronouns, notificationPreferences: updatedProfileData.notificationPreferences });
          }
        } else {
          // UID remains the same (student email change or no email change for faculty/admin)
          localStorage.setItem(`apsconnect_user_${userProfile.uid}`, JSON.stringify(updatedProfileData));
           if (authUser.uid === userProfile.uid) {
             updateUserContext({ ...authUser, ...updatedProfileData, displayName: updatedProfileData.displayName, avatarDataUrl: updatedProfileData.avatarDataUrl, pronouns: updatedProfileData.pronouns, notificationPreferences: updatedProfileData.notificationPreferences });
           }
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved.",
        duration: 3000,
      });
      if (passwordChanged || (emailChanged && authUser.uid === userProfile.uid)) {
        toast({ title: "Security Change", description: "You've been logged out due to security changes. Please log in again.", duration: 5000});
        // Wait for toast to be visible then sign out
        setTimeout(() => {
            if (typeof window !== 'undefined') localStorage.removeItem('mockUser');
            router.push('/login');
        }, 1000);
      } else {
        form.reset({
            ...form.getValues(), // Keep other form values
            currentPassword: "", // Clear password fields
            newPassword: "",
            confirmNewPassword: "",
            currentEmail: updatedProfileData.email, // Update current email for next potential change
            newEmail: "",
            confirmNewEmail: ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!authUser || !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader><CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle></CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You must be logged in to view this page.</p>
            <Link href="/login"><Button variant="outline" className="mt-6">Go to Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
            <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </div>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Profile Settings</CardTitle>
          <CardDescription>Manage your account details and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32 ring-4 ring-primary/20 shadow-lg">
                    <AvatarImage src={avatarPreview} alt={userProfile.displayName || userProfile.email || "User Avatar"} data-ai-hint="person face" />
                    <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                        {getProfileInitials(userProfile)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="mr-2 h-4 w-4"/> Change Photo
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                    {avatarPreview && (
                         <Button type="button" variant="destructive" size="sm" onClick={removeAvatar}>
                            <Trash2 className="mr-2 h-4 w-4"/> Remove
                        </Button>
                    )}
                </div>
            </div>

            {/* Personal Information */}
            <Card className="p-6 shadow-md rounded-lg">
                <CardHeader className="p-0 pb-4 mb-4 border-b">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                        <UserSpeak className="mr-2 h-5 w-5 text-primary"/> Personal Information
                    </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                    {userProfile.role === 'student' && userProfile.usn && (
                        <FormItem>
                            <FormLabel className="text-sm">University Seat Number (USN)</FormLabel>
                            <Input value={userProfile.usn} disabled className="bg-muted/50 text-muted-foreground" />
                            <FormDescription className="text-xs">Your USN cannot be changed.</FormDescription>
                        </FormItem>
                    )}
                    {userProfile.role === 'student' && userProfile.semester && (
                        <FormItem>
                            <FormLabel className="text-sm">Semester</FormLabel>
                            <Input value={userProfile.semester} disabled className="bg-muted/50 text-muted-foreground" />
                            <FormDescription className="text-xs">Your semester is managed by the administration.</FormDescription>
                        </FormItem>
                    )}
                    <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Full Name</FormLabel>
                            <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="pronouns"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Pronouns (Optional)</FormLabel>
                            <FormControl><Input placeholder="e.g., she/her, he/him" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </Card>

            {/* Email Change Section - For all users except default admin */}
            {!(userProfile.role === 'admin' && userProfile.email === ADMIN_EMAIL_CONST) && (
                <Card className="p-6 shadow-md rounded-lg">
                <CardHeader className="p-0 pb-4 mb-4 border-b">
                    <CardTitle className="text-lg font-semibold text-foreground">Change Email Address</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="currentEmail"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Current Email Address</FormLabel>
                            <FormControl><Input type="email" placeholder="your-current@example.com" {...field} disabled /></FormControl>
                             <FormDescription className="text-xs">This is your current registered email. To change, fill below.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="newEmail"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">New Email Address</FormLabel>
                            <FormControl><Input type="email" placeholder="your-new@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmNewEmail"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Confirm New Email Address</FormLabel>
                            <FormControl><Input type="email" placeholder="Confirm new email" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                </Card>
            )}

            {/* Password Change Section */}
            <Card className="p-6 shadow-md rounded-lg">
                <CardHeader className="p-0 pb-4 mb-4 border-b">
                    <CardTitle className="text-lg font-semibold text-foreground">Change Password</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Current Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">New Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Confirm New Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </Card>
            
            {/* Notification Preferences */}
            <Card className="p-6 shadow-md rounded-lg">
                 <CardHeader className="p-0 pb-4 mb-4 border-b">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                        <Bell className="mr-2 h-5 w-5 text-primary"/> Notification Preferences
                    </CardTitle>
                </CardHeader>
                 <div className="space-y-3">
                    {(Object.keys(defaultNotificationPreferences) as Array<keyof NotificationPreferences>).map((key) => (
                        <FormField
                            key={key}
                            control={form.control}
                            name={`notificationPreferences.${key}`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm">
                                            {key.charAt(0).toUpperCase() + key.slice(1)} Updates
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                            Receive notifications for new {key}.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
            </Card>


            <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

