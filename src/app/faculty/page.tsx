"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, ShieldCheck, FileText, FilePlus2, ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth, User } from "@/components/auth-provider";
import { DownloadAppSection } from "@/components/layout/download-app-section";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser && authUser.role === 'faculty') {
        setFacultyUser(authUser);
      } else if (authUser && authUser.role !== 'faculty') {
        router.push('/dashboard'); 
      } else {
        router.push('/login'); 
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      
        
          
        
      
    );
  }

  if (!facultyUser) {
    return (
       
        
          
            Access Denied
          
          
            
              
            
            You do not have permission to view this page.
            
              Go to Dashboard
            
          
        
      
    );
  }
  
  const assignedBranchesText = facultyUser.assignedBranches && facultyUser.assignedBranches.length > 0 
    ? facultyUser.assignedBranches.join(', ') 
    : 'Not Assigned';

  return (
    
      
        
          
            Faculty Dashboard
          
          
            Welcome, {facultyUser.displayName || facultyUser.email}! Manage your students and resources.
          
          
            Assigned Branches: 
          
        
      

      
        
            
          
          
            
              
                
                  Manage Students
                  View, approve, and manage student accounts within your assigned branches.
                   Manage Students
                
              
              
                
                  Create Content
                  Post news, events, or notes for your assigned branches.
                   Create New Post
                
              
              
                
                  My Profile
                  View and edit your faculty profile details.
                   View Profile
                
              
               
                
                  View Activity Feed
                  Browse content relevant to your branches.
                   View Feed
                
              
            
          
        
      
      
    
  );
}

interface StyledActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode; 
  link: string;
  actionText: string;
  disabled?: boolean;
}

function StyledActionCard({ title, description, icon, link, actionText, disabled = false }: StyledActionCardProps) {
  return (
    
      
        
          
            
              
                 
                  {React.cloneElement(icon as React.ReactElement, { className: `h-10 w-10 ${disabled ? 'text-muted-foreground' : 'text-accent'}`})}
                
                
                  {title}
                  {description}
                
              
            
          
        
        
          
            {actionText} 
          
        
      
    
  );
}
