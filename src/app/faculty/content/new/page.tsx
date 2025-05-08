"use client";

import React, { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/content/create-post-form';
import type { Post } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { NewPostToast } from '@/components/notifications/new-post-toast';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length > 1) {
     return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function FacultyCreatePostPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'faculty') {
        router.push(user ? '/dashboard' : '/login');
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  const handleFormSubmit = async (postData: Post, attachmentsToUpload: File[]) => {
    setFormSubmitting(true);
    try {
      console.log("Post data to save (Faculty):", {...postData, likes: postData.likes || []});
      console.log("Files to 'upload' (Faculty):", attachmentsToUpload.map(f => ({ name: f.name, type: f.type, size: f.size })));

      if (typeof window !== 'undefined') {
        const existingPostsStr = localStorage.getItem('apsconnect_posts'); 
        const existingPosts: Post[] = existingPostsStr ? JSON.parse(existingPostsStr) : [];
        
        const finalPostData = {...postData, likes: postData.likes || []};

        const postIndex = existingPosts.findIndex(p => p.id === finalPostData.id);
        if (postIndex > -1) {
            existingPosts[postIndex] = finalPostData;
        } else {
            existingPosts.push(finalPostData);
        }
        localStorage.setItem('apsconnect_posts', JSON.stringify(existingPosts)); 
      }

      toast({
        variant: "raw",
        description: (
          <NewPostToast
            authorName={postData.authorName}
            authorInitials={getInitials(postData.authorName)}
            postCategory={postData.category}
            postTitle={postData.title}
            timestamp={postData.createdAt}
          />
        ),
        duration: 3000, 
      });
      router.push('/faculty/content'); 
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error Creating Post",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setFormSubmitting(false);
    }
  };

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
    
      
        
          onFormSubmit={handleFormSubmit} 
          isLoading={formSubmitting}
          formTitle="Faculty: Create New Post"
          formDescription="Share updates, notes, or event information relevant to your students and branches."
        
      
    
  );
}
