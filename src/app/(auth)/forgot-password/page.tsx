"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/components/auth-provider"; 

// For now, password reset will be based on email.
// Resetting via USN would require fetching associated email from backend.
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  // const { sendPasswordResetEmail } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    try {
      console.log("Simulating password reset request for email:", data.email);
      // In a real app, this would interact with your auth service.
      // If resetting via USN was supported, you'd need to find the user's email via their USN.
      // For this mock, we assume only email-based reset.
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, you will receive instructions to reset your password.",
      });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Error Sending Reset Email",
        description: error.message || "An unexpected error occurred. Please try again.",
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
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Forgot Password</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isSubmitted 
              ? "Check your email for reset instructions." 
              : "Enter your account's email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
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
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base" disabled={isLoading} suppressHydrationWarning>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground text-sm sm:text-base">Didn't receive an email? Check your spam folder or try again later.</p>
            </div>
          )}
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

