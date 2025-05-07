
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect logic based on user role
        if (user.role === 'admin') {
          router.replace('/admin');
        } else if (user.role === 'faculty') {
          router.replace('/faculty');
        } else if (user.role === 'student' || user.role === 'pending') {
          // Students and pending users might see something else or be redirected to feed.
          // For now, let's redirect to feed.
          router.replace('/feed');
        } else {
          // Fallback for unknown roles or if no specific dashboard exists
          router.replace('/'); 
        }
      } else {
        // No user, redirect to login
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show a loading indicator while redirecting
  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // This content will likely not be shown due to redirects
  // but serves as a placeholder if redirect logic changes.
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Redirecting...</h1>
      <p>Please wait while we redirect you to your dashboard.</p>
    </div>
  );
}

