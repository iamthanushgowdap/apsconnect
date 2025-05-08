"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Settings } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push(user ? '/dashboard' : '/login');
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Site Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configure general application settings and preferences.
            </p>
          </div>
        </div>
         <Link href="/admin">
            <Button variant="outline">Back to Admin Dashboard</Button>
          </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configuration Options</CardTitle>
          <CardDescription>
            This area will allow administrators to manage various site-wide settings.
            (Feature under development)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <h3 className="font-semibold text-lg mb-2">Theme Customization</h3>
              <p className="text-sm text-muted-foreground">
                Options to change site colors, logo, and overall appearance.
              </p>
            </div>
            <div className="p-4 border rounded-md bg-muted/50">
              <h3 className="font-semibold text-lg mb-2">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage email templates, notification triggers, and integrated services.
              </p>
            </div>
            <div className="p-4 border rounded-md bg-muted/50">
              <h3 className="font-semibold text-lg mb-2">Feature Flags</h3>
              <p className="text-sm text-muted-foreground">
                Enable or disable specific features across the application.
              </p>
            </div>
             <div className="p-4 border rounded-md bg-muted/50">
              <h3 className="font-semibold text-lg mb-2">Maintenance Mode</h3>
              <p className="text-sm text-muted-foreground">
                Put the site into maintenance mode for updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
