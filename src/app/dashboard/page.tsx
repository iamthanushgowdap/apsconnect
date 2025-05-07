"use client";

// import { useAuth } from "@/components/auth-provider"; // Replace with actual auth
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bell, FileText, MessageSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";

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
  category: string;
  date: string;
  snippet: string;
}

const mockPosts: MockPost[] = [
  { id: "1", title: "Mid-term Exam Schedule Released", category: "Schedule", date: "2 days ago", snippet: "The schedule for the upcoming mid-term examinations has been published..." },
  { id: "2", title: "Guest Lecture on AI Ethics", category: "Event", date: "5 days ago", snippet: "Join us for an insightful guest lecture on the ethical implications of AI..." },
  { id: "3", title: "Library System Maintenance", category: "News", date: "1 week ago", snippet: "The library's online portal will be down for maintenance this weekend..." },
];


export default function DashboardPage() {
  // const { user, isLoading } = useAuth(); // Replace with actual auth hook
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        displayName: parsedUser.name || "Student User",
        email: parsedUser.email || "student@example.com",
        role: parsedUser.role || "student",
        branch: parsedUser.branch || "CSE",
      });
    } else {
      // If no mock user, default to a student for UI purposes
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
          <div className="h-10 w-1/3 rounded bg-muted"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-lg bg-muted"></div>)}
          </div>
          <div className="h-64 rounded-lg bg-muted"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by route protection in a real app
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
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <Image 
              src="https://picsum.photos/seed/pending-approval/400/250" 
              alt="Pending approval illustration" 
              width={400} 
              height={250} 
              className="mx-auto mb-6 rounded-md"
              data-ai-hint="waiting hourglass" 
            />
            <p className="text-lg text-muted-foreground">
              Welcome, {user.displayName || "User"}! Your account registration has been submitted and is currently awaiting admin approval.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              You will receive a notification once your account is approved. Please check back later.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { /* Potentially call a logout function */ router.push('/'); }}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
        Welcome, {user.displayName || "User"}!
      </h1>
      <p className="text-muted-foreground mb-8">Here's what's happening on CampusConnect.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardWidget title="Notifications" icon={<Bell className="h-6 w-6 text-accent" />} value="3 New" link="#" dataAiHint="bell icon" />
        <DashboardWidget title="Upcoming Events" icon={<BarChart className="h-6 w-6 text-accent" />} value="5 Events" link="#" dataAiHint="calendar events" />
        <DashboardWidget title="My Branch Feed" icon={<Users className="h-6 w-6 text-accent" />} value={`${user.branch || 'General'} Feed`} link="#" dataAiHint="group people" />
      </div>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>Latest posts relevant to you.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockPosts.length > 0 ? (
            <ul className="space-y-4">
              {mockPosts.map(post => (
                <li key={post.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-primary">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">{post.snippet}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{post.date}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{post.category}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No new updates at the moment.</p>
          )}
           <div className="mt-6 text-right">
             <Link href="/feed" className="text-sm text-primary hover:underline">View All Updates &rarr;</Link>
           </div>
        </CardContent>
      </Card>
      
      {user.role === 'admin' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Admin Quick Actions</CardTitle>
            <CardDescription>Manage users and content.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <QuickActionLink href="/admin/users" icon={<Users className="h-5 w-5 mr-2" />} label="Manage Users" />
            <QuickActionLink href="/admin/posts/new" icon={<FileText className="h-5 w-5 mr-2" />} label="Create Post" />
            <QuickActionLink href="/admin/approvals" icon={<Bell className="h-5 w-5 mr-2" />} label="Pending Approvals" />
            <QuickActionLink href="/admin/settings" icon={<Settings className="h-5 w-5 mr-2" />} label="Site Settings" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface DashboardWidgetProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  link: string;
  dataAiHint: string;
}

function DashboardWidget({ title, icon, value, link, dataAiHint }: DashboardWidgetProps) {
  return (
    <Link href={link}>
      <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <Image 
            src={`https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/200/100`} 
            alt={title} 
            width={200} 
            height={100} 
            className="mt-2 rounded-md object-cover w-full aspect-[2/1]"
            data-ai-hint={dataAiHint} 
          />
        </CardContent>
      </Card>
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
      <Button variant="outline" className="w-full justify-start">
        {icon}
        {label}
      </Button>
    </Link>
  );
}
