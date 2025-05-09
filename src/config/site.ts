
import type { LucideIcon } from 'lucide-react';
import { Newspaper, LayoutDashboard, Settings, UserCircle, BarChart3, FilePlus2, Users, Home, Archive as ArchiveIcon } from 'lucide-react';
import React from 'react'; 

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

export const SiteConfigData: SiteConfig = {
  name: "APSConnect",
  description: "A modern platform for college communication and engagement for APS.",
  url: "https://apsconnect.example.com", 
  ogImage: "https://apsconnect.example.com/og.jpg", 
  LATEST_APP_VERSION: "1.0.2", 
  mainNav: [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
    {
      title: "Admin Dashboard",
      href: "/admin",
      protected: true,
      adminOnly: true,
      icon: Settings, 
    },
    {
      title: "Faculty Dashboard", 
      href: "/faculty", 
      protected: true,
      facultyOnly: true, 
      icon: UserCircle, 
    },
    {
      title: "Student Dashboard",
      href: "/student",
      protected: true,
      studentOnly: true, 
      icon: LayoutDashboard, 
    },
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

export { SiteConfigData as SiteConfig };


export const PrivacyPolicyPage = (): React.ReactElement => {
  return React.createElement(
    'div',
    { className: "container mx-auto px-4 py-8" },
    React.createElement('h1', { className: "text-3xl font-bold mb-4" }, 'Privacy Policy'),
    React.createElement(
      'p',
      null,
      'Details about how user data is handled will go here. This is a placeholder for APSConnect.'
    )
  );
};

export const TermsOfServicePage = (): React.ReactElement => {
  return React.createElement(
    'div',
    { className: "container mx-auto px-4 py-8" },
    React.createElement('h1', { className: "text-3xl font-bold mb-4" }, 'Terms of Service'),
    React.createElement(
      'p',
      null,
      'The terms and conditions for using APSConnect will be detailed here. This is a placeholder.'
    )
  );
};
