import type { Metadata } from "next";
import type { BlockData, ContentNode, ImageData, SiteSettings } from "@/lib/content/types";
import { env } from "@/lib/env";

/** First image in a page's blocks, for social sharing cards. */
export function findShareImage(blocks: BlockData[]): ImageData | null {
  for (const block of blocks) {
    const image = block.fields.image;
    if (image && typeof image === "object" && "url" in image) return image as ImageData;
  }
  return null;
}

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${env.siteUrl}${path}`;
}

export function buildMetadata(node: ContentNode, settings: SiteSettings): Metadata {
  const isHome = node.uri === "/";
  const title = node.seo.title ?? node.title;
  const description =
    node.seo.description ?? (node.kind === "workshop" ? node.workshop.summary : null) ?? settings.description;
  const image = node.kind === "workshop" ? node.workshop.image : findShareImage(node.blocks);
  const url = absoluteUrl(node.uri);

  return {
    // The home page's SEO title is complete; others get " | Kiln Studio" from the layout template.
    title: isHome ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: settings.title,
      images: image ? [{ url: absoluteUrl(image.url), width: image.width, height: image.height, alt: image.alt }] : [],
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}
