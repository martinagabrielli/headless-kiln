import type { MetadataRoute } from "next";
import { getAllUris } from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const uris = await getAllUris().catch(() => ["/"]);
  return uris.map((uri) => ({ url: absoluteUrl(uri), changeFrequency: "weekly" }));
}
