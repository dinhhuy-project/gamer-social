import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // require here so CI/Vercel installs the package before this file loads
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')
      config.plugins = [...(config.plugins ?? []), new PrismaPlugin()]
    }

    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
