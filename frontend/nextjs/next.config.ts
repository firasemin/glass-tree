import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", 
  
  async rewrites() {
    return [
      {
        source: "/tree/:path*",
        destination: "http://backend:8080/tree/:path*",
      },
    ];
  },
};

export default nextConfig;
