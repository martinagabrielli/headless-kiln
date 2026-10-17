import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/preview/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
