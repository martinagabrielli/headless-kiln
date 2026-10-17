import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NodeView } from "@/components/NodeView";
import { getAllUris, getNodeByUri, getSiteSettings } from "@/lib/content";
import { slugFromUri, uriFromSlug } from "@/lib/content/normalize";
import { buildMetadata } from "@/lib/metadata";

/**
 * Every page and workshop, resolved by URI.
 *
 * WordPress owns the URL structure: nodeByUri finds whatever lives at a path,
 * so a new page or a changed slug needs no frontend change. Known pages are
 * built ahead of time; new ones render on first request and are then cached.
 */

type Params = { slug?: string[] };

export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const uris = await getAllUris();
    return uris.map((uri) => ({ slug: slugFromUri(uri) }));
  } catch (error) {
    // Build without WordPress: pages render on first request instead.
    console.warn("Could not list pages at build time", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const uri = uriFromSlug((await params).slug);
  const [node, settings] = await Promise.all([getNodeByUri(uri), getSiteSettings()]);
  return node ? buildMetadata(node, settings) : {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const uri = uriFromSlug((await params).slug);
  const node = await getNodeByUri(uri);
  if (!node) notFound();
  return <NodeView node={node} />;
}
