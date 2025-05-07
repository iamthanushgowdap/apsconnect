
import type { LucideIcon } from 'lucide-react';
import { Newspaper, LayoutDashboard, Settings, UserCircle, BarChart3, FilePlus2, Users, Home, LogIn, UserPlus } from 'lucide-react'; // Import icons

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
  icon?: LucideIcon;
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
  LATEST_APP_VERSION: string;
};

export const SiteConfig: SiteConfig = {
  name: "CampusConnect",
  description: "A modern platform for college communication and engagement.",
  url: "https://campusconnect.example.com", 
  ogImage: "https://campusconnect.example.com/og.jpg", 
  LATEST_APP_VERSION: "1.0.1", // Used for app update notifications
  mainNav: [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
    // {
    //   title: "Campus Feed",
    //   href: "/feed",
    //   protected: true, // Visible to all logged-in users
    //   icon: Newspaper,
    // },
    {
      title: "Admin Dashboard",
      href: "/admin",
      protected: true,
      adminOnly: true,
      icon: Settings, // Changed from LayoutDashboard to Settings for Admin
    },
    {
      title: "Faculty Dashboard", 
      href: "/faculty", 
      protected: true,
      facultyOnly: true, 
      icon: UserCircle, // Icon for faculty
    },
    {
      title: "Student Dashboard",
      href: "/student",
      protected: true,
      studentOnly: true, 
      icon: LayoutDashboard, // Icon for student
    },
    {
      title: "Login",
      href: "/login",
      hideWhenLoggedIn: true,
      icon: LogIn,
    },
    {
      title: "Register",
      href: "/register",
      hideWhenLoggedIn: true,
      icon: UserPlus,
    },

  ],
  footerNav: [
    {
      title: "Privacy Policy",
      href: "/privacy", // These should ideally be actual pages
    },
    {
      title: "Terms of Service",
      href: "/terms", // These should ideally be actual pages
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
