"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  UserCircle,
  Bell,
  AlertTriangle,
  Newspaper,
  BookOpen,
  CalendarDays,
  FileText,
  ArrowRight,
  Paperclip
} from "lucide-react";
import type { Post } from "@/types";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { DownloadAppSection } from "@/components/layout/download-app-section";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners';

interface RecentPostItemProps {
  post: Post;
}

function RecentPostItem({ post }: RecentPostItemProps) {
  const categoryIcons: Partial = {
    event: CalendarDays,
    news: Newspaper,
    link: Paperclip,
    note: BookOpen,
    schedule: CalendarDays,
  };

  const IconComponent = post?.category && categoryIcons[post.category] ? categoryIcons[post.category] : FileText;

  return (
    
      
        
          
            
              
                
                  
                  {post.title}
                
              
              
                 {post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : "Other"}
              
            
            
              By {post.authorName || "Unknown"} — {post.createdAt ? formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true }) : "some time ago"}
            
          
        
        
          {post.content || "No content available."}
        
        
           Read More on Feed  
        
      
    
  );
}

// StudentDashboardPage Component
const StudentDashboardPage = () => {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [studentUser, setStudentUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      if (authUser && (authUser.role === 'student' || authUser.role === 'pending')) {
        setStudentUser(authUser);
        
        if (typeof window !== 'undefined') {
          const postsStr = localStorage.getItem('apsconnect_posts'); 
          const allPosts = postsStr ? JSON.parse(postsStr) : [];
          
          let relevantPosts = allPosts;
          if (authUser.role === 'student' && authUser.branch) {
            const studentBranch = authUser.branch;
            relevantPosts = allPosts.filter(post => 
              !post.targetBranches || post.targetBranches.length === 0 || 
              post.targetBranches.includes(studentBranch)
            );
          } else { 
            relevantPosts = allPosts.filter(post => !post.targetBranches || post.targetBranches.length === 0);
          }

          relevantPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
          setRecentPosts(relevantPosts.slice(0, 3));
        }

      } else if (authUser) { 
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

  if (!studentUser) {
    return (
       
        
          
            Access Denied
          
          
            
              
            
            You do not have permission to view this page.
            
              Go to Dashboard
            
          
        
      
    );
  }

  const isPendingApproval = studentUser.role === 'pending' && !studentUser.rejectionReason;
  const isRejected = studentUser.role === 'pending' && studentUser.rejectionReason;
  const isApprovedStudent = studentUser.role === 'student';

  return (
    
      
        
          
            Hello, {studentUser.displayName || studentUser.usn}!
          
          
            Welcome to your Student Dashboard. Access resources and stay updated.
          
           
              Branch: 
            
          
        
        {isPendingApproval && (
          
            
              
                
                  Account Pending Approval
                
                
                  Your registration is under review. Full access will be granted upon approval.
                
              
            
          
        )}

        {isRejected && (
          
            
              
                 
                  Account Registration Rejected
                  
                    Reason: {studentUser.rejectionReason}
                  
                
              
            
            
              If you believe this is an error, please contact the college administration for assistance.
            
          
        )}

        
          
            Quick Links
            
              
                
                  My Profile
                  View and update your personal information and password.
                   Manage Profile
                  
                
                {/* Campus Feed card removed as requested */}
              
            
          
        
      
      
        
          
            Recent Updates
             
              View All 
            
          
          {recentPosts.length > 0 ? (
            
              {recentPosts.map(post => (
                
              ))}
            
          ) : (
            
              
                
                   No recent posts relevant to you.
                  
                    The campus feed might have more updates.
                  
                
              
            
          )}
        
      
      
    
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  actionText: string;
  disabled?: boolean;
}

function ActionCard({ title, description, icon, link, actionText, disabled = false }: ActionCardProps) {
  return (
    
      
        
          
            
              
                 
                  {React.cloneElement(icon as React.ReactElement, { className: `h-10 w-10 ${disabled ? 'text-muted-foreground' : 'text-accent'}`})}
                
                
                  {title}
                  {description}
                
              
            
          
        
        
          
            {actionText} 
          
        
      
    
  );
}

export default StudentDashboardPage;
