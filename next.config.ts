import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb", "mariadb"],
  poweredByHeader: false,
  compress: true,
  images: {
    // File upload runtime tidak bisa di-optimize /_next/image (400).
    // Di VPS, serve langsung dari /public lebih andal.
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
