import type { NavItem as OriginalNavItem } from '@/types'; // Assuming NavItem might be in types
import { Newspaper } from 'lucide-react'; // Import icon

// Redefine NavItem here if it's specific to SiteConfig or ensure it's imported correctly
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  protected?: boolean; 
  adminOnly?: boolean; 
  facultyOnly?: boolean; 
  studentOnly?: boolean; 
  hideWhenLoggedIn?: boolean; 
  icon?: React.ComponentType<{ className?: string }>;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: NavItem[];
  footerNav?: NavItem[];
};

export const SiteConfig: SiteConfig = {
  name: "CampusConnect",
  description: "A modern platform for college communication and engagement.",
  url: "https://campusconnect.example.com", 
  ogImage: "https://campusconnect.example.com/og.jpg", 
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Campus Feed",
      href: "/feed",
      protected: true, // Visible to all logged-in users
      icon: Newspaper,
    },
    {
      title: "Admin Dashboard",
      href: "/admin",
      protected: true,
      adminOnly: true,
    },
    {
      title: "Faculty Dashboard", 
      href: "/faculty", 
      protected: true,
      facultyOnly: true, 
    },
    {
      title: "Student Dashboard",
      href: "/student",
      protected: true,
      studentOnly: true, 
    }
  ],
  footerNav: [
    {
      title: "Privacy Policy",
      href: "/privacy",
    },
    {
      title: "Terms of Service",
      href: "/terms",
    },
  ],
};