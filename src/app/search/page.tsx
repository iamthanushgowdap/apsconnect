"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, User } from '@/components/auth-provider';
import type { Post, UserProfile, SearchResultItem, Branch, PostCategory, Semester } from '@/types';
import { postCategories, defaultBranches, semesters } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PostItem } from '@/components/content/post-item';
import { UserProfileCard } from '@/components/users/user-profile-card'; 
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Filter, Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from '@/components/ui/date-range-picker'; 
import type { DateRange } from 'react-day-picker';
import { parseISO, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast(); 

  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [currentSearchTerm, setCurrentSearchTerm] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Advanced filter states
  const [selectedCategories, setSelectedCategories] = useState<PostCategory[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState<UserProfile['role'][]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [managedBranches, setManagedBranches] = useState<Branch[]>(defaultBranches);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedBranches = localStorage.getItem('apsconnect_managed_branches');
        if (storedBranches) {
            try {
                const parsed = JSON.parse(storedBranches);
                if(Array.isArray(parsed) && parsed.length > 0) setManagedBranches(parsed);
            } catch (e) { console.error("Error parsing managed branches for search:", e); }
        }
    }
  }, []);

  const performSearch = useCallback(() => {
    setIsLoading(true);
    if (typeof window === 'undefined' || !currentSearchTerm.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const searchTermLower = currentSearchTerm.toLowerCase();
    let searchedItems: SearchResultItem[] = [];

    // Search Posts
    const postsStr = localStorage.getItem('apsconnect_posts');
    const allPosts: Post[] = postsStr ? JSON.parse(postsStr) : [];
    const filteredPosts = allPosts.filter(post => {
      let matchesQuery = (
        post.title.toLowerCase().includes(searchTermLower) ||
        post.content.toLowerCase().includes(searchTermLower) ||
        post.authorName.toLowerCase().includes(searchTermLower)
      );

      if (selectedCategories.length > 0 && !selectedCategories.includes(post.category)) matchesQuery = false;
      if (dateRange?.from && dateRange?.to && !isWithinInterval(parseISO(post.createdAt), { start: dateRange.from, end: dateRange.to })) matchesQuery = false;
      if (selectedBranches.length > 0 && (post.targetBranches.length === 0 || !post.targetBranches.some(b => selectedBranches.includes(b)))) matchesQuery = false;
      
      let canView = false;
      if (!post.targetBranches || post.targetBranches.length === 0) canView = true;
      else if (user) {
        if (user.role === 'admin') canView = true;
        else if (user.role === 'student' && user.branch && post.targetBranches.includes(user.branch)) canView = true;
        else if (user.role === 'faculty' && user.assignedBranches && user.assignedBranches.some(b => post.targetBranches.includes(b))) canView = true;
      }
      if (!canView) matchesQuery = false;

      return matchesQuery;
    });
    searchedItems.push(...filteredPosts.map(p => ({ ...p, type: 'post' as const })));

    if (user && (user.role === 'admin' || user.role === 'faculty')) {
      const users: UserProfile[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('apsconnect_user_')) {
          try {
            const profile = JSON.parse(localStorage.getItem(key) || '{}') as UserProfile;
            if (profile.uid) users.push(profile);
          } catch (e) {/* ignore */}
        }
      }

      const filteredUsers = users.filter(profile => {
        let matchesQuery = (
          profile.displayName?.toLowerCase().includes(searchTermLower) ||
          profile.email.toLowerCase().includes(searchTermLower) ||
          profile.usn?.toLowerCase().includes(searchTermLower) ||
          profile.facultyTitle?.toLowerCase().includes(searchTermLower)
        );
        
        if (user.role === 'faculty' && user.assignedBranches && profile.role === 'student' && profile.branch && !user.assignedBranches.includes(profile.branch)) {
            matchesQuery = false; 
        }
        if (selectedUserRoles.length > 0 && !selectedUserRoles.includes(profile.role)) matchesQuery = false;
        if (selectedBranches.length > 0 && profile.role === 'student' && profile.branch && !selectedBranches.includes(profile.branch)) matchesQuery = false;
        if (selectedBranches.length > 0 && profile.role === 'faculty' && (!profile.assignedBranches || !profile.assignedBranches.some(b => selectedBranches.includes(b)))) matchesQuery = false;

        return matchesQuery;
      });
      searchedItems.push(...filteredUsers.map(u => ({ ...u, type: 'user' as const })));
    }
    
    searchedItems.sort((a, b) => {
        if (a.type === 'post' && b.type === 'post') return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
        if (a.type === 'user' && b.type === 'user') return (a.displayName || "").localeCompare(b.displayName || "");
        return a.type === 'post' ? -1 : 1; 
    });

    setResults(searchedItems);
    setIsLoading(false);
  }, [currentSearchTerm, user, selectedCategories, dateRange, selectedBranches, selectedUserRoles]);

  useEffect(() => {
    if (!authLoading) {
        performSearch();
    }
  }, [performSearch, authLoading, currentSearchTerm]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentSearchTerm(query);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };
  
  const handleLikePost = (postId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like posts.", variant: "destructive", duration: 3000 });
      return;
    }
     setResults(prevResults =>
      prevResults.map(item => {
        if (item.type === 'post' && item.id === postId) {
          const currentLikes = item.likes || [];
          const userLiked = currentLikes.includes(user.uid);
          const newLikes = userLiked
            ? currentLikes.filter(uid => uid !== user.uid)
            : [...currentLikes, user.uid];
          const updatedPost = { ...item, likes: newLikes };

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
        return item;
      })
    );
  };

  const handleDeletePost = (postId: string) => {
    if (!user) return;
    const postToDelete = results.find(r => r.type === 'post' && r.id === postId) as Post | undefined;
    if (!postToDelete) return;

    if (!(user.role === 'admin' || (user.role === 'faculty' && postToDelete.authorId === user.uid))) {
        toast({title: "Unauthorized", description: "You cannot delete this post.", variant: "destructive", duration: 3000});
        return;
    }

    if (typeof window !== 'undefined') {
        let allPostsStr = localStorage.getItem('apsconnect_posts');
        let allPostsStored: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
        allPostsStored = allPostsStored.filter(p => p.id !== postId);
        localStorage.setItem('apsconnect_posts', JSON.stringify(allPostsStored));
        
        setResults(prevResults => prevResults.filter(r => !(r.type === 'post' && r.id === postId)));
        toast({title: "Post Deleted", description: `"${postToDelete.title}" has been deleted.`, duration: 3000});
    }
  };

  if (authLoading) return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-16 w-16 text-primary" /></div>;

  const postResults = results.filter(r => r.type === 'post') as Post[];
  const userResults = results.filter(r => r.type === 'user') as UserProfile[];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center"><SearchIcon className="mr-3 h-7 w-7 text-primary"/>Search Results</CardTitle>
          <CardDescription>Showing results for: "{currentSearchTerm}"</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6">
            <Input
              type="search"
              placeholder="Search APSConnect..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">Search</Button>
          </form>
          
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center"><SlidersHorizontal className="mr-2 h-5 w-5"/>Advanced Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><Filter className="mr-2 h-4 w-4"/>Post Categories</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filter by Post Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {postCategories.map(cat => (
                    <DropdownMenuCheckboxItem key={cat} checked={selectedCategories.includes(cat)} onCheckedChange={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
             
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><Filter className="mr-2 h-4 w-4"/>Target Branch</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by Branch</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {managedBranches.map(branch => (
                      <DropdownMenuCheckboxItem key={branch} checked={selectedBranches.includes(branch)} onCheckedChange={() => setSelectedBranches(prev => prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch])}>{branch}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
               {(user?.role === 'admin') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><Filter className="mr-2 h-4 w-4"/>User Role</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by User Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(['student', 'faculty', 'admin', 'pending'] as UserProfile['role'][]).map(role => (
                      <DropdownMenuCheckboxItem key={role} checked={selectedUserRoles.includes(role)} onCheckedChange={() => setSelectedUserRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}>{role.charAt(0).toUpperCase() + role.slice(1)}</DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
             <Button onClick={performSearch} className="mt-4 w-full sm:w-auto" disabled={isLoading}>
                {isLoading && <SimpleRotatingSpinner className="mr-2 h-4 w-4"/>} Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-10"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>
      ) : results.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No results found for "{currentSearchTerm}" with the selected filters.</p>
      ) : (
        <div className="space-y-8">
          {postResults.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Posts ({postResults.length})</h2>
              <div className="space-y-4">
                {postResults.map(post => (
                  <PostItem key={post.id} post={post} currentUser={user} onLikePost={handleLikePost} onDeletePost={handleDeletePost} />
                ))}
              </div>
            </section>
          )}
          {userResults.length > 0 && (user?.role === 'admin' || user?.role === 'faculty') && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Users ({userResults.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userResults.map(profile => (
                    <UserProfileCard key={profile.uid} profile={profile} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

