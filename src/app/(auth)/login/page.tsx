
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react"; 

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, User } from "@/components/auth-provider"; 
import type { UserRole, UserProfile } from "@/types";


const usnRegex = /^1AP\d{2}[A-Z]{2}\d{3}$/i; 

const loginSchema = z.object({
  identifier: z.string().min(1, { message: "This field is required." }), 
  password: z.string().min(1, { message: "Password is required." }),
  mode: z.enum(["student", "admin", "faculty"], { required_error: "Please select a login mode." })
}).superRefine((data, ctx) => {
  if (data.mode === "student") {
    if (!usnRegex.test(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid USN format. Expected: 1APYYBBNNN (e.g., 1AP23CS001)",
        path: ["identifier"],
      });
    }
  } else if (data.mode === "admin" || data.mode === "faculty") {
    if (!z.string().email().safeParse(data.identifier).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid email address for ${data.mode}.`,
        path: ["identifier"],
      });
    }
  }
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_EMAIL = "admin@gmail.com"; 
const ADMIN_PASSWORD = "admin123"; // This becomes a fallback

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      mode: "student",
    },
  });

  const loginMode = form.watch("mode");

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const { identifier, password, mode } = data;
      let targetRoute = "/dashboard";
      let loggedInUser: User;

      if (mode === "admin") {
        const adminProfileKey = `campus_connect_user_${ADMIN_EMAIL.toLowerCase()}`;
        const adminProfileStr = typeof window !== 'undefined' ? localStorage.getItem(adminProfileKey) : null;
        let effectiveAdminPassword = ADMIN_PASSWORD;
        let adminDisplayName = "Admin User";

        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr) as UserProfile;
          if (adminProfile.password) {
            effectiveAdminPassword = adminProfile.password;
          }
          if (adminProfile.displayName) {
            adminDisplayName = adminProfile.displayName;
          }
        }
        
        if (identifier.toLowerCase() === ADMIN_EMAIL && password === effectiveAdminPassword) {
          loggedInUser = await signIn({ 
            email: identifier.toLowerCase(), 
            // Pass the entered password here, signIn for admin doesn't use it for auth, 
            // but it's good practice to pass what user entered.
            // The actual check `password === effectiveAdminPassword` is above.
            password: password, 
            role: "admin",
            displayName: adminDisplayName, 
          });
          targetRoute = "/admin";
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid admin credentials.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else if (mode === "faculty") {
        loggedInUser = await signIn({
          email: identifier.toLowerCase(),
          password,
          role: "faculty",
        });
        // displayName will be set by signIn from stored profile if available
        targetRoute = facultyUserHasPendingTasks(loggedInUser) ? "/faculty/user-management" : "/faculty";
      } else { // Student mode
        const usn = identifier.toUpperCase();
        loggedInUser = await signIn({ 
          usn: usn, 
          password, 
          role: "student", // This role might be updated to 'pending' by signIn based on UserProfile
        });
         // displayName will be set by signIn from stored profile if available
      }

      toast({
        title: "Login Successful",
        description: `Welcome back${loggedInUser.displayName ? `, ${loggedInUser.displayName}` : ''}!`,
      });
      router.push(targetRoute);

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or an unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to determine if faculty has pending student approvals
  // This is a mock; in a real app, this would involve a data fetch.
  const facultyUserHasPendingTasks = (facultyUser: User): boolean => {
    if (typeof window === 'undefined' || !facultyUser.assignedBranches || facultyUser.assignedBranches.length === 0) {
        return false;
    }
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('campus_connect_user_')) {
            try {
                const profile = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
                if (profile.role === 'pending' && 
                    !profile.isApproved && 
                    !profile.rejectionReason &&
                    profile.branch &&
                    facultyUser.assignedBranches.includes(profile.branch)) {
                    return true; // Found a pending student for this faculty's branch
                }
            } catch (e) { /* ignore parse errors */ }
        }
    }
    return false;
  };
  
  const getIdentifierLabel = () => {
    switch(loginMode) {
      case "student": return "USN";
      case "admin": return "Admin Email";
      case "faculty": return "Faculty Email";
      default: return "Identifier";
    }
  };

  const getIdentifierPlaceholder = () => {
    switch(loginMode) {
      case "student": return "e.g., 1AP23CS001";
      case "admin": return "admin@example.com";
      case "faculty": return "faculty@example.com";
      default: return "Enter your identifier";
    }
  };


  return (
    <div className="container flex min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] items-center justify-center py-8 sm:py-12 px-4">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Login to CampusConnect</CardTitle>
          <CardDescription className="text-sm sm:text-base">Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Login as</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("identifier", ""); 
                        form.clearErrors("identifier"); 
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Select login mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student" className="text-sm sm:text-base">Student (USN)</SelectItem>
                        <SelectItem value="faculty" className="text-sm sm:text-base">Faculty (Email)</SelectItem>
                        <SelectItem value="admin" className="text-sm sm:text-base">Admin (Email)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{getIdentifierLabel()}</FormLabel>
                    <FormControl>
                      <Input 
                        type={loginMode === "student" ? "text" : "email"} 
                        placeholder={getIdentifierPlaceholder()} 
                        {...field} 
                        className="text-sm sm:text-base"
                        onInput={loginMode === "student" ? (e) => e.currentTarget.value = e.currentTarget.value.toUpperCase() : undefined}
                        autoCapitalize={loginMode === "student" ? "characters" : "none"}
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base"/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Register here
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

