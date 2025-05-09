
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import type { Post, PostCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, AlertTriangle } from 'lucide-react';
import { parseISO } from 'date-fns';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { PostItem } from '@/components/content/post-item';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ArchivePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetPostId, setDeleteTargetPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPosts = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const storedPostsStr = localStorage.getItem('apsconnect_posts');
      let fetchedPosts: Post[] = storedPostsStr ? JSON.parse(storedPostsStr) : [];
      
      // For archive, all users should see all posts regardless of their role or branch
      // Sort by newest first
      fetchedPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
      setAllPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts); // Initially show all posts
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!lowerSearchTerm) {
      setFilteredPosts(allPosts);
      return;
    }
    const newFilteredPosts = allPosts.filter(post =>
      post.title.toLowerCase().includes(lowerSearchTerm) ||
      post.content.toLowerCase().includes(lowerSearchTerm) ||
      post.authorName.toLowerCase().includes(lowerSearchTerm) ||
      post.category.toLowerCase().includes(lowerSearchTerm) ||
      (post.targetBranches && post.targetBranches.join(', ').toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredPosts(newFilteredPosts);
  }, [searchTerm, allPosts]);

  const handleLikePost = (postId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like posts.", variant: "destructive", duration: 3000 });
      return;
    }
    const updatedPosts = (list: Post[]) => list.map(p => {
      if (p.id === postId) {
        const currentLikes = p.likes || [];
        const userLiked = currentLikes.includes(user.uid);
        const newLikes = userLiked
          ? currentLikes.filter(uid => uid !== user.uid)
          : [...currentLikes, user.uid];
        return { ...p, likes: newLikes };
      }
      return p;
    });

    setAllPosts(prev => updatedPosts(prev));
    setFilteredPosts(prev => updatedPosts(prev));
    
    if (typeof window !== 'undefined') {
        const allPostsStr = localStorage.getItem('apsconnect_posts'); 
        let allPostsStored: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
        const postIndex = allPostsStored.findIndex(storedPost => storedPost.id === postId);
        if (postIndex > -1) {
            const currentLikes = allPostsStored[postIndex].likes || [];
            const userLiked = currentLikes.includes(user.uid);
            allPostsStored[postIndex].likes = userLiked 
                ? currentLikes.filter(uid => uid !== user.uid)
                : [...currentLikes, user.uid];
            localStorage.setItem('apsconnect_posts', JSON.stringify(allPostsStored)); 
        }
    }
  };

  const confirmDeletePost = (postId: string) => {
    setDeleteTargetPostId(postId);
  };

  const handleDeletePost = () => {
    if (!deleteTargetPostId || !user) return;

    const postToDelete = allPosts.find(p => p.id === deleteTargetPostId);
    if (!postToDelete) return;

    // Admin can delete any post, faculty can only delete their own.
    if (!(user.role === 'admin' || (user.role === 'faculty' && postToDelete.authorId === user.uid))) {
        toast({title: "Unauthorized", description: "You cannot delete this post.", variant: "destructive", duration: 3000});
        setDeleteTargetPostId(null);
        return;
    }

    if (typeof window !== 'undefined') {
        let storedPostsStr = localStorage.getItem('apsconnect_posts'); 
        let storedPosts: Post[] = storedPostsStr ? JSON.parse(storedPostsStr) : [];
        const updatedStoredPosts = storedPosts.filter(p => p.id !== deleteTargetPostId);
        localStorage.setItem('apsconnect_posts', JSON.stringify(updatedStoredPosts)); 
        
        setAllPosts(prevPosts => prevPosts.filter(p => p.id !== deleteTargetPostId));
        setFilteredPosts(prevPosts => prevPosts.filter(p => p.id !== deleteTargetPostId));
        toast({title: "Post Deleted", description: `"${postToDelete.title}" has been deleted from archive.`, duration: 3000});
    }
    setDeleteTargetPostId(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Posts Archive
          </CardTitle>
          <CardDescription>
            Browse and search through all past announcements and events.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search archive (title, content, author, category, branch...)"
              className="pl-10 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-10">
              {searchTerm ? (
                 <>
                  <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No posts match your search criteria.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try different keywords or broaden your search.</p>
                 </>
              ) : (
                <>
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">The archive is currently empty.</p>
                  <p className="text-sm text-muted-foreground mt-1">Posts will appear here once they are created.</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPosts.map(post => (
                <PostItem
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLikePost={handleLikePost}
                  onDeletePost={confirmDeletePost}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTargetPostId} onOpenChange={() => setDeleteTargetPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post from the archive? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetPostId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">
                Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
