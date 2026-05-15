import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default Server Action body limit is 1MB; community posts allow images up to 5MB each.
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
