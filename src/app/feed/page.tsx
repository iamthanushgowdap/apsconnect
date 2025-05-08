"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, User } from '@/components/auth-provider';
import type { Post, PostAttachment, PostCategory } from '@/types'; 
import { postCategories } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, FileText, CalendarDays, Newspaper, BookOpen, Paperclip, Download, Edit3, Trash2, Settings, Filter, Share2, MapPin, Users } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation'; 
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


interface PostItemProps {
  post: Post;
  currentUser: User | null;
  onLikePost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
}

function PostItem({ post, currentUser, onLikePost, onDeletePost }: PostItemProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDownload = (attachment: PostAttachment) => {
    toast({ title: "Download Started (Mock)", description: `Downloading ${attachment.name}...`, duration: 3000 });
    const blob = new Blob(["Mock file content for " + attachment.name], { type: attachment.type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const categoryIcons: Partial = {
    event: CalendarDays,
    news: Newspaper,
    link: Paperclip,
    note: BookOpen,
    schedule: CalendarDays,
  };
  const IconComponent = post?.category && categoryIcons[post.category] ? categoryIcons[post.category] : FileText;

  const canEdit = currentUser && (currentUser.role === 'admin' || (currentUser.role === 'faculty' && post.authorId === currentUser.uid));
  const canDelete = currentUser && (currentUser.role === 'admin' || (currentUser.role === 'faculty' && post.authorId === currentUser.uid));

  const handleEdit = () => {
    if (currentUser?.role === 'admin') {
      router.push(`/admin/posts/edit/${post.id}`);
    } else if (currentUser?.role === 'faculty') {
      router.push(`/faculty/content/edit/${post.id}`);
    }
  };

  const getPostIconColor = (category: Post['category']) => {
    switch(category) {
      case 'event': return "text-indigo-500 dark:text-indigo-400";
      case 'news': return "text-green-500 dark:text-green-400";
      case 'link': return "text-yellow-500 dark:text-yellow-400";
      case 'note': return "text-purple-500 dark:text-purple-400";
      case 'schedule': return "text-teal-500 dark:text-teal-400";
      default: return "text-gray-500 dark:text-gray-400";
    }
  }

  return (
    
      
        
           
             
              
                {getInitials(post.authorName)}
              
            
            
              {post.authorName} ({post.authorRole})
              
                
                  
                   {post.title}
                
              
              
                
                   For: {post.targetBranches.join(', ')}
                
              
               
              {post.content}

              {post.attachments && post.attachments.length > 0 && (
                
                  
                    Attachments:
                    {post.attachments.map((att, index) => (
                      
                        
                         (
                          
                            
                          
                        
                      
                    ))}
                  
                
              )}
            
            
              
                {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
                {(canEdit || canDelete) && (
                   
                       
                           
                            
                            
                            
                            
                            
                           
                           
                            
                            Edit
                            Delete
                           
                       
                   
                )}
              
            
          
        
         
            
              
                {post.likes?.includes(currentUser?.uid || '') ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500/30'}
                 {post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}
              
              
                
                  Share
                
              
            
        
      
    
  );
}


export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [allStoredPosts, setAllStoredPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [deleteTargetPostId, setDeleteTargetPostId] = useState(null);
  const { toast } = useToast();
  const [activeFilters, setActiveFilters] = useState(postCategories); 

  const markPostsAsSeen = useCallback(() => {
    if (!user || posts.length === 0) return;

    const viewablePostIds = posts.map(p => p.id);
    const seenPostIdsKey = `apsconnect_seen_post_ids_${user.uid}`; 
    let seenPostIds = [];
    
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
      let fetchedAllPosts = storedPostsStr ? JSON.parse(storedPostsStr) : [];
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
            facultyBranches.some(branch => post.targetBranches.includes(branch)) 
          );
        } 
      } else {
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
            let allPostsStored = allPostsStr ? JSON.parse(allPostsStr) : [];
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
        let allPostsStored = allPostsStr ? JSON.parse(allPostsStr) : [];
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
      
        
          
        
      
    );
  }
  
  return (
    
       
        
          
            Activity feed
             
               
                 Filter Categories
               
              
                
                  
                   Filter by Category
                  
                   
                    {postCategories.map(category => (
                      
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      
                    ))}
                    
                  
                  
                    Select All
                  
                  
                    Clear All (Show All)
                  
                
              
            
          
          
            
              
                 No Posts Yet
                 
                  {activeFilters.length > 0 && activeFilters.length < postCategories.length ? "No posts match your current filters." :
                 user ? "There are no posts matching your view criteria. Check back later!" : "Login to see personalized posts or check if general posts are available."}
                 
                
                  
                    Create New Post
                  
                
              
            
            
               
                {posts.map(post => (
                    currentUser={user} 
                    onLikePost={handleLikePost}
                    onDeletePost={confirmDeletePost}
                  
                ))}
               
            
          
        
      

      
        
          
            
              Are you sure you want to delete this post? This action cannot be undone.
            
          
          
            Cancel
            Confirm Delete
          
        
      
    
  );
}
