import { Button, buttonVariants } from "@/components/ui/button";
import { SiteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, CalendarDays, Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
          Welcome to {SiteConfig.name}
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
          Your central hub for all college-related information, events, and resources. Stay connected, stay informed.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className={cn(buttonVariants({ size: "lg", className: "bg-accent hover:bg-accent/90 text-accent-foreground" }))}>
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Login
          </Link>
        </div>
      </section>

      <section className="mt-16 md:mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight">Why CampusConnect?</h2>
          <p className="mt-2 text-muted-foreground">Discover the features that make college life easier.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Newspaper className="h-10 w-10 text-primary" />}
            title="Latest News & Announcements"
            description="Never miss important updates from the college administration and various departments."
            dataAiHint="news paper"
          />
          <FeatureCard
            icon={<CalendarDays className="h-10 w-10 text-primary" />}
            title="Event Schedules"
            description="Keep track of upcoming workshops, seminars, cultural fests, and sports events."
            dataAiHint="calendar schedule"
          />
          <FeatureCard
            icon={<BookOpen className="h-10 w-10 text-primary" />}
            title="Academic Resources"
            description="Access notes, important links, and schedules shared by faculty and departments."
            dataAiHint="open book"
          />
        </div>
      </section>

      <section className="mt-16 md:mt-24 py-12 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Join Your Community</h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                Connect with students from your branch, share information, and collaborate on projects.
                CampusConnect fosters a supportive and interactive environment.
            </p>
            <Image 
              src="https://picsum.photos/800/400" 
              alt="Community engagement" 
              width={800} 
              height={400} 
              className="mt-8 rounded-lg mx-auto shadow-md"
              data-ai-hint="students collaborating"
            />
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  dataAiHint: string;
}

function FeatureCard({ icon, title, description, dataAiHint }: FeatureCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
      <div className="mb-4 p-3 bg-primary/10 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Image 
        src={`https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/300/200`} 
        alt={title} 
        width={300} 
        height={200} 
        className="mt-4 rounded-md object-cover aspect-[3/2]"
        data-ai-hint={dataAiHint}
      />
    </div>
  );
}
