"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, User } from '@/components/auth-provider';
import type { Post, PostAttachment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, MessageSquare, FileText, CalendarDays, Newspaper, BookOpen, Paperclip, Download, Edit3, Trash2, Settings, Filter } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
    // In a real app, this would trigger a download from a URL.
    // For mock, we just show a toast.
    toast({ title: "Download Started (Mock)", description: `Downloading ${attachment.name}...` });
    // Simulating file download with a placeholder link
    const link = document.createElement('a');
    link.href = `data:${attachment.type};base64,`; // Placeholder data URI
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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


  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden border border-border/60">
      <CardHeader className="p-4 sm:p-5 border-b border-border/50">
        <div className="flex items-start space-x-3">
          <Avatar className="h-11 w-11">
            {/* Add AvatarImage if author has one, e.g. src={post.authorAvatarUrl} */}
            <AvatarImage src={`https://picsum.photos/seed/${post.authorId}/44/44`} alt={post.authorName} data-ai-hint="person avatar"/>
            <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-foreground leading-tight">{post.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        By {post.authorName} ({post.authorRole}) - {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
                    </CardDescription>
                </div>
                { (canEdit || canDelete) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-1">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && <DropdownMenuItem onClick={handleEdit}><Edit3 className="mr-2 h-4 w-4" />Edit Post</DropdownMenuItem>}
                        {canDelete && <DropdownMenuItem onClick={() => onDeletePost(post.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Post</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconComponent className="h-4 w-4 text-primary"/> 
            <Badge variant={post.category === "event" || post.category === "schedule" ? "default" : "secondary"} className="capitalize">
                {post.category}
            </Badge>
            {post.targetBranches && post.targetBranches.length > 0 && (
                <Badge variant="outline">For: {post.targetBranches.join(', ')}</Badge>
            )}
            {(!post.targetBranches || post.targetBranches.length === 0) && (
                <Badge variant="outline">For: All Branches</Badge>
            )}
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.attachments && post.attachments.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Attachments:</h4>
            <ul className="space-y-1.5">
              {post.attachments.map((att, index) => (
                <li key={index} className="text-xs">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(att)} className="w-full justify-start text-left h-auto py-1.5 px-2.5">
                    <Paperclip className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span className="truncate flex-grow">{att.name} ({(att.size / (1024*1024)).toFixed(2)} MB)</span>
                    <Download className="h-3.5 w-3.5 ml-2 flex-shrink-0 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 sm:p-5 border-t border-border/50 flex items-center justify-start">
        <Button variant="ghost" size="sm" onClick={() => onLikePost(post.id)} className="text-muted-foreground hover:text-red-500 group">
          <Heart className={`h-4 w-4 mr-1.5 transition-colors ${post.likes?.includes(currentUser?.uid || '') ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500/30'}`} />
          {post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}
        </Button>
        {/* Placeholder for comments if added later */}
        {/* <Button variant="ghost" size="sm" className="ml-2 text-muted-foreground hover:text-primary">
          <MessageSquare className="h-4 w-4 mr-1.5" /> 0 Comments
        </Button> */}
      </CardFooter>
    </Card>
  );
}


export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [deleteTargetPostId, setDeleteTargetPostId] = useState<string | null>(null);
  const { toast } = useToast();

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
        
        // Dispatch custom event to notify navbar
        window.dispatchEvent(new CustomEvent('postsSeen'));
    }
  }, [user, posts]);


  const fetchPosts = useCallback(() => {
    setIsLoadingPosts(true);
    if (typeof window !== 'undefined') {
      const storedPostsStr = localStorage.getItem('campus_connect_posts');
      let allPosts: Post[] = storedPostsStr ? JSON.parse(storedPostsStr) : [];
      
      if (user) {
        if (user.role === 'student' && user.branch) {
          const studentBranch = user.branch;
          allPosts = allPosts.filter(post => 
            post.targetBranches.length === 0 || // General posts
            post.targetBranches.includes(studentBranch) // Posts for student's branch
          );
        } else if (user.role === 'faculty' && user.assignedBranches) {
          const facultyBranches = user.assignedBranches;
          allPosts = allPosts.filter(post => 
            post.targetBranches.length === 0 || // General posts
            facultyBranches.some(branch => post.targetBranches.includes(branch)) // Posts for faculty's branches
          );
        } 
        // Admin sees all posts implicitly
      } else {
        // Non-logged in users might see only general posts, or none
        // For now, let's assume they see general posts if any are marked as such
        allPosts = allPosts.filter(post => post.targetBranches.length === 0);
      }

      setPosts(allPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
    }
    setIsLoadingPosts(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (posts.length > 0 && user) {
      markPostsAsSeen();
    }
  }, [posts, user, markPostsAsSeen]);


  const handleLikePost = (postId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like posts.", variant: "destructive" });
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

          // Update localStorage
          if (typeof window !== 'undefined') {
            const allPostsStr = localStorage.getItem('campus_connect_posts');
            let allPosts: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
            const postIndex = allPosts.findIndex(storedPost => storedPost.id === postId);
            if (postIndex > -1) {
              allPosts[postIndex] = updatedPost;
              localStorage.setItem('campus_connect_posts', JSON.stringify(allPosts));
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
        toast({title: "Unauthorized", description: "You cannot delete this post.", variant: "destructive"});
        setDeleteTargetPostId(null);
        return;
    }

    if (typeof window !== 'undefined') {
        let allPostsStr = localStorage.getItem('campus_connect_posts');
        let allPosts: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
        allPosts = allPosts.filter(p => p.id !== deleteTargetPostId);
        localStorage.setItem('campus_connect_posts', JSON.stringify(allPosts));
        
        setPosts(prevPosts => prevPosts.filter(p => p.id !== deleteTargetPostId));
        toast({title: "Post Deleted", description: `"${postToDelete.title}" has been deleted.`});
    }
    setDeleteTargetPostId(null);
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
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
                <Newspaper className="mr-3 h-7 w-7" /> Activity Feed
            </h1>
            <p className="text-sm text-muted-foreground">Latest updates, news, and events from around the campus.</p>
        </div>
        {/* Placeholder for Notification Settings or Filter button functionality */}
        <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
          <Filter className="mr-2 h-4 w-4" /> Filter Feed
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="text-center py-12 shadow-md rounded-xl border border-border/60">
          <CardContent>
            <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">No Posts Yet</h2>
            <p className="text-muted-foreground mt-1">
              {user ? "There are no posts matching your view criteria. Check back later!" : "Login to see personalized posts or check if general posts are available."}
            </p>
            {user && (user.role === 'admin' || user.role === 'faculty') && (
              <Link href={user.role === 'admin' ? "/admin/posts/new" : "/faculty/content/new"} className="mt-4 inline-block">
                <Button>Create New Post</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 max-w-2xl mx-auto">
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

