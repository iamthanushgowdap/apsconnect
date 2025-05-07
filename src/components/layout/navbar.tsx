"use client";

import Link from "next/link";
import { SiteConfig } from "@/config/site";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider"; 
import React, { useEffect, useState } from 'react';
import type { Post } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, LogOut, LayoutDashboard, Settings, Newspaper } from "lucide-react"; 

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth(); 
  const [unseenPostsCount, setUnseenPostsCount] = useState(0);

  const calculateUnseenPosts = React.useCallback(() => {
    if (typeof window === 'undefined' || !user || (user.role !== 'student' && user.role !== 'faculty')) {
      setUnseenPostsCount(0);
      return;
    }

    const allPostsStr = localStorage.getItem('campus_connect_posts');
    const allPosts: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
    if (allPosts.length === 0) {
      setUnseenPostsCount(0);
      return;
    }

    let viewablePosts = allPosts;
    // Filter posts based on user role and branch (similar to FeedPage logic)
    if (user.role === 'student' && user.branch) {
      const studentBranch = user.branch;
      viewablePosts = allPosts.filter(post => 
        post.targetBranches.length === 0 || post.targetBranches.includes(studentBranch)
      );
    } else if (user.role === 'faculty' && user.assignedBranches) {
      viewablePosts = allPosts.filter(post =>
        post.targetBranches.length === 0 || 
        user.assignedBranches?.some(assignedBranch => post.targetBranches.includes(assignedBranch))
      );
    } else { 
      // For other roles (like admin) or if no branch info, show all posts. 
      // Or, if if non-student/faculty shouldn't see badge, handle here.
      // Current logic: admin won't show badge as per initial useCallback condition.
      viewablePosts = allPosts; // Admin sees all posts for count if logic were to change
    }
    
    const seenPostIdsKey = `campus_connect_seen_post_ids_${user.uid}`;
    const seenPostIdsStr = localStorage.getItem(seenPostIdsKey);
    const seenPostIds: string[] = seenPostIdsStr ? JSON.parse(seenPostIdsStr) : [];

    const unseen = viewablePosts.filter(post => !seenPostIds.includes(post.id));
    setUnseenPostsCount(unseen.length);

  }, [user]);

  useEffect(() => {
    calculateUnseenPosts();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'campus_connect_posts' || (user && event.key === `campus_connect_seen_post_ids_${user.uid}`)) {
        calculateUnseenPosts();
      }
    };

    const handlePostsSeenEvent = () => {
        calculateUnseenPosts();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('postsSeen', handlePostsSeenEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('postsSeen', handlePostsSeenEvent);
      }
    };
  }, [user, pathname, calculateUnseenPosts]);


  const handleLogout = async () => {
    await signOut();
    router.push('/'); 
  };

  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "faculty":
        return "/faculty";
      case "student":
      case "pending":
        return "/student";
      default:
        return "/dashboard"; 
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-4 md:mr-6 flex items-center space-x-2">
          <Icons.AppLogo className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">{SiteConfig.name}</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-2 sm:space-x-4 md:space-x-6 text-sm font-medium">
          {SiteConfig.mainNav.map((item) => {
            if (isLoading) {
              // Hide protected/role-specific links while loading auth state
              if (item.protected || item.adminOnly || item.facultyOnly || item.studentOnly) return null;
            } else { 
              if (item.hideWhenLoggedIn && user) return null;
              if (item.protected && !user) return null;
              if (item.adminOnly && user?.role !== 'admin') return null;
              if (item.facultyOnly && user?.role !== 'faculty') return null;
              // StudentOnly also applies to 'pending' users for the student dashboard link
              if (item.studentOnly && !(user?.role === 'student' || user?.role === 'pending')) return null;
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary relative flex items-center",
                  pathname === item.href ? "text-primary" : "text-foreground/60",
                  "text-xs sm:text-sm" 
                )}
              >
                {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {isLoading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                     {/* Placeholder for AvatarImage if user has a profile picture URL */}
                    <AvatarFallback>
                      {user.displayName ? (
                        getUserInitials(user.displayName)
                      ) : (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || user.usn} ({user.role})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()} className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/feed" className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Newspaper className="mr-2 h-4 w-4" />
                      <span>Campus Feed</span>
                    </div>
                    {(user.role === 'student' || user.role === 'faculty') && unseenPostsCount > 0 && (
                       <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold p-1">
                         {unseenPostsCount > 9 ? '9+' : unseenPostsCount}
                       </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2 sm:px-3")}>
                Login
              </Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "sm" }), "px-2 sm:px-3")}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
