
"use client";

import React, { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/content/create-post-form';
import type { Post, PostAttachment } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminCreatePostPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push(user ? '/dashboard' : '/login');
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  const handleFormSubmit = async (postData: Post, attachmentsToUpload: File[]) => {
    setFormSubmitting(true);
    try {
      // In a real app, attachmentsToUpload would be uploaded to a storage service here.
      // For this mock, we'll just store their metadata.
      console.log("Post data to save:", postData);
      console.log("Files to 'upload':", attachmentsToUpload.map(f => ({ name: f.name, type: f.type, size: f.size })));

      if (typeof window !== 'undefined') {
        const existingPostsStr = localStorage.getItem('campus_connect_posts');
        const existingPosts: Post[] = existingPostsStr ? JSON.parse(existingPostsStr) : [];
        
        const postIndex = existingPosts.findIndex(p => p.id === postData.id);
        if (postIndex > -1) {
            existingPosts[postIndex] = postData; // Update existing post
        } else {
            existingPosts.push(postData); // Add new post
        }
        localStorage.setItem('campus_connect_posts', JSON.stringify(existingPosts));
      }

      toast({
        title: "Post Created Successfully",
        description: `"${postData.title}" has been published.`,
      });
      router.push('/admin/posts'); // Redirect to a posts management page (to be created) or admin dashboard
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error Creating Post",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CreatePostForm 
        onFormSubmit={handleFormSubmit} 
        isLoading={formSubmitting}
        formTitle="Admin: Create New Post"
        formDescription="Craft announcements, news, events, or share resources for the campus community."
      />
    </div>
  );
}
