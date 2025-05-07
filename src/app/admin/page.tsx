"use client";

// import { useAuth } from "@/components/auth-provider"; // Replace with actual auth
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BellDot, FilePlus2, Users, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";

// Mock user data for UI development
interface MockUser {
  displayName: string | null;
  role: 'admin' | 'student' | 'pending';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  // const { user, isLoading } = useAuth(); // Replace with actual auth hook
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Forcing admin role for this page's UI dev
      setUser({ displayName: parsedUser.name || "Admin User", role: 'admin' });
    } else {
       // If no mock user, default to admin for UI purposes of this page
      setUser({ displayName: "Admin User", role: 'admin' });
    }
    setIsLoading(false);
  }, []);


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-1/2 rounded bg-muted"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 rounded-lg bg-muted"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    // In a real app, this would be handled by route protection / middleware
    // router.push('/login'); // or '/unauthorized'
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">You do not have permission to view this page.</p>
                <Link href="/dashboard">
                    <Button variant="outline" className="mt-6">Go to Dashboard</Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    );
  }

  const adminStats = [
    { title: "Total Users", value: "1250", icon: <Users className="h-8 w-8 text-primary" />, dataAiHint: "group people" },
    { title: "Pending Approvals", value: "15", icon: <BellDot className="h-8 w-8 text-primary" />, dataAiHint: "notification bell" },
    { title: "Content Posts", value: "280", icon: <FilePlus2 className="h-8 w-8 text-primary" />, dataAiHint: "document plus" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage CampusConnect content, users, and settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {adminStats.map(stat => (
          <Card key={stat.title} className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
               <Image 
                src={`https://picsum.photos/seed/${stat.title.replace(/\s+/g, '-')}/200/100`} 
                alt={stat.title} 
                width={200} 
                height={100} 
                className="mt-2 rounded-md object-cover w-full aspect-[2/1]"
                data-ai-hint={stat.dataAiHint} 
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminActionCard
          title="User Management"
          description="View, approve, and manage student and faculty accounts."
          icon={<Users className="h-10 w-10 text-accent" />}
          link="/admin/users"
          actionText="Manage Users"
          dataAiHint="users list"
        />
        <AdminActionCard
          title="Content Creation"
          description="Post news, events, notes, and schedules for specific branches."
          icon={<FilePlus2 className="h-10 w-10 text-accent" />}
          link="/admin/posts/new"
          actionText="Create New Post"
          dataAiHint="writing document"
        />
        <AdminActionCard
          title="Pending Approvals"
          description="Review and approve new user registrations."
          icon={<BellDot className="h-10 w-10 text-accent" />}
          link="/admin/approvals"
          actionText="View Approvals"
          dataAiHint="checklist approval"
        />
        <AdminActionCard
          title="Branch Management"
          description="Define and manage college branches (CSE, ISE, etc.)."
          icon={<BarChart3 className="h-10 w-10 text-accent" />}
          link="/admin/branches"
          actionText="Manage Branches"
          dataAiHint="organization chart"
        />
        <AdminActionCard
          title="Site Settings"
          description="Configure general application settings and preferences."
          icon={<Settings className="h-10 w-10 text-accent" />}
          link="/admin/settings"
          actionText="Configure Settings"
          dataAiHint="gears settings"
        />
         <AdminActionCard
          title="View All Content"
          description="Browse and manage all posted content across branches."
          icon={<FileText className="h-10 w-10 text-accent" />}
          link="/admin/posts"
          actionText="Manage Content"
          dataAiHint="files folder"
        />
      </div>
    </div>
  );
}

interface AdminActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  actionText: string;
  dataAiHint: string;
}

function AdminActionCard({ title, description, icon, link, actionText, dataAiHint }: AdminActionCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-3 bg-accent/10 rounded-full">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <Image 
            src={`https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/300/180`} 
            alt={title} 
            width={300} 
            height={180} 
            className="mb-4 rounded-md object-cover w-full aspect-[16/9]"
            data-ai-hint={dataAiHint}
        />
        <Link href={link} className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {actionText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
