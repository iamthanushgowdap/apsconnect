
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  FileText, 
  Users, 
  Settings, 
  ArrowRight, 
  ChevronRight, 
  BookOpen, 
  CalendarDays,
  GraduationCap,
  LayoutGrid,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Added for router usage

// Mock user data for UI development
interface MockUser {
  displayName: string | null;
  email: string | null;
  role: 'student' | 'admin' | 'pending';
  branch?: string;
}

// Mock post data
interface MockPost {
  id: string;
  title: string;
  category: "Schedule" | "Event" | "News" | "Notes";
  date: string;
  snippet: string;
  branch?: string; // Optional: for branch-specific posts
}

const mockPosts: MockPost[] = [
  { id: "1", title: "Mid-term Exam Schedule Released", category: "Schedule", date: "Oct 28, 2023", snippet: "The schedule for the upcoming mid-term examinations has been published for all branches...", branch: "General" },
  { id: "2", title: "Guest Lecture on AI Ethics (CSE)", category: "Event", date: "Oct 25, 2023", snippet: "Join us for an insightful guest lecture on the ethical implications of AI. Open to CSE students.", branch: "CSE" },
  { id: "3", title: "Library System Maintenance", category: "News", date: "Oct 22, 2023", snippet: "The library's online portal will be down for maintenance this weekend from Sat 6 PM to Sun 6 AM." },
  { id: "4", title: "Advanced Java Programming Notes (ISE)", category: "Notes", date: "Oct 20, 2023", snippet: "Chapter 3 & 4 notes for Advanced Java Programming have been uploaded for ISE students.", branch: "ISE"},
];


export default function DashboardPage() {
  const router = useRouter(); // Initialize router
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        displayName: parsedUser.displayName || "Student User",
        email: parsedUser.email || "student@example.com",
        role: parsedUser.role || "student",
        branch: parsedUser.branch || "CSE",
      });
    } else {
      setUser({
        displayName: "Student User",
        email: "student@example.com",
        role: "student",
        branch: "CSE",
      });
    }
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-1/3 rounded bg-muted mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-lg bg-muted"></div>)}
          </div>
          <div className="h-12 w-1/4 rounded bg-muted mt-8 mb-4"></div>
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
            <CardTitle className="text-primary text-2xl">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Image 
              src="https://picsum.photos/seed/pending-approval/400/250" 
              alt="Pending approval illustration" 
              width={400} 
              height={250} 
              className="mx-auto mb-6 rounded-lg shadow-md"
              data-ai-hint="waiting hourglass" 
            />
            <p className="text-xl text-foreground">
              Welcome, {user.displayName || "User"}!
            </p>
            <p className="mt-2 text-muted-foreground">
              Your account registration has been submitted and is currently awaiting admin approval. 
              You will be notified once your account is approved. Please check back later.
            </p>
            <Button variant="outline" className="mt-8" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userBranchPosts = mockPosts.filter(post => !post.branch || post.branch === "General" || post.branch === user.branch);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Hello, {user.displayName || "User"}!
        </h1>
        <p className="text-xl text-muted-foreground mt-1">
          Welcome to your {user.branch ? `${user.branch} ` : ''}Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <StatCard 
          title="Notifications" 
          value="3 New" 
          icon={<Bell className="h-6 w-6" />} 
          description="Check your latest alerts"
          link="#" 
          dataAiHint="bell icon"
          color="bg-red-500/10 text-red-500"
        />
        <StatCard 
          title="Upcoming Deadlines" 
          value="2 Tasks" 
          icon={<CheckSquare className="h-6 w-6" />} 
          description="Assignments & Submissions"
          link="#" 
          dataAiHint="checklist tasks"
          color="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard 
          title="My Courses" 
          value="4 Active" 
          icon={<GraduationCap className="h-6 w-6" />} 
          description="Access your course materials"
          link="#" 
          dataAiHint="graduation cap"
          color="bg-green-500/10 text-green-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Recent Updates for {user.branch}</CardTitle>
              <CardDescription>Latest posts relevant to you and your branch.</CardDescription>
            </CardHeader>
            <CardContent>
              {userBranchPosts.length > 0 ? (
                <div className="space-y-6">
                  {userBranchPosts.map(post => (
                    <UpdateItem key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No new updates specific to your branch at the moment.</p>
                </div>
              )}
              <div className="mt-8 text-center">
                <Link href="/feed" className={ButtonVariants({variant: "outline"})}>
                  View All Campus Updates <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickLinkItem href="/academics/schedule" icon={<CalendarDays className="h-5 w-5"/>} label="Class Schedule" />
              <QuickLinkItem href="/resources/library" icon={<BookOpen className="h-5 w-5"/>} label="Library Portal" />
              <QuickLinkItem href="/profile/settings" icon={<Settings className="h-5 w-5"/>} label="Profile Settings" />
              <QuickLinkItem href="/feed" icon={<LayoutGrid className="h-5 w-5"/>} label="Full Activity Feed" />
            </CardContent>
          </Card>

          {user.role === 'admin' && (
            <Card className="shadow-lg bg-primary/5">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Admin Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <QuickActionLink href="/admin/users" icon={<Users className="h-5 w-5 mr-2" />} label="Manage Users" />
                <QuickActionLink href="/admin/posts/new" icon={<FileText className="h-5 w-5 mr-2" />} label="Create Post" />
                <QuickActionLink href="/admin/approvals" icon={<Bell className="h-5 w-5 mr-2" />} label="Pending Approvals" />
                <QuickActionLink href="/admin/settings" icon={<Settings className="h-5 w-5 mr-2" />} label="Site Settings" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ----- Sub-components -----

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  link?: string;
  dataAiHint: string;
  description?: string;
  color?: string;
}

function StatCard({ title, value, icon, link, dataAiHint, description, color = "bg-accent/10 text-accent" }: StatCardProps) {
  const cardContent = (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          <div className="text-4xl font-bold text-primary">{value}</div>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Image 
          src={`https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/300/150`} 
          alt={title} 
          width={300} 
          height={150} 
          className="mt-4 rounded-lg object-cover w-full aspect-[2/1]"
          data-ai-hint={dataAiHint} 
        />
      </CardContent>
    </Card>
  );
  return link ? <Link href={link} className="block h-full">{cardContent}</Link> : <div className="h-full">{cardContent}</div>;
}


interface UpdateItemProps {
  post: MockPost;
}

function UpdateItem({ post }: UpdateItemProps) {
  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md border-l-4 border-primary/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-semibold text-primary leading-tight">{post.title}</h3>
          <Badge variant={post.category === "Event" ? "default" : "secondary"} className="text-xs whitespace-nowrap ml-2">{post.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{post.date} {post.branch && post.branch !== "General" ? `(${post.branch})` : ''}</p>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.snippet}</p>
        <Link href={`/feed/${post.id}`} className="text-sm font-medium text-accent hover:text-accent/80 inline-flex items-center">
          Read More <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}


interface QuickLinkItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function QuickLinkItem({ href, icon, label }: QuickLinkItemProps) {
  return (
    <Link href={href} className="flex items-center p-3 -m-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="p-2.5 bg-primary/10 text-primary rounded-lg mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
      <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

// Helper for button variants if needed, or use Button component directly
const ButtonVariants = ({variant = "default", size= "default", className = ""}: {variant?: string, size?:string, className?: string}) => {
  // This is a mock. In real ShadCN, buttonVariants is imported.
  // For now, just returning basic classes.
  let baseClass = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  if (variant === "outline") baseClass += " border border-input bg-background hover:bg-accent hover:text-accent-foreground";
  else baseClass += " bg-primary text-primary-foreground hover:bg-primary/90";
  
  if(size === "sm") baseClass += " h-9 px-3";
  else baseClass += " h-10 px-4 py-2";

  return `${baseClass} ${className}`;
}


interface QuickActionLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// Kept for admin section, can be styled similarly to QuickLinkItem if desired
function QuickActionLink({ href, icon, label }: QuickActionLinkProps) {
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full justify-start text-base py-3">
        {icon}
        {label}
      </Button>
    </Link>
  );
}
