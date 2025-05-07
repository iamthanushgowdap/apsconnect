"use client"; 

import { Button, buttonVariants } from "@/components/ui/button";
import { SiteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, CalendarDays, Newspaper, Rocket } from "lucide-react"; 
import Link from "next/link";
import { useAuth } from "@/components/auth-provider"; 
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { DownloadAppSection } from "@/components/layout/download-app-section";

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-primary/10 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-xs sm:text-sm">{description}</p>
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth(); 

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
      <section className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary">
          Welcome to {SiteConfig.name}
        </h1>
        <p className="mt-4 sm:mt-6 max-w-md sm:max-w-lg md:max-w-2xl mx-auto text-md sm:text-lg md:text-xl text-muted-foreground">
          Your central hub for all college-related information, events, and resources. Stay connected, stay informed.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-11 w-36 sm:h-12 sm:w-40 rounded-md" />
              <Skeleton className="h-11 w-24 sm:h-12 sm:w-28 rounded-md" />
            </>
          ) : user ? (
            <Link 
              href="/dashboard" 
              className={cn(buttonVariants({ size: "lg", className: "bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" }))}
            >
              Go to Dashboard <Rocket className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link href="/register" className={cn(buttonVariants({ size: "lg", className: "bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" }))}>
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" }))}>
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-12 md:mt-16 lg:mt-24">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Why CampusConnect?</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">Discover the features that make college life easier.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <FeatureCard
            icon={<Newspaper className="h-8 w-8 md:h-10 md:w-10 text-primary" />}
            title="Latest News & Announcements"
            description="Never miss important updates from the college administration and various departments."
          />
          <FeatureCard
            icon={<CalendarDays className="h-8 w-8 md:h-10 md:w-10 text-primary" />}
            title="Event Schedules"
            description="Keep track of upcoming workshops, seminars, cultural fests, and sports events."
          />
          <FeatureCard
            icon={<BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary" />}
            title="Academic Resources"
            description="Access notes, important links, and schedules shared by faculty and departments."
          />
        </div>
      </section>

      <section className="mt-12 md:mt-16 lg:mt-24 py-10 md:py-12 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Join Your Community</h2>
            <p className="mt-3 sm:mt-4 max-w-md sm:max-w-xl mx-auto text-sm sm:text-base text-muted-foreground">
                Connect with students from your branch, share information, and collaborate on projects.
                CampusConnect fosters a supportive and interactive environment.
            </p>
        </div>
      </section>
      <DownloadAppSection />
    </div>
  );
}
