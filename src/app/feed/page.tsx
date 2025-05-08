
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
import { Heart, FileText, CalendarDays, Newspaper, BookOpen, Paperclip, Download, Edit3, Trash2, Settings, Filter, Share2, MapPin, Users, MoreHorizontal } from 'lucide-react';
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


const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }
  if (name.length >=2) return name.substring(0, 2).toUpperCase();
  if (name.length === 1) return name.substring(0,1).toUpperCase();
  return "??"; 
};

const categoryIcons: Partial<Record<Post['category'], React.ElementType>> = {
  event: CalendarDays,
  news: Newspaper,
  link: Paperclip,
  note: BookOpen,
  schedule: CalendarDays,
};

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
    <div className="relative flex items-start py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Author Avatar */}
      <Avatar className="h-10 w-10 rounded-full object-cover mt-1">
        <AvatarImage
          src={post.authorAvatarUrl || `https://picsum.photos/seed/${post.authorId}/40/40`}
          alt={`${post.authorName || 'Author'}'s avatar`}
          data-ai-hint="person avatar"
        />
        <AvatarFallback>
          {getInitials(post.authorName)}
        </AvatarFallback>
      </Avatar>

      {/* Post Details */}
      <div className="ml-4 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="mb-1 font-medium text-gray-700 dark:text-white">{post.authorName || 'Anonymous'} ({post.authorRole})</p>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <IconComponent className={`inline h-4 w-4 mr-1 ${getPostIconColor(post.category)}`} />
              {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              <span className="mx-1">&middot;</span>
              {post.targetBranches && post.targetBranches.length > 0 ? (
                <><MapPin className="inline h-3 w-3 mr-1" /> For: {post.targetBranches.join(', ')}</>
              ) : (
                <><Users className="inline h-3 w-3 mr-1" /> For: All Branches</>
              )}
            </div>
          </div>
        </div>
        
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mt-1 line-clamp-2">{post.title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">{post.content}</p>

        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Attachments:</h4>
            <div className="flex flex-wrap gap-2">
              {post.attachments.map((att, index) => (
                <Button key={index} variant="outline" size="sm" onClick={() => handleDownload(att)} className="text-xs">
                  <Paperclip className="h-3 w-3 mr-1.5" />
                  {att.name} ({ (att.size / (1024*1024)).toFixed(2) } MB)
                  <Download className="h-3 w-3 ml-1.5" />
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => onLikePost(post.id)} className="group text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
            <Heart className={`h-4 w-4 mr-1.5 ${post.likes?.includes(currentUser?.uid || '') ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500/30'}`} />
            {post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}
          </Button>

          <div className="flex items-center space-x-2">
            {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                       <MoreHorizontal className="h-4 w-4" /> 
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {canEdit && <DropdownMenuItem onClick={handleEdit}><Edit3 className="mr-2 h-4 w-4" />Edit Post</DropdownMenuItem>}
                    {canDelete && <DropdownMenuItem onClick={() => onDeletePost(post.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Post</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>
      </div>
       <span className="absolute top-4 right-2 text-xs text-gray-400">
        {post.createdAt ? formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true }) : 'some time ago'}
      </span>
    </div>
  );
}


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

