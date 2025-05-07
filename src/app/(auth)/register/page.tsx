
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription as ShadCnCardDescription, CardHeader, CardTitle } from "@/components/ui/card"; 
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Branch } from "@/types";
import { defaultBranches } from "@/types"; 


const usnSuffixRegex = /^[0-9]{2}[A-Za-z]{2}[0-9]{3}$/;
const BRANCH_STORAGE_KEY = 'campus_connect_managed_branches';

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  usnSuffix: z.string()
    .length(7, { message: "USN Suffix must be 7 characters (e.g., 23CS001)." })
    .regex(usnSuffixRegex, { message: "Format: YYBBBNNN (e.g., 23CS001 where YY is year, BB branch, NNN roll no)." })
    .transform(val => {
      return val.substring(0, 2) + val.substring(2, 4).toUpperCase() + val.substring(4, 7);
    }),
  branch: z.string({ required_error: "Please select your branch." }), 
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(defaultBranches);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranches = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (storedBranches) {
        try {
          const parsedBranches = JSON.parse(storedBranches);
          if (Array.isArray(parsedBranches) && parsedBranches.length > 0) {
            setAvailableBranches(parsedBranches);
          } else {
            setAvailableBranches(defaultBranches); // Fallback if stored is empty or invalid
          }
        } catch (e) {
          console.error("Failed to parse branches from localStorage, using default:", e);
          setAvailableBranches(defaultBranches); // Fallback on error
        }
      } else {
        setAvailableBranches(defaultBranches); // Fallback if not in localStorage
      }
    }
  }, []);


  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      usnSuffix: "",
      branch: undefined, 
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    const fullUsn = `1AP${data.usnSuffix}`; 
    
    try {
      console.log("Simulating registration with:", { ...data, usn: fullUsn });
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      if (typeof window !== 'undefined') {
        const userProfileData: UserProfile = { 
            uid: fullUsn,
            displayName: data.displayName, 
            email: data.email, 
            role: 'pending', 
            usn: fullUsn,
            branch: data.branch, 
            registrationDate: new Date().toISOString(),
            isApproved: false,
        };
        localStorage.setItem(`campus_connect_user_${fullUsn}`, JSON.stringify(userProfileData));
        
        localStorage.setItem('mockUser', JSON.stringify({
            uid: fullUsn,
            displayName: data.displayName,
            email: data.email,
            role: 'pending',
            usn: fullUsn,
            branch: data.branch,
        }));
      }

      toast({
        title: "Registration Submitted",
        description: "Your registration is pending admin approval. You will be notified once approved.",
      });
      router.push("/dashboard"); 
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] items-center justify-center py-8 sm:py-12 px-4">
      <Card className="w-full max-w-sm sm:max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Create an Account</CardTitle>
          <ShadCnCardDescription className="text-sm sm:text-base">Join CampusConnect to stay updated with college activities.</ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Thanush Gowda P" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="usnSuffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">University Seat Number (USN)</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-medium p-2.5 border border-input rounded-md bg-muted">1AP</span>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 23CS001" 
                          {...field} 
                          className="text-sm sm:text-base"
                          maxLength={7}
                          onInput={(e) => { 
                            const inputVal = e.currentTarget.value;
                            if (inputVal.length >= 2 && inputVal.length <=4) {
                                const yearPart = inputVal.substring(0,2);
                                const branchPart = inputVal.substring(2,4);
                                const rollPart = inputVal.substring(4);
                                e.currentTarget.value = yearPart + branchPart.toUpperCase() + rollPart;
                            } else if (inputVal.length > 4) {
                                const yearPart = inputVal.substring(0,2);
                                const branchPart = inputVal.substring(2,4).toUpperCase();
                                const rollPart = inputVal.substring(4);
                                e.currentTarget.value = yearPart + branchPart + rollPart;
                            }
                            field.onChange(e); 
                          }}
                          suppressHydrationWarning
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-xs sm:text-sm">
                      e.g., 23CS001
                    </FormDescription>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Branch</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} >
                      <FormControl>
                        <SelectTrigger className="text-sm sm:text-base" suppressHydrationWarning>
                          <SelectValue placeholder="Select your branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBranches.length > 0 ? (
                          availableBranches.map((branchName) => (
                            <SelectItem key={branchName} value={branchName} className="text-sm sm:text-base">
                              {branchName}
                            </SelectItem>
                          ))
                        ) : (
                           <SelectItem value="disabled" disabled className="text-sm sm:text-base">
                            No branches configured by admin.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base" disabled={isLoading} suppressHydrationWarning>
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

