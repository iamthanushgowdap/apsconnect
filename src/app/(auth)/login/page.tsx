
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
import { useAuth } from "@/components/auth-provider"; 
import type { UserRole } from "@/types";

// USN format: 1APYYBBNNN (e.g., 1AP23CS001)
// YY = 2 digits, BB = 2 letters, NNN = 3 digits
const usnRegex = /^1AP\d{2}[A-Z]{2}\d{3}$/i; // i for case-insensitive input, will be uppercased

const loginSchema = z.object({
  identifier: z.string().min(1, { message: "This field is required." }), // Will hold USN or Email
  password: z.string().min(1, { message: "Password is required." }),
  mode: z.enum(["student", "admin"], { required_error: "Please select a login mode." })
}).superRefine((data, ctx) => {
  if (data.mode === "student") {
    if (!usnRegex.test(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid USN format. Expected: 1APYYBBNNN (e.g., 1AP23CS001)",
        path: ["identifier"],
      });
    }
  } else if (data.mode === "admin") {
    if (!z.string().email().safeParse(data.identifier).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid email address for admin.",
        path: ["identifier"],
      });
    }
  }
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_EMAIL = "admin@gmail.com"; // Case-insensitive comparison later
const ADMIN_PASSWORD = "admin123";

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
      let role: UserRole = mode;
      let displayName: string | undefined;
      let targetRoute = "/dashboard";

      if (mode === "admin") {
        if (identifier.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          role = "admin";
          displayName = "Admin User";
          targetRoute = "/admin"; 
          await signIn({ 
            email: identifier.toLowerCase(), 
            password, // Pass password for admin auth if signIn handles it
            role,
            displayName, 
          });
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid admin credentials.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else { // Student mode
        role = "student";
        const usn = identifier.toUpperCase(); // Ensure USN is uppercase for consistency
        // In a real app, you'd validate USN and password against a backend.
        // For mock, we assume the USN is valid if it passes schema validation.
        // The branch can be derived from USN if needed: usn.substring(3,5)
        await signIn({ 
          usn: usn, 
          password, // Pass password for student auth if signIn handles it
          role,
          // displayName and branch could be fetched/derived by signIn if needed
        });
      }

      toast({
        title: "Login Successful",
        description: `Welcome back${displayName ? `, ${displayName}` : ''}!`,
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
                        form.setValue("identifier", ""); // Clear identifier on mode change
                        form.clearErrors("identifier"); // Clear validation errors
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Select login mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student" className="text-sm sm:text-base">User (USN)</SelectItem>
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
                    <FormLabel className="text-sm">{loginMode === "student" ? "USN" : "Email"}</FormLabel>
                    <FormControl>
                      <Input 
                        type={loginMode === "student" ? "text" : "email"} 
                        placeholder={loginMode === "student" ? "e.g., 1AP23CS001" : "you@example.com"} 
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
