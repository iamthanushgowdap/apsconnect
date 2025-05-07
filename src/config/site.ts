import type { NavItem as OriginalNavItem } from '@/types'; // Assuming NavItem might be in types
import { Newspaper, LayoutDashboard, Settings, UserCircle, BarChart3, FilePlus2, Users } from 'lucide-react'; // Import icons

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
  adminSidebarNav?: NavItem[];
  facultySidebarNav?: NavItem[];
  studentSidebarNav?: NavItem[];
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
    // Campus Feed removed from mainNav, will be in user dropdown
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
  adminSidebarNav: [
    { title: "Overview", href: "/admin", icon: LayoutDashboard },
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Create Post", href: "/admin/posts/new", icon: FilePlus2 },
    { title: "Branch Management", href: "/admin/branches", icon: BarChart3 },
    { title: "Site Settings", href: "/admin/settings", icon: Settings },
    { title: "My Profile", href: "/profile/settings", icon: UserCircle },
  ],
  facultySidebarNav: [
    { title: "Dashboard", href: "/faculty", icon: LayoutDashboard },
    { title: "Manage Students", href: "/faculty/user-management", icon: Users },
    { title: "Create Content", href: "/faculty/content/new", icon: FilePlus2 },
    { title: "My Profile", href: "/profile/settings", icon: UserCircle },
  ],
  studentSidebarNav: [
    { title: "Dashboard", href: "/student", icon: LayoutDashboard },
    { title: "My Profile", href: "/profile/settings", icon: UserCircle },
  ],
};
