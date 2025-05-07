
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] px-4 py-12 text-center">
      <div className="max-w-md">
        <Image
          src="https://picsum.photos/600/400" // Placeholder for the 404 image
          alt="Page Not Found Illustration"
          width={600}
          height={400}
          className="rounded-lg shadow-lg mb-8"
          data-ai-hint="error page"
        />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold text-destructive mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-3">Oops! Page Not Found</h2>
      <p className="text-md md:text-lg text-muted-foreground mb-8 max-w-lg">
        It looks like the page you were searching for has ventured into the unknown.
        Let&apos;s get you back on track.
      </p>
      <Link href="/">
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <HomeIcon className="mr-2 h-5 w-5" />
          Go to Homepage
        </Button>
      </Link>
    </div>
  );
}
