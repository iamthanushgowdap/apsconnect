"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import ManageStudentsTab from "@/app/admin/users/manage-students-tab"; // Reusing the component
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners';

export default function FacultyUserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actor, setActor] = useState<User | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user && user.role === 'faculty') {
        setIsAuthorized(true);
        setActor(user);
      } else if (user) {
        router.push('/dashboard'); 
      } else {
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      
        
          
        
      
    );
  }

  if (!isAuthorized || !actor) {
    return (
      
        
          
            Access Denied
          
          
            
              
            
            You do not have permission to view this page.
            
              Go to Dashboard
            
          
        
      
    );
  }
  
  const assignedBranchesText = actor.assignedBranches && actor.assignedBranches.length > 0 
    ? actor.assignedBranches.join(', ') 
    : 'N/A';

  return (
    
      
        
          Manage Students
          View, approve, and manage student accounts for your assigned branches: {assignedBranchesText}.
        
       
    
  );
}
