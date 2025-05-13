import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,  // Set to 'false' to ensure TS checks are enforced in build
  },
  eslint: {
    ignoreDuringBuilds: false,  // Ensure ESLint runs during builds
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;





















export default nextConfig;
