
"use client";
import type { ReactNode } from 'react';

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar is already in RootLayout */}
      <div className="flex flex-1">
        {/* No explicit sidebar here, pages will manage their own content structure */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}