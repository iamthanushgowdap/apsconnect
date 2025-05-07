"use client";

import Link from "next/link";
import { SiteConfig } from "@/config/site";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider"; // Import the centralized auth hook
import React from 'react';


export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth(); // Use the centralized auth hook

  const handleLogout = async () => {
    await signOut();
    router.push('/'); // Redirect to homepage after logout
  };

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
              <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {user.displayName || user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
