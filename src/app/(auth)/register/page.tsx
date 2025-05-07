
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription as ShadCnCardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Renamed CardDescription to avoid conflict
import { useToast } from "@/hooks/use-toast";
// import { branches, Branch } from "@/types"; // Branch is now part of USN

// Regex for YYBBBNNN: 2 digits, 2 letters, 3 digits
const usnSuffixRegex = /^[0-9]{2}[A-Za-z]{2}[0-9]{3}$/;

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }), // Retain email for communication/recovery
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  usnSuffix: z.string()
    .length(7, { message: "USN Suffix must be 7 characters (e.g., 23CS001)." })
    .regex(usnSuffixRegex, { message: "Format: YYBBBNNN (e.g., 23CS001 where YY is year, BB branch, NNN roll no)." })
    .transform(val => {
      // Ensure branch code is uppercase
      return val.substring(0, 2) + val.substring(2, 4).toUpperCase() + val.substring(4, 7);
    }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      usnSuffix: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    const fullUsn = `1AP${data.usnSuffix}`; // data.usnSuffix already has branch code in uppercase due to Zod transform
    
    try {
      console.log("Simulating registration with:", { ...data, usn: fullUsn });
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // Store a more complete "profile" for mock purposes, which login could potentially use
      if (typeof window !== 'undefined') {
        const userProfileData = { 
            displayName: data.displayName, 
            email: data.email, 
            role: 'pending', // Initial role
            usn: fullUsn,
            // branch: fullUsn.substring(3,5) // Example: "CS"
        };
        localStorage.setItem(`campus_connect_user_${fullUsn}`, JSON.stringify(userProfileData));
        
        // Set current session to pending user
        localStorage.setItem('mockUser', JSON.stringify(userProfileData));
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
                      <Input placeholder="Thanush Gowda P" {...field} className="text-sm sm:text-base"/>
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
                      <Input type="email" placeholder="you@example.com" {...field} className="text-sm sm:text-base"/>
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
                          onInput={(e) => { // Auto-uppercase for branch code part as user types
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
                            field.onChange(e); // Ensure react-hook-form is updated
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-xs sm:text-sm">
                      YY: Year (e.g., 23), BB: Branch Code (e.g., CS), NNN: Roll No (e.g., 001)
                    </FormDescription>
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base"/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base" disabled={isLoading}>
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

