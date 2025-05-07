
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, User } from '@/components/auth-provider';
import type { Post, PostAttachment, PostCategory } from '@/types'; // Added PostCategory
import { postCategories } from '@/types'; // Import postCategories
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, FileText, CalendarDays, Newspaper, BookOpen, Paperclip, Download, Edit3, Trash2, Settings, Filter, Share2, MapPin, Users } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"


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
    // This is a mock download. In a real app, you'd use the file URL.
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

  const categoryIcons: Partial<Record<Post['category'], React.ElementType>> = {
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

  const getPostIcon = (category: Post['category']) => {
    switch(category) {
      case 'event': return <CalendarDays className="inline h-3 w-3 mr-1 text-indigo-500 dark:text-indigo-400" />;
      case 'news': return <Newspaper className="inline h-3 w-3 mr-1 text-green-500 dark:text-green-400" />;
      case 'link': return <Paperclip className="inline h-3 w-3 mr-1 text-yellow-500 dark:text-yellow-400" />;
      case 'note': return <BookOpen className="inline h-3 w-3 mr-1 text-purple-500 dark:text-purple-400" />;
      case 'schedule': return <CalendarDays className="inline h-3 w-3 mr-1 text-teal-500 dark:text-teal-400" />;
      default: return <FileText className="inline h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />;
    }
  }

  return (
    <div className="mb-3 space-y-4 py-2 focus:outline-none focus:ring-1 dark:focus:ring-gray-700" tabIndex={0}>
      <div className="relative flex items-start">
        <Avatar className="h-10 w-10 shrink-0">
           <AvatarImage src={`https://picsum.photos/seed/${post.authorId}/40/40`} alt={post.authorName || 'Author Avatar'} data-ai-hint="person avatar"/>
          <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
        </Avatar>
        <div className="ml-4 flex flex-col sm:w-96">
          <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">{post.authorName} ({post.authorRole})</p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {getPostIcon(post.category)}
            <span className="mr-1 font-medium text-primary dark:text-primary-foreground">{post.category.charAt(0).toUpperCase() + post.category.slice(1)}:</span>
            <span className="line-clamp-2">{post.title}</span>
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {post.targetBranches && post.targetBranches.length > 0 ? (
                <><MapPin className="inline h-3 w-3 mr-1" /> For: {post.targetBranches.join(', ')}</>
            ) : (
                <><Users className="inline h-3 w-3 mr-1" /> For: All Branches</>
            )}
          </div>
           <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">{post.content}</p>

          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-3 rounded-xl bg-blue-50 dark:bg-gray-700 p-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Attachments:</h4>
              {post.attachments.map((att, index) => (
                <div key={index} className="flex items-center text-xs text-gray-700 dark:text-gray-300 mb-1">
                  <Paperclip className="h-3.5 w-3.5 mr-1.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="truncate flex-grow pr-2">{att.name} ({(att.size / (1024*1024)).toFixed(2)} MB)</span>
                  <Button variant="link" size="sm" onClick={() => handleDownload(att)} className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:underline">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 flex items-center space-x-1">
             <span className="text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}</span>
            {(canEdit || canDelete) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && <DropdownMenuItem onClick={handleEdit}><Edit3 className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                        {canDelete && <DropdownMenuItem onClick={() => onDeletePost(post.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </div>
       <div className="mt-3 flex items-center justify-start space-x-2 pl-14">
            <Button variant="ghost" size="sm" onClick={() => onLikePost(post.id)} className="text-gray-500 dark:text-gray-400 hover:text-red-500 group px-2 py-1 h-auto">
                <Heart className={`h-4 w-4 mr-1 transition-colors ${post.likes?.includes(currentUser?.uid || '') ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500/30'}`} />
                <span className="text-xs">{post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-green-500 group px-2 py-1 h-auto">
                <Share2 className="h-4 w-4 mr-1" />
                <span className="text-xs">Share</span>
            </Button>
        </div>
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
  const [activeFilters, setActiveFilters] = useState<PostCategory[]>(postCategories); // Default to all categories

  const markPostsAsSeen = useCallback(() => {
    if (!user || posts.length === 0) return;

    const viewablePostIds = posts.map(p => p.id);
    const seenPostIdsKey = `campus_connect_seen_post_ids_${user.uid}`;
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
      const storedPostsStr = localStorage.getItem('campus_connect_posts');
      let fetchedAllPosts: Post[] = storedPostsStr ? JSON.parse(storedPostsStr) : [];
      setAllStoredPosts(fetchedAllPosts); // Store all posts before any filtering

      // User-based branch filtering
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
        // Admins see all posts, no branch filtering applied here for them.
      } else {
        // Non-logged in users see only posts targeted to 'All Branches'
        userFilteredPosts = fetchedAllPosts.filter(post => !post.targetBranches || post.targetBranches.length === 0);
      }

      // Category-based filtering
      const categoryFilteredPosts = activeFilters.length === 0 || activeFilters.length === postCategories.length
        ? userFilteredPosts // If no filters or all filters active, show all user-filtered posts
        : userFilteredPosts.filter(post => activeFilters.includes(post.category));
      
      setPosts(categoryFilteredPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
    }
    setIsLoadingPosts(false);
  }, [user, activeFilters]);


  useEffect(() => {
    fetchAndFilterPosts();
  }, [fetchAndFilterPosts]); // fetchAndFilterPosts includes user and activeFilters as dependencies

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
            const allPostsStr = localStorage.getItem('campus_connect_posts');
            let allPostsStored: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
            const postIndex = allPostsStored.findIndex(storedPost => storedPost.id === postId);
            if (postIndex > -1) {
              allPostsStored[postIndex] = updatedPost;
              localStorage.setItem('campus_connect_posts', JSON.stringify(allPostsStored));
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
        let allPostsStr = localStorage.getItem('campus_connect_posts');
        let allPostsStored: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
        allPostsStored = allPostsStored.filter(p => p.id !== deleteTargetPostId);
        localStorage.setItem('campus_connect_posts', JSON.stringify(allPostsStored));
        
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
      
      // If no filters are selected, default to showing all (by effectively selecting all)
      // Or handle this in the filtering logic directly (if newFilters.length === 0, show all)
      return newFilters;
    });
  };

  const handleSelectAllFilters = () => {
    setActiveFilters(postCategories);
  };

  const handleClearAllFilters = () => {
    // Setting to empty array will mean "show all" posts due to filter logic.
    setActiveFilters([]);
  };


  if (authLoading || isLoadingPosts) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
       <div className="mx-auto my-6 max-w-2xl rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-8 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-3">
            <p className="text-xl font-bold text-gray-700 dark:text-gray-200">Activity feed</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm font-medium text-primary dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500">
                  <Filter className="mr-2 h-4 w-4" /> Filter Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {postCategories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={activeFilters.includes(category)}
                    onCheckedChange={() => handleFilterChange(category)}
                    onSelect={(e) => e.preventDefault()} 
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSelectAllFilters}>
                  Select All
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleClearAllFilters}>
                  Clear All (Show All)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        {posts.length === 0 ? (
             <div className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Posts Yet</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                {activeFilters.length > 0 && activeFilters.length < postCategories.length ? "No posts match your current filters." :
                 user ? "There are no posts matching your view criteria. Check back later!" : "Login to see personalized posts or check if general posts are available."}
                </p>
                {user && (user.role === 'admin' || user.role === 'faculty') && (
                <Link href={user.role === 'admin' ? "/admin/posts/new" : "/faculty/content/new"} className="mt-4 inline-block">
                    <Button>Create New Post</Button>
                </Link>
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

