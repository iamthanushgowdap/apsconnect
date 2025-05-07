
"use client";

import React, { useEffect, useState } from 'react';
import { Post, Branch, UserRole, defaultBranches } from '@/types'; // Updated import
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Loader2, FileText, Paperclip, Download, Search, Filter, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast'; 

// getBranchFromUsn might be deprecated if branch is always directly assigned
// const getBranchFromUsn = (usn?: string): Branch | undefined => {
//   if (!usn || usn.length < 7) return undefined;
//   const branchCode = usn.substring(5, 7).toUpperCase();
//   // Since Branch is now string, direct validation against defaultBranches might not be needed
//   // unless for specific display rules or initial population.
//   return branchCode;
// };


export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast(); 
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  
  const [managedBranches, setManagedBranches] = useState<string[]>(defaultBranches); // Use default as fallback
  const postCategories: Post['category'][] = ["event", "news", "link", "note", "schedule"]; 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranches = localStorage.getItem('campus_connect_managed_branches');
      if (storedBranches) {
        setManagedBranches(JSON.parse(storedBranches));
      }
      // If no stored branches, managedBranches remains defaultBranches.
    }
  }, []);

  useEffect(() => {
    setIsLoadingPosts(true);
    if (typeof window !== 'undefined') {
      const postsStr = localStorage.getItem('campus_connect_posts');
      const loadedPosts: Post[] = postsStr ? JSON.parse(postsStr) : [];
      loadedPosts.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
      setAllPosts(loadedPosts);
    }
    setIsLoadingPosts(false);
  }, []);

  useEffect(() => {
    let postsToFilter = allPosts;

    if (user) {
      if (user.role === 'student') {
        const studentBranch = user.branch; // Directly use stored branch
        postsToFilter = postsToFilter.filter(post => 
          post.targetBranches.length === 0 || 
          (studentBranch && post.targetBranches.includes(studentBranch)) 
        );
      } else if (user.role === 'faculty' && user.assignedBranches) {
        postsToFilter = postsToFilter.filter(post =>
          post.targetBranches.length === 0 || 
          user.assignedBranches?.some(assignedBranch => post.targetBranches.includes(assignedBranch)) 
        );
      }
    } else {
       postsToFilter = postsToFilter.filter(post => post.targetBranches.length === 0);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      postsToFilter = postsToFilter.filter(post =>
        post.title.toLowerCase().includes(lowerSearchTerm) ||
        post.content.toLowerCase().includes(lowerSearchTerm) ||
        post.authorName.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (categoryFilter !== 'all') {
      postsToFilter = postsToFilter.filter(post => post.category === categoryFilter);
    }
    
    if (branchFilter !== 'all') {
        if (branchFilter === 'general') { // Handle 'General' filter
            postsToFilter = postsToFilter.filter(post => post.targetBranches.length === 0);
        } else {
            postsToFilter = postsToFilter.filter(post => post.targetBranches.includes(branchFilter as Branch) || post.targetBranches.length === 0);
        }
    }

    setFilteredPosts(postsToFilter);
  }, [allPosts, user, searchTerm, categoryFilter, branchFilter]);

  if (authLoading || isLoadingPosts) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleDownload = (attachmentName: string) => {
      toast({ title: "Download Started (Mock)", description: `Downloading ${attachmentName}...` });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Campus Activity Feed</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Stay updated with the latest news, events, notes, and schedules from around the campus.
            {user?.role === 'student' && user.branch && ` Showing relevant posts for ${user.branch}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search posts..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {postCategories.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                    </SelectContent>
                </Select>
                { (user?.role === 'admin' || user?.role === 'faculty') && 
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {(managedBranches.length > 0 ? managedBranches : defaultBranches).map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                            <SelectItem value="general">General (No Specific Branch)</SelectItem> 
                        </SelectContent>
                    </Select>
                }
            </div>
        </CardContent>
      </Card>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No posts found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <Card key={post.id} className="shadow-md hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-lg font-semibold text-primary leading-tight">
                        {post.title}
                    </CardTitle>
                    <Badge variant={post.category === "event" || post.category === "schedule" ? "default" : "secondary"} className="text-xs whitespace-nowrap ml-2">
                        {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Posted by {post.authorName} ({post.authorRole}) - {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
                </CardDescription>
                {post.targetBranches.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                        For: {post.targetBranches.join(', ')}
                    </div>
                )}
                 {post.targetBranches.length === 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                        For: All Branches
                    </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">{post.content}</p>
                {post.attachments && post.attachments.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Attachments:</h4>
                    <ul className="space-y-1">
                      {post.attachments.map((att, index) => (
                        <li key={index} className="text-xs flex items-center justify-between p-1.5 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors">
                          <span className="truncate max-w-[calc(100%-3rem)]">
                            <Paperclip className="inline h-3 w-3 mr-1.5 text-primary" />
                            {att.name} ({(att.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDownload(att.name)}>
                             <Download className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
               <CardFooter className="flex-col items-start"> 
                <Image
                    src={`https://picsum.photos/seed/${post.id}/400/200`}
                    alt={post.title}
                    width={400}
                    height={200}
                    className="rounded-md object-cover w-full aspect-video mb-2" 
                    data-ai-hint={`${post.category} ${post.targetBranches.length > 0 ? post.targetBranches[0].toLowerCase() : 'general'}`}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

