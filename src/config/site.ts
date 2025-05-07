
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  protected?: boolean; // Requires login (any role)
  adminOnly?: boolean; // Requires admin role
  facultyOnly?: boolean; // Requires faculty role
  studentOnly?: boolean; // Requires student role or pending role
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
      title: "Campus Feed",
      href: "/feed",
      // public or protected based on app logic, assume public for now or protected
      // protected: true, 
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
    // {
    //   title: "Student Dashboard",
    //   href: "/student",
    //   protected: true,
    //   studentOnly: true, // This will show for 'student' and 'pending' roles
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

