
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
import type { UserProfile, Semester } from '@/types'; // Added Semester
import { semesters as allSemesters } from '@/types'; // Added allSemesters
import { Loader2, ShieldCheck, Camera, Trash2 } from 'lucide-react';
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
  currentEmail: z.string().email({ message: "Invalid current email address." }).optional().or(z.literal('')),
  newEmail: z.string().email({ message: "Invalid new email address." }).optional().or(z.literal('')),
  confirmNewEmail: z.string().optional().or(z.literal('')),
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
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
            currentEmail: "", // Keep currentEmail fields blank initially for security
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
            password: ADMIN_PASSWORD_CONST, // This is a mock password
          };
          setUserProfileState(defaultAdminProfile);
          setAvatarPreview(null); // No default avatar for hardcoded admin unless explicitly set
          form.reset({
            displayName: defaultAdminProfile.displayName || "",
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
            currentEmail: "",
            newEmail: "",
            confirmNewEmail: ""
          });
        } else {
          toast({ title: "Profile Error", description: "User profile not found. Please log in again.", variant: "destructive", duration: 3000 });
          router.push('/login');
        }
      } else if (!authUser) {
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router, form, toast]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
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
    setAvatarPreview(null); // This will trigger fallback
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
    }
  };


  async function onSubmit(data: ProfileFormValues) {
    if (!authUser || !userProfile) {
        toast({ title: "Error", description: "User session or profile not found.", variant: "destructive", duration: 3000 });
        return;
    }

    let changesMade = false;
    const updatedProfileData = { ...userProfile };

    const isDisplayNameChanged = data.displayName !== undefined && data.displayName !== userProfile.displayName;
    const isPasswordChanged = !!data.newPassword;
    const isEmailChanged = !!data.newEmail;
    // Check if avatar was explicitly removed OR a new file was selected
    const isAvatarChanged = (avatarPreview === null && userProfile.avatarDataUrl) || selectedFile;


    if (!isDisplayNameChanged && !isPasswordChanged && !isEmailChanged && !isAvatarChanged) {
        toast({ title: "No Changes", description: "Please provide new information to update.", variant: "default", duration: 3000});
        return;
    }

    setFormSubmitting(true);

    try {
      if (selectedFile) {
        updatedProfileData.avatarDataUrl = await readFileAsDataURL(selectedFile);
        changesMade = true;
      } else if (avatarPreview === null && userProfile.avatarDataUrl) { // If avatarPreview is null and there was an old avatar
        updatedProfileData.avatarDataUrl = undefined; // Remove avatar
        changesMade = true;
      }


      if (data.displayName !== undefined && data.displayName !== userProfile.displayName) {
        updatedProfileData.displayName = data.displayName;
        changesMade = true;
      }

      if (data.newPassword) {
        if (!data.currentPassword) {
             form.setError("currentPassword", { message: "Current password is required."});
             setFormSubmitting(false); return;
        }
        // For mock purposes, password comparison is simple. In a real app, this would involve hashing.
        const actualCurrentPassword = userProfile.password || (userProfile.uid === ADMIN_EMAIL_CONST ? ADMIN_PASSWORD_CONST : "");
        if (data.currentPassword !== actualCurrentPassword) {
          toast({ title: "Incorrect Password", description: "The current password you entered is incorrect.", variant: "destructive", duration: 3000 });
          form.setError("currentPassword", { message: "Incorrect current password." });
          setFormSubmitting(false);
          return;
        }
        updatedProfileData.password = data.newPassword; // Store new password (mock only)
        changesMade = true;
      }

      let oldEmailKey: string | null = null;
      let newEmailKey: string | null = null;

      if (data.newEmail) {
        if (!data.currentEmail) {
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

        // Check if the new email already exists for another user
        if (data.newEmail.toLowerCase() !== userProfile.email.toLowerCase()) {
            let emailExistsForOtherUser = false;
            if (typeof window !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('apsconnect_user_')) {
                        const profileStr = localStorage.getItem(key);
                        if (profileStr) {
                            try {
                                const existingUserProfile = JSON.parse(profileStr) as UserProfile;
                                if (existingUserProfile.email && existingUserProfile.email.toLowerCase() === data.newEmail.toLowerCase() && existingUserProfile.uid !== userProfile.uid) {
                                    emailExistsForOtherUser = true;
                                    break;
                                }
                            } catch (e) {  
                              // Ignore parse errors  
                            }
                        }
                    }
                }
            }
            if (emailExistsForOtherUser) {
                toast({ title: "Update Failed", description: "This email address is already in use by another account.", variant: "destructive", duration: 3000 });
                form.setError("newEmail", { message: "Email already in use." });
                setFormSubmitting(false);
                return;
            }
        }


        if (userProfile.role === 'admin' || userProfile.role === 'faculty') {
            // For admin/faculty, UID is their email. So, changing email means changing UID.
            oldEmailKey = `apsconnect_user_${userProfile.uid}`; // Old key based on old UID (email)
            updatedProfileData.uid = data.newEmail.toLowerCase(); // New UID is the new email
            newEmailKey = `apsconnect_user_${updatedProfileData.uid}`; // New key based on new UID (email)
        }
        updatedProfileData.email = data.newEmail.toLowerCase();
        changesMade = true;
      }

      if (!changesMade) {
        toast({ title: "No Effective Changes", description: "Profile information is already up to date.", duration: 3000 });
        setFormSubmitting(false);
        return;
      }

      // Save updated profile to localStorage
      if (typeof window !== 'undefined') {
        if (newEmailKey && oldEmailKey && oldEmailKey !== newEmailKey && (userProfile.role === 'admin' || userProfile.role === 'faculty')) {
          localStorage.removeItem(oldEmailKey); // Remove old profile if UID changed
          localStorage.setItem(newEmailKey, JSON.stringify(updatedProfileData));
        } else {
          // For students, UID (USN) doesn't change, or if email didn't change for admin/faculty
          localStorage.setItem(`apsconnect_user_${updatedProfileData.uid}`, JSON.stringify(updatedProfileData));
        }

        // Update auth context and mockUser if it exists
        const updatedAuthUser: User = {
          ...authUser,
          uid: updatedProfileData.uid, // This will be new email for admin/faculty if changed
          email: updatedProfileData.email,
          displayName: updatedProfileData.displayName || authUser.displayName,
          // other fields like role, branch, usn, assignedBranches should remain from authUser
        };
        localStorage.setItem('mockUser', JSON.stringify(updatedAuthUser));
        updateUserContext(updatedAuthUser); // Update context so Navbar reflects changes
        setUserProfileState(updatedProfileData); // Update local component state
      }

      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully updated.",
        duration: 3000,
      });
      // Reset form fields for passwords and emails to blank for security
      form.reset({
        displayName: updatedProfileData.displayName || "",
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

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!authUser || !userProfile) { // Check both authUser and userProfile
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
              <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                 {getProfileInitials(userProfile)}
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
                id="avatar-upload-input" // Ensure id is unique if multiple instances
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
            <CardDescription className="text-base sm:text-lg text-center text-muted-foreground">
              Email: {userProfile.email}
            </CardDescription>
            {userProfile.role === 'student' && userProfile.usn && (
                 <CardDescription className="text-base sm:text-lg text-center mt-1 text-muted-foreground">
                    USN: {userProfile.usn}
                </CardDescription>
            )}
             {userProfile.role === 'student' && userProfile.semester && (
                 <CardDescription className="text-base sm:text-lg text-center mt-1 text-muted-foreground">
                    Semester: {userProfile.semester}
                </CardDescription>
            )}
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
                      <Input placeholder="Your Name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Change Section */}
              <div className="space-y-1 pt-4 border-t">
                <h3 className="text-md font-medium text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">Leave blank if you do not wish to change password.</p>
              </div>
              <FormField control={form.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} value={field.value || ""} autoComplete="current-password" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} value={field.value || ""} autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} value={field.value || ""} autoComplete="new-password" /></FormControl><FormMessage /></FormItem>)} />

             {/* Email Change Section - Only for Admin/Faculty */}
             {(userProfile.role === 'admin' || userProfile.role === 'faculty') && (
                <>
                    <div className="space-y-1 pt-4 border-t">
                        <h3 className="text-md font-medium text-foreground">Change Email Address</h3>
                        <p className="text-xs text-muted-foreground">Leave blank if you do not wish to change your email.</p>
                    </div>
                    <FormField control={form.control} name="currentEmail" render={({ field }) => (<FormItem><FormLabel>Current Email ({userProfile.email})</FormLabel><FormControl><Input type="email" placeholder="Enter your current email" {...field} value={field.value || ""} autoComplete="email"/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="newEmail" render={({ field }) => (<FormItem><FormLabel>New Email</FormLabel><FormControl><Input type="email" placeholder="Enter new email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="confirmNewEmail" render={({ field }) => (<FormItem><FormLabel>Confirm New Email</FormLabel><FormControl><Input type="email" placeholder="Confirm new email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </>
             )}

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {formSubmitting ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
