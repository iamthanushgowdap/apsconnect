"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";

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
          // Students and pending users are redirected to the student dashboard
          router.replace('/student');
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
  if (isLoading || !user && typeof window !== 'undefined' && window.location.pathname === '/dashboard') { // Added a check to prevent flash if user is null but redirecting
    return (
      
        
          
        
      
    );
  }

  // This content will likely not be shown due to redirects
  // but serves as a placeholder if redirect logic changes or for very brief flashes.
  return (
    
      
        Redirecting...
        Please wait while we redirect you to your dashboard.
      
    
  );
}
