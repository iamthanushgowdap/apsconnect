"use client";

import Link from "next/link";
import { SiteConfig } from "@/config/site";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
// Input and SearchIcon removed as search is no longer in navbar
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, User } from "@/components/auth-provider";
import React, { useEffect, useState } from 'react';
import type { Post, UserProfile, NotificationPreferences } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Settings, Newspaper, Home, UserCircle, Sun, Moon, BookOpen, CalendarClock, BarChart3, FilePlus2, Users } from "lucide-react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { getInitials } from "@/components/content/post-item-utils";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [unseenPostsCount, setUnseenPostsCount] = useState(0);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(undefined);
  // searchQuery and handleSearchSubmit removed

  const calculateUnseenPosts = React.useCallback(() => {
    if (typeof window === 'undefined' || !user ) {
      setUnseenPostsCount(0);
      return;
    }

    const allPostsStr = localStorage.getItem('apsconnect_posts');
    const allPosts: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
    if (allPosts.length === 0) {
      setUnseenPostsCount(0);
      return;
    }

    const userPreferences = user.notificationPreferences || { news: true, events: true, notes: true, schedules: true, general: true };

    let viewablePosts = allPosts.filter(post => {
      let categoryPreference = true;
      switch (post.category) {
        case 'news': categoryPreference = userPreferences.news; break;
        case 'event': categoryPreference = userPreferences.events; break;
        case 'note': categoryPreference = userPreferences.notes; break;
        case 'schedule': categoryPreference = userPreferences.schedules; break;
        default: categoryPreference = userPreferences.general;
      }
      if (!categoryPreference) return false;

      if (user.role === 'student' && user.branch) {
        return !post.targetBranches || post.targetBranches.length === 0 || post.targetBranches.includes(user.branch);
      } else if (user.role === 'faculty' && user.assignedBranches) {
        return !post.targetBranches || post.targetBranches.length === 0 ||
               user.assignedBranches?.some(assignedBranch => post.targetBranches && post.targetBranches.includes(assignedBranch));
      }
      return true;
    });

    const seenPostIdsKey = `apsconnect_seen_post_ids_${user.uid}`;
    const seenPostIdsStr = localStorage.getItem(seenPostIdsKey);
    const seenPostIds: string[] = seenPostIdsStr ? JSON.parse(seenPostIdsStr) : [];

    const unseen = viewablePosts.filter(post => !seenPostIds.includes(post.id));
    setUnseenPostsCount(unseen.length);
  }, [user]);

  useEffect(() => {
    calculateUnseenPosts();
    if (user && typeof window !== 'undefined') {
      const userProfileStr = localStorage.getItem(`apsconnect_user_${user.uid}`);
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr) as UserProfile;
        setUserAvatarUrl(userProfile.avatarDataUrl);
      } else {
        setUserAvatarUrl(undefined);
      }
    } else {
      setUserAvatarUrl(undefined);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'apsconnect_posts' || (user && event.key === `apsconnect_seen_post_ids_${user.uid}`)) {
        calculateUnseenPosts();
      }
      if (user && event.key === `apsconnect_user_${user.uid}`) {
        const updatedProfileStr = localStorage.getItem(`apsconnect_user_${user.uid}`);
        if (updatedProfileStr) {
          const updatedProfile = JSON.parse(updatedProfileStr) as UserProfile;
          setUserAvatarUrl(updatedProfile.avatarDataUrl);
        } else {
           setUserAvatarUrl(undefined);
        }
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

  // handleSearchSubmit function removed

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-4 md:mr-6 flex items-center space-x-2" aria-label="Go to APSConnect Homepage">
          <Icons.AppLogo className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">{SiteConfig.name}</span>
        </Link>
        <nav className="hidden md:flex flex-1 items-center space-x-2 sm:space-x-4 md:space-x-6 text-sm font-medium">
          {SiteConfig.mainNav.map((item) => {
            if (isLoading) {
              if (item.title === "Home") { /* Always render Home */ } else { return null; }
            } else {
              if (item.hideWhenLoggedIn && user) return null;
              if (item.protected && !user) return null;
              if (item.adminOnly && (!user || user.role !== 'admin')) return null;
              if (item.facultyOnly && (!user || user.role !== 'faculty')) return null;
              if (item.studentOnly && (!user || !(user.role === 'student' || user.role === 'pending'))) return null;
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
                    suppressHydrationWarning
                >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                    {item.title}
                </Link>
            );
          })}
        </nav>

        {/* Search form JSX removed */}

        <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
          {isLoading ? (
             <SimpleRotatingSpinner className="h-8 w-8 text-primary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full" suppressHydrationWarning aria-label="User menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarUrl || undefined} alt={user.displayName || "User Avatar"} data-ai-hint="person avatar" />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getInitials(user.displayName || user.email || user.usn)}
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
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                    </DropdownMenuItem>
                    {(user.role === 'admin' || user.role === 'faculty' || user.role === 'student') && (
                    <DropdownMenuItem asChild>
                    <Link href="/feed" className="flex items-center justify-between">
                        <div className="flex items-center">
                        <Newspaper className="mr-2 h-4 w-4" />
                        <span>Activity Feed</span>
                        </div>
                        {unseenPostsCount > 0 && (
                        <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold p-1" aria-label={`${unseenPostsCount} unseen posts`}>
                            {unseenPostsCount > 9 ? '9+' : unseenPostsCount}
                        </span>
                        )}
                    </Link>
                    </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="flex items-center">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                    </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent">
                    <ThemeToggleButton />
                    <span className="ml-2">{typeof window !== 'undefined' && localStorage.getItem('color-theme') === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
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
              <Button asChild variant="outline" size="sm" suppressHydrationWarning>
                <Link href="/login" suppressHydrationWarning>Login</Link>
              </Button>
              <Button asChild size="sm" suppressHydrationWarning>
                <Link href="/register" suppressHydrationWarning>Register</Link>
              </Button>
               <div className="md:hidden ml-2">
                 <ThemeToggleButton />
               </div>
               <div className="hidden md:block">
                 <ThemeToggleButton />
               </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
