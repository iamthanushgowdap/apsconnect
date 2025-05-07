
"use client";

import { Button, buttonVariants } from "@/components/ui/button";
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
  CheckSquare,
  UserCircle,
  Briefcase // Icon for faculty
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { useAuth } from "@/components/auth-provider";

interface MockUserFromAuth { 
  displayName: string | null;
  email: string | null;
  role: 'student' | 'admin' | 'pending' | 'faculty'; // Added faculty
  branch?: string;
  usn?: string;
}

interface MockPost {
  id: string;
  title: string;
  category: "Schedule" | "Event" | "News" | "Notes";
  date: string;
  snippet: string;
  branch?: string; 
}

const mockPosts: MockPost[] = [
  { id: "1", title: "Mid-term Exam Schedule Released", category: "Schedule", date: "Oct 28, 2023", snippet: "The schedule for the upcoming mid-term examinations has been published for all branches...", branch: "General" },
  { id: "2", title: "Guest Lecture on AI Ethics (CSE)", category: "Event", date: "Oct 25, 2023", snippet: "Join us for an insightful guest lecture on the ethical implications of AI. Open to CSE students.", branch: "CSE" },
  { id: "3", title: "Library System Maintenance", category: "News", date: "Oct 22, 2023", snippet: "The library's online portal will be down for maintenance this weekend from Sat 6 PM to Sun 6 AM." },
  { id: "4", title: "Advanced Java Programming Notes (ISE)", category: "Notes", date: "Oct 20, 2023", snippet: "Chapter 3 & 4 notes for Advanced Java Programming have been uploaded for ISE students.", branch: "ISE"},
];


export default function DashboardPage() {
  const router = useRouter(); 
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<MockUserFromAuth | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        setUser(authUser as MockUserFromAuth); // Cast authUser to MockUserFromAuth
      } else {
        setUser(null); 
        router.push('/login'); 
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading, router]);
  
  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-1/2 sm:w-1/3 rounded bg-muted mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-lg bg-muted"></div>)}
          </div>
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
            <CardTitle className="text-primary text-xl sm:text-2xl">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Image 
              src="https://picsum.photos/seed/pending-approval/400/250" 
              alt="Pending approval illustration" 
              width={400} 
              height={250} 
              className="mx-auto mb-6 rounded-lg shadow-md w-full max-w-xs sm:max-w-sm md:max-w-md"
              data-ai-hint="waiting hourglass" 
            />
            <p className="text-lg sm:text-xl text-foreground">
              Welcome, {user.displayName || "User"}!
            </p>
            {user.usn && <p className="text-md text-muted-foreground">USN: {user.usn}</p>}
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

  const userBranchFromUsn = user.role === 'student' && user.usn ? user.usn.substring(5, 7) : user.branch;
  const userBranchPosts = mockPosts.filter(post => 
    user.role === 'faculty' || user.role === 'admin' || // Faculty/Admin see all posts or general posts
    !post.branch || post.branch === "General" || post.branch === userBranchFromUsn
  );

  const getRoleSpecificGreeting = () => {
    if (user.role === 'faculty') {
      return `Welcome to your Faculty Dashboard.`;
    }
    if (user.role === 'admin') {
      return `Welcome to your Admin Access Dashboard.`
    }
    return `Welcome to your ${userBranchFromUsn ? `${userBranchFromUsn} ` : ''}Dashboard.`;
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
           {user.email && (user.role === 'faculty' || user.role === 'admin') && <span className="block text-sm sm:text-base">Email: {user.email}</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard 
          title="Notifications" 
          value="3 New" 
          icon={<Bell className="h-5 w-5 sm:h-6 sm:w-6" />} 
          description="Check your latest alerts"
          link="#" 
          dataAiHint="bell icon"
          colorConfig="bg-red-500/10 text-red-500"
        />
        <StatCard 
          title={user.role === 'faculty' ? "My Classes" : "Upcoming Deadlines"} 
          value={user.role === 'faculty' ? "3 Sections" : "2 Tasks"} 
          icon={user.role === 'faculty' ? <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" /> : <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6" />} 
          description={user.role === 'faculty' ? "Manage your course sections" : "Assignments & Submissions"}
          link="#" 
          dataAiHint={user.role === 'faculty' ? "teacher classroom" : "checklist tasks"}
          colorConfig="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard 
          title="My Courses" 
          value="4 Active" 
          icon={<GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />} 
          description="Access your course materials"
          link="#" 
          dataAiHint="graduation cap"
          colorConfig="bg-green-500/10 text-green-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Recent Updates {userBranchFromUsn && user.role === 'student' ? `for ${userBranchFromUsn}`: ''}</CardTitle>
              <CardDescription>Latest posts relevant to you {user.role === 'student' && 'and your branch'}.</CardDescription>
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

        <div className="lg:col-span-1 space-y-8">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.role === 'student' && <QuickLinkItem href="/academics/schedule" icon={<CalendarDays className="h-5 w-5"/>} label="Class Schedule" />}
              {user.role === 'faculty' && <QuickLinkItem href="/faculty/courses" icon={<Briefcase className="h-5 w-5"/>} label="My Courses" />}
              <QuickLinkItem href="/resources/library" icon={<BookOpen className="h-5 w-5"/>} label="Library Portal" />
              <QuickLinkItem href="/profile/settings" icon={<Settings className="h-5 w-5"/>} label="Profile Settings" />
              <QuickLinkItem href="/feed" icon={<LayoutGrid className="h-5 w-5"/>} label="Full Activity Feed" />
            </CardContent>
          </Card>

          {user.role === 'admin' && (
            <Card className="shadow-lg bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-primary">Admin Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <QuickActionLink href="/admin/users" icon={<Users className="h-5 w-5 mr-2" />} label="Manage Users" />
                <QuickActionLink href="/admin/posts/new" icon={<FileText className="h-5 w-5 mr-2" />} label="Create Post" />
                <QuickActionLink href="/admin/approvals" icon={<Bell className="h-5 w-5 mr-2" />} label="Pending Approvals" />
                <QuickActionLink href="/admin" icon={<UserCircle className="h-5 w-5 mr-2"/>} label="Admin Dashboard" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  link?: string;
  dataAiHint: string;
  description?: string;
  colorConfig?: string; // Changed from color to colorConfig to avoid conflict with HTML color attribute
}

function StatCard({ title, value, icon, link, dataAiHint, description, colorConfig = "bg-accent/10 text-accent" }: StatCardProps) {
  const cardContent = (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-semibold text-foreground">{title}</CardTitle>
        <div className={`p-2 sm:p-2.5 rounded-lg ${colorConfig}`}>{icon}</div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-primary">{value}</div>
          {description && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>}
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
        <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
          <h3 className="text-base sm:text-lg font-semibold text-primary leading-tight mb-1 sm:mb-0">{post.title}</h3>
          <Badge variant={post.category === "Event" ? "default" : "secondary"} className="text-xs whitespace-nowrap ml-0 sm:ml-2 self-start sm:self-center">{post.category}</Badge>
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
      <div className="p-2 sm:p-2.5 bg-primary/10 text-primary rounded-lg mr-3 sm:mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">{label}</span>
      <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}


interface QuickActionLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function QuickActionLink({ href, icon, label }: QuickActionLinkProps) {
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full justify-start text-sm sm:text-base py-2.5 sm:py-3">
        {icon}
        {label}
      </Button>
    </Link>
  );
}

