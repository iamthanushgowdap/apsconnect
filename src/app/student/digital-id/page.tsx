"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, User } from '@/components/auth-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, AlertTriangle, ArrowLeft, QrCode } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { SiteConfig } from '@/config/site';
import { getInitials } from '@/components/content/post-item-utils';
import { format } from 'date-fns';

// Simple SVG QR Code Placeholder
const QrCodePlaceholder = ({ value }: { value: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full" data-ai-hint="qr code">
    <rect width="100" height="100" fill="#f0f0f0" />
    <text x="50" y="50" fontSize="10" textAnchor="middle" dominantBaseline="middle" fill="#333">
      QR: {value.length > 15 ? value.substring(0, 15) + "..." : value}
    </text>
    {/* Simplified pattern to look like a QR code */}
    {[0, 1, 2, 6, 7, 8].map(i => 
      [0, 1, 2, 6, 7, 8].map(j => (
        ((i < 3 && j < 3) || (i < 3 && j > 5) || (i > 5 && j < 3) || (Math.random() > 0.4 && i>0 && i<8 && j>0 && j<8 )) &&
        <rect key={`${i}-${j}`} x={i*10 + 5} y={j*10 + 5} width="8" height="8" fill={((i < 3 && j < 3) || (i < 3 && j > 5) || (i > 5 && j < 3)) ? "#000" : (Math.random() > 0.5 ? "#333" : "#666")} />
      ))
    )}
  </svg>
);


export default function DigitalIdPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [issuedDate, setIssuedDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');


  useEffect(() => {
    if (!authLoading) {
      if (authUser && (authUser.role === 'student' || authUser.role === 'pending')) {
        setStudentUser(authUser);

        // Mock dates - in a real app, these would come from user profile or be calculated
        const today = new Date();
        setIssuedDate(format(today, "dd MMM yyyy"));
        const expiry = new Date(today);
        expiry.setFullYear(today.getFullYear() + 4); // Example: ID valid for 4 years
        setExpiryDate(format(expiry, "dd MMM yyyy"));
        
      } else if (authUser) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!studentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        {/* This should ideally not be reached if redirection works */}
        <p>Loading user data or redirecting...</p>
      </div>
    );
  }
  
  if (studentUser.role === 'pending' && !studentUser.rejectionReason) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg border-yellow-400">
                <CardHeader><CardTitle className="text-yellow-600 text-xl sm:text-2xl flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6" />Account Pending</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-md sm:text-lg text-muted-foreground">
                        Your Digital ID will be available once your account is approved.
                    </p>
                    <Link href="/student"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (studentUser.role === 'pending' && studentUser.rejectionReason) {
     return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg border-red-400">
                <CardHeader><CardTitle className="text-red-600 text-xl sm:text-2xl flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6" />Account Rejected</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-md sm:text-lg text-muted-foreground">
                        Your Digital ID is not available as your registration was rejected. Reason: {studentUser.rejectionReason}
                    </p>
                    <Link href="/student"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto px-2 py-8 flex flex-col items-center">
      <div className="w-full max-w-sm mb-6">
         <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      <Card className="w-full max-w-sm shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-primary/80 to-accent/70 text-primary-foreground">
        <CardHeader className="p-5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {/* Placeholder for College Logo */}
                <div className="bg-white p-1 rounded-full">
                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-ai-hint="college logo"><path d="M12 2L1 9l11 7 11-7L12 2zm0 12.5L5.31 10.49 12 6.99l6.69 3.5L12 14.5zM3.51 11.72L12 16.99l8.49-5.27L12 20l-8.49-5.28z"/></svg>
                </div>
                 <CardTitle className="text-xl font-bold">{SiteConfig.name}</CardTitle>
            </div>
            <ShieldCheck className="h-7 w-7 text-green-300" />
          </div>
          <CardDescription className="text-primary-foreground/80 text-xs uppercase tracking-wider mt-1">Student Identity Card</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24 border-4 border-white/50 shadow-md">
              <AvatarImage src={studentUser.avatarDataUrl} alt={studentUser.displayName || "Student Avatar"} data-ai-hint="student photo"/>
              <AvatarFallback className="text-3xl bg-black/30 text-white">
                {getInitials(studentUser.displayName || studentUser.usn)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-2xl font-semibold leading-tight">{studentUser.displayName || "N/A"}</p>
              <p className="text-sm text-primary-foreground/90">{studentUser.usn || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="font-semibold text-primary-foreground/80">Branch:</p>
              <p>{studentUser.branch || "N/A"}</p>
            </div>
            <div>
              <p className="font-semibold text-primary-foreground/80">Semester:</p>
              <p>{studentUser.semester || "N/A"}</p>
            </div>
             <div>
              <p className="font-semibold text-primary-foreground/80">Issued On:</p>
              <p>{issuedDate}</p>
            </div>
            <div>
              <p className="font-semibold text-primary-foreground/80">Valid Till:</p>
              <p>{expiryDate}</p>
            </div>
          </div>
          
          <div className="mt-4 p-2 bg-white rounded-md shadow-inner">
            <div className="w-32 h-32 mx-auto">
             <QrCodePlaceholder value={studentUser.usn || studentUser.uid} />
            </div>
          </div>
          <p className="text-xs text-center text-primary-foreground/70 mt-3">
            This card is for identification and access to college facilities.
            Use responsibly. For issues, contact administration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

