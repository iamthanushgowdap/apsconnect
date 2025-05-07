"use client";

import Link from "next/link";
import { SiteConfig } from "@/config/site";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
// Placeholder for auth state - replace with actual auth context/hook
import React, { useEffect, useState } from 'react';


// Mock auth state for UI development
// In a real app, this would come from AuthContext or a similar hook
interface MockAuthContextType {
  user: { name: string; role: 'student' | 'admin' } | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  register: () => void;
}

const useMockAuth = (): MockAuthContextType => {
  const [user, setUser] = useState<{ name: string; role: 'student' | 'admin' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching auth state
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    const mockUserData = { name: 'Test User', role: 'student' as 'student' | 'admin' };
    localStorage.setItem('mockUser', JSON.stringify(mockUserData));
    setUser(mockUserData);
  };
  
  const logout = () => {
    localStorage.removeItem('mockUser');
    setUser(null);
  };

  const register = () => {
    // For UI testing, just log that register was called
    console.log("Register function called");
  }


  return { user, isLoading, login, logout, register };
};


export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useMockAuth(); // Replace with actual auth hook

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.AppLogo className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">{SiteConfig.name}</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {SiteConfig.mainNav.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            if (item.protected && !user) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-foreground/60"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {user.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Login
              </Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
