
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import type { Post, PostCategory } from '@/types'; 
import { postCategories } from '@/types'; 
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Filter, ArrowRight } from 'lucide-react';
import { parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
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
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { PostItem } from '@/components/content/post-item'; // Import reusable PostItem

export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [allStoredPosts, setAllStoredPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [deleteTargetPostId, setDeleteTargetPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeFilters, setActiveFilters] = useState<PostCategory[]>(postCategories); 

  const markPostsAsSeen = useCallback(() => {
    if (!user || posts.length === 0) return;

    const viewablePostIds = posts.map(p => p.id);
    const seenPostIdsKey = `apsconnect_seen_post_ids_${user.uid}`; 
    let seenPostIds: string[] = [];
    
    if (typeof window !== 'undefined') {
        const storedSeenIds = localStorage.getItem(seenPostIdsKey);
        if (storedSeenIds) {
            seenPostIds = JSON.parse(storedSeenIds);
        }
        const newSeenIds = Array.from(new Set([...seenPostIds, ...viewablePostIds]));
        localStorage.setItem(seenPostIdsKey, JSON.stringify(newSeenIds));
        
        window.dispatchEvent(new CustomEvent('postsSeen'));
    }
  }, [user, posts]);


  const fetchAndFilterPosts = useCallback(() => {
    setIsLoadingPosts(true);
    if (typeof window !== 'undefined') {
      const storedPostsStr = localStorage.getItem('apsconnect_posts'); 
      let fetchedAllPosts: Post[] = storedPostsStr ? JSON.parse(storedPostsStr) : [];
      setAllStoredPosts(fetchedAllPosts); 

      let userFilteredPosts = [...fetchedAllPosts];
      if (user) {
        if (user.role === 'student' && user.branch) {
          const studentBranch = user.branch;
          userFilteredPosts = fetchedAllPosts.filter(post => 
            !post.targetBranches || post.targetBranches.length === 0 || 
            post.targetBranches.includes(studentBranch) 
          );
        } else if (user.role === 'faculty' && user.assignedBranches) {
          const facultyBranches = user.assignedBranches;
          userFilteredPosts = fetchedAllPosts.filter(post => 
            !post.targetBranches || post.targetBranches.length === 0 || 
            (facultyBranches && facultyBranches.some(branch => post.targetBranches && post.targetBranches.includes(branch)))
          );
        } 
      } else {
        // For non-logged-in users, show only posts with no target branches (general posts)
        userFilteredPosts = fetchedAllPosts.filter(post => !post.targetBranches || post.targetBranches.length === 0);
      }

      const categoryFilteredPosts = activeFilters.length === 0 || activeFilters.length === postCategories.length
        ? userFilteredPosts 
        : userFilteredPosts.filter(post => activeFilters.includes(post.category));
      
      setPosts(categoryFilteredPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
    }
    setIsLoadingPosts(false);
  }, [user, activeFilters]);


  useEffect(() => {
    fetchAndFilterPosts();
  }, [fetchAndFilterPosts]); 

  useEffect(() => {
    if (posts.length > 0 && user) {
      markPostsAsSeen();
    }
  }, [posts, user, markPostsAsSeen]);


  const handleLikePost = (postId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like posts.", variant: "destructive", duration: 3000 });
      return;
    }
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          const currentLikes = p.likes || [];
          const userLiked = currentLikes.includes(user.uid);
          const newLikes = userLiked
            ? currentLikes.filter(uid => uid !== user.uid)
            : [...currentLikes, user.uid];
          const updatedPost = { ...p, likes: newLikes };

          if (typeof window !== 'undefined') {
            const allPostsStr = localStorage.getItem('apsconnect_posts'); 
            let allPostsStored: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
            const postIndex = allPostsStored.findIndex(storedPost => storedPost.id === postId);
            if (postIndex > -1) {
              allPostsStored[postIndex] = updatedPost;
              localStorage.setItem('apsconnect_posts', JSON.stringify(allPostsStored)); 
            }
          }
          return updatedPost;
        }
        return p;
      })
    );
  };

  const confirmDeletePost = (postId: string) => {
    setDeleteTargetPostId(postId);
  };

  const handleDeletePost = () => {
    if (!deleteTargetPostId || !user) return;

    const postToDelete = posts.find(p => p.id === deleteTargetPostId);
    if (!postToDelete) return;

    if (!(user.role === 'admin' || (user.role === 'faculty' && postToDelete.authorId === user.uid))) {
        toast({title: "Unauthorized", description: "You cannot delete this post.", variant: "destructive", duration: 3000});
        setDeleteTargetPostId(null);
        return;
    }

    if (typeof window !== 'undefined') {
        let allPostsStr = localStorage.getItem('apsconnect_posts'); 
        let allPostsStored: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
        allPostsStored = allPostsStored.filter(p => p.id !== deleteTargetPostId);
        localStorage.setItem('apsconnect_posts', JSON.stringify(allPostsStored)); 
        
        setPosts(prevPosts => prevPosts.filter(p => p.id !== deleteTargetPostId));
        toast({title: "Post Deleted", description: `"${postToDelete.title}" has been deleted.`, duration: 3000});
    }
    setDeleteTargetPostId(null);
  };

  const handleFilterChange = (category: PostCategory) => {
    setActiveFilters(prevFilters => {
      const newFilters = prevFilters.includes(category)
        ? prevFilters.filter(c => c !== category)
        : [...prevFilters, category];
      return newFilters;
    });
  };

  const handleSelectAllFilters = () => {
    setActiveFilters(postCategories);
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };


  if (authLoading || isLoadingPosts) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="mx-auto my-10 max-w-2xl rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-8 shadow-lg bg-card text-card-foreground">
      <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200 dark:border-gray-700 pb-3">
        <p className="text-xl font-bold text-gray-700 dark:text-white">Activity Feed</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
              <Filter className="mr-2 h-4 w-4" /> Filter Categories
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {postCategories.map(category => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={activeFilters.includes(category)}
                onCheckedChange={() => handleFilterChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSelectAllFilters}>Select All</DropdownMenuItem>
            <DropdownMenuItem onClick={handleClearAllFilters}>Clear All (Show All)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground"> No Posts Yet</p>
            <p className="text-sm text-muted-foreground mt-1">
               {activeFilters.length > 0 && activeFilters.length < postCategories.length ? "No posts match your current filters." :
               user ? "There are no posts matching your view criteria. Check back later!" : "Login to see personalized posts or check if general posts are available."}
            </p>
            { (user?.role === 'admin' || user?.role === 'faculty') && (
              <Button asChild className="mt-6">
                <Link href={user.role === 'admin' ? "/admin/posts/new" : "/faculty/content/new"}>Create New Post</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map(post => (
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
      </div>

      <AlertDialog open={!!deleteTargetPostId} onOpenChange={() => setDeleteTargetPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
