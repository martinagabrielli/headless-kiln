import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

/**
 * WordPress media is served from the WordPress origin, so next/image is
 * allowed to optimise images from there. The origin comes from
 * GRAPHQL_ENDPOINT, so there's no list of hostnames to keep in step.
 */
function wordpressImages(): RemotePattern[] {
  const endpoint = process.env.GRAPHQL_ENDPOINT;
  if (!endpoint) return [];
  const { protocol, hostname, port } = new URL(endpoint);
  return [
    {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      port,
      pathname: "/wp-content/uploads/**",
    },
  ];
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // WordPress URIs end in a slash; matching them avoids a redirect on every link.
  trailingSlash: true,
  images: {
    remotePatterns: wordpressImages(),
    formats: ["image/avif", "image/webp"],
    // Local WordPress runs on localhost, which next/image blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
