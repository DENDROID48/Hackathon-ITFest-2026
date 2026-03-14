import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" }, // Am adăugat domeniul sigur
    ],
    dangerouslyAllowSVG: true, // Placehold.co folosește uneori SVG-uri
  },
};

export default nextConfig;