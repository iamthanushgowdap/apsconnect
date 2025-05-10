"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { User, Post, PostAttachment, PostCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, Paperclip, Download, Edit3, Trash2, MapPin, Users, MoreHorizontal, ArrowRight, FileText } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getInitials, categoryIcons, getPostIconColor } from './post-item-utils';

interface PostItemProps {
  post: Post;
  currentUser: User | null;
  onLikePost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
}

export function PostItem({ post, currentUser, onLikePost, onDeletePost }: PostItemProps) {
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

  return (
    <div className="relative flex items-start py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
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
                <Button key={index} variant="outline" size="sm" onClick={() => handleDownload(att)} className="text-xs" aria-label={`Download attachment ${att.name}`}>
                  <Paperclip className="h-3 w-3 mr-1.5" />
                  {att.name} ({ (att.size / (1024*1024)).toFixed(2) } MB)
                  <Download className="h-3 w-3 ml-1.5" />
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-3 flex items-center justify-between">
           <Link href={`/post/${post.id}`} className="w-auto">
             <Button variant="ghost" size="sm" className="justify-between text-primary hover:bg-primary/10 group" aria-label={`Read more about ${post.title}`}>
                Read More <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             </Button>
           </Link>
          <div className="flex items-center space-x-2">
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onLikePost(post.id)} 
                className="group text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                aria-label={post.likes?.includes(currentUser?.uid || '') ? `Unlike post: ${post.title}` : `Like post: ${post.title}`}
              >
                <Heart className={`h-4 w-4 mr-1.5 ${post.likes?.includes(currentUser?.uid || '') ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500/30'}`} />
                {post.likes?.length || 0}
             </Button>
            {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`More actions for post: ${post.title}`}>
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
