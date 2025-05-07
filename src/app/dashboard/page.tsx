
"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  FileText, 
  MessageSquareWarning, 
  Info, 
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { useAuth } from "@/components/auth-provider";
import type { User } from "@/components/auth-provider"; 
import type { Post } from "@/types"; 

export default function DashboardPage() {
  const router = useRouter(); 
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [relevantPosts, setRelevantPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        setUser(authUser);
        if (authUser.role === 'admin') { 
          router.push('/admin');
          return; 
        }
        
        if (typeof window !== 'undefined') {
          const allPostsStr = localStorage.getItem('campus_connect_posts');
          const allPosts: Post[] = allPostsStr ? JSON.parse(allPostsStr) : [];
          allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          let filtered: Post[];
          if (authUser.role === 'student' && authUser.branch) {
            const studentBranch = authUser.branch;
            filtered = allPosts.filter(post =>
              post.targetBranches.length === 0 || post.targetBranches.includes(studentBranch)
            );
          } else if (authUser.role === 'faculty' && authUser.assignedBranches && authUser.assignedBranches.length > 0) {
            filtered = allPosts.filter(post =>
              post.targetBranches.length === 0 || authUser.assignedBranches?.some(b => post.targetBranches.includes(b))
            );
          } else {
            filtered = allPosts.filter(post => post.targetBranches.length === 0); 
          }
          setRelevantPosts(filtered.slice(0, 3)); 
        }

      } else {
        setUser(null); 
        router.push('/login'); 
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading, router]);
  
  if (isLoading || authLoading || (authUser?.role === 'admin' && !isLoading) ) { 
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-1/2 sm:w-1/3 rounded bg-muted mb-4"></div>
          <div className="h-12 w-1/3 sm:w-1/4 rounded bg-muted mt-8 mb-4"></div>
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-32 rounded-lg bg-muted"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>You need to be logged in to view this page.</p>
        <Link href="/login">
          <Button className="mt-4">Login</Button>
        </Link>
      </div>
    );
  }
  
  if (user.role === 'pending') {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl sm:text-2xl ${user.rejectionReason ? 'text-destructive' : 'text-primary'}`}>
              {user.rejectionReason ? "Account Registration Rejected" : "Account Pending Approval"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
             {user.rejectionReason ? (
                <MessageSquareWarning className="h-16 w-16 sm:h-20 sm:w-20 text-destructive mx-auto mb-4" />
             ) : (
                <Info className="h-16 w-16 sm:h-20 sm:w-20 text-primary mx-auto mb-4" />
             )}
            <p className="text-lg sm:text-xl text-foreground">
              Hi, {user.displayName || "User"}!
            </p>
            {user.usn && <p className="text-md text-muted-foreground">USN: {user.usn}</p>}
            {user.branch && <p className="text-md text-muted-foreground">Branch: {user.branch}</p>}
            {user.rejectionReason ? (
              <>
                <p className="mt-3 text-muted-foreground">
                  Your account registration was reviewed and unfortunately could not be approved at this time.
                </p>
                <p className="mt-2 font-semibold text-destructive">Reason for rejection:</p>
                <p className="mt-1 text-muted-foreground bg-destructive/10 p-3 rounded-md border border-destructive/30">
                  {user.rejectionReason}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  If you believe this is an error or have questions, please contact the college administration.
                </p>
              </>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Your account registration has been submitted and is currently awaiting admin or faculty approval. 
                You will be notified once your account is approved. Please check back later.
              </p>
            )}
            <Button variant="outline" className="mt-8" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleSpecificGreeting = () => {
    if (user.role === 'faculty') {
      return `Welcome to your Faculty Dashboard.`;
    }
    return `Welcome to your ${user.branch ? `${user.branch} ` : ''}Dashboard.`;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          Hello, {user.displayName || "User"}!
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-1">
          {getRoleSpecificGreeting()}
          {user.usn && user.role === 'student' && <span className="block text-sm sm:text-base">USN: {user.usn}</span>}
           {user.email && user.role === 'faculty' && <span className="block text-sm sm:text-base">Email: {user.email}</span>}
        </p>
      </div>
      
      <div className="grid grid-cols-1">
        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">
                Recent Updates
                {user.role === 'student' && user.branch ? ` for ${user.branch}` : ''}
                {user.role === 'faculty' && user.assignedBranches && user.assignedBranches.length > 0 ? ` for your branches` : ''}
              </CardTitle>
              <CardDescription>Latest posts relevant to you.</CardDescription>
            </CardHeader>
            <CardContent>
              {relevantPosts.length > 0 ? (
                <div className="space-y-6">
                  {relevantPosts.map(post => (
                    <UpdateItem key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No new updates at the moment.</p>
                </div>
              )}
              <div className="mt-8 text-center">
                <Link href="/feed" className={buttonVariants({variant: "outline", className: "w-full sm:w-auto"})}>
                  View All Campus Updates <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface UpdateItemProps {
  post: Post; 
}

function UpdateItem({ post }: UpdateItemProps) {
  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md border-l-4 border-primary/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
          <h3 className="text-base sm:text-lg font-semibold text-primary leading-tight mb-1 sm:mb-0">{post.title}</h3>
          <Badge variant={post.category === "event" ? "default" : "secondary"} className="text-xs whitespace-nowrap ml-0 sm:ml-2 self-start sm:self-center">
            {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {post.targetBranches && post.targetBranches.length > 0 ? ` (${post.targetBranches.join(', ')})` : ''}
        </p>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.content}</p>
        <Link href={`/feed`} className="text-sm font-medium text-accent hover:text-accent/80 inline-flex items-center">
          Read More <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
