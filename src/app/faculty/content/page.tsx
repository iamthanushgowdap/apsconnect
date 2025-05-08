"use client";

import React, { useEffect, useState } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';


export default function FacultyViewContentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user && user.role === 'faculty') {
        setPageLoading(false); 
      } else {
        router.push(user ? '/dashboard' : '/login');
      }
    }
  }, [user, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      
        
          
        
      
    );
  }
  
  if (!user || user.role !== 'faculty') {
     return (
      
        
          
            Access Denied
          
          
            
              
            
            You do not have permission to view this page.
            
              Go to Dashboard
            
          
        
      
    );
  }

  return (
    
      
        
          Faculty: Content Feed
        
        
          
            Relevant posts for your assigned branches are displayed on the main .
          
          
            You can also  for your students.
          
           
                View Activity Feed
            
        
      
    
  );
}
