
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  protected?: boolean; // Requires login (any role)
  adminOnly?: boolean; // Requires admin role
  facultyOnly?: boolean; // Requires faculty role
  studentOnly?: boolean; // Requires student role
  hideWhenLoggedIn?: boolean; // Hide this link if user is logged in
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
  url: "https://campusconnect.example.com", // Replace with actual URL
  ogImage: "https://campusconnect.example.com/og.jpg", // Replace with actual OG image
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      protected: true, 
    },
    {
      title: "Campus Feed",
      href: "/feed",
      // public or protected based on app logic, assume public for now or protected
      // protected: true, 
    },
    {
      title: "Faculty Dashboard", 
      href: "/faculty", 
      protected: true,
      facultyOnly: true, 
    }
    // {
    //   title: "Create Post (Admin)", // Example of a more specific link if needed
    //   href: "/admin/posts/new",
    //   protected: true,
    //   adminOnly: true,
    // },
    // {
    //   title: "Create Post (Faculty)", // Example
    //   href: "/faculty/content/new",
    //   protected: true,
    //   facultyOnly: true,
    // }
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

