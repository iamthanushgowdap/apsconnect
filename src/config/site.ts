export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  protected?: boolean; // Requires login
  adminOnly?: boolean; // Requires admin role
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
      title: "Admin",
      href: "/admin",
      protected: true,
      adminOnly: true,
    },
    // Add more links like "Events", "News" later
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
