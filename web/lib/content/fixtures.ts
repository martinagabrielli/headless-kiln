import content from "@/content/kiln-studio.json";
import { normalizeUri } from "./normalize";
import type {
  BlockData,
  ContentNode,
  ContentSource,
  ImageData,
  WorkshopLevel,
  WorkshopSummary,
} from "./types";

/**
 * The bundled demo content, shaped exactly like the WordPress source's output.
 *
 * content/kiln-studio.json is also what the WordPress seed script imports, so
 * this site and a freshly seeded WordPress show the same pages. In the JSON,
 * images are referenced by key ("image": "shelf") and resolved here to the
 * files in public/demo/.
 */

type ContentFile = typeof content;
type ImageKey = keyof ContentFile["images"];
type RawBlock = { name: string; anchor?: string; fields: Record<string, unknown> };

function image(key: string | null | undefined): ImageData | null {
  if (!key || !(key in content.images)) return null;
  const entry = content.images[key as ImageKey];
  return { url: `/demo/${entry.file}`, alt: entry.alt, width: entry.width, height: entry.height };
}

/** Resolve image keys anywhere in a block's fields (including repeater rows). */
function resolveImages(value: unknown, key?: string): unknown {
  if (key === "image" && typeof value === "string") return image(value);
  if (Array.isArray(value)) return value.map((item) => resolveImages(item));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([innerKey, inner]) => [innerKey, resolveImages(inner, innerKey)]),
    );
  }
  return value;
}

function blocks(raw: RawBlock[]): BlockData[] {
  return raw.map((block) => ({
    name: block.name,
    anchor: block.anchor ?? null,
    fields: resolveImages(block.fields) as Record<string, unknown>,
    html: null,
    innerBlocks: [],
  }));
}

const LEVEL_LABELS: Record<WorkshopLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  "all-levels": "All levels",
};

const workshops: WorkshopSummary[] = content.workshops.map((workshop) => {
  const level = workshop.level as WorkshopLevel;
  return {
    slug: workshop.slug,
    uri: `/workshops/${workshop.slug}/`,
    title: workshop.title,
    level,
    levelLabel: LEVEL_LABELS[level],
    duration: workshop.duration,
    price: workshop.price,
    summary: workshop.summary,
    image: image(workshop.image),
  };
});

const nodes: ContentNode[] = [
  ...content.pages.map((page, index): ContentNode => ({
    kind: "page",
    id: index + 1,
    uri: normalizeUri(page.uri),
    title: page.title,
    seo: { title: page.seo.title, description: page.seo.description },
    blocks: blocks(page.blocks as RawBlock[]),
  })),
  ...content.workshops.map((workshop, index): ContentNode => ({
    kind: "workshop",
    id: 100 + index,
    uri: `/workshops/${workshop.slug}/`,
    title: workshop.title,
    seo: { title: workshop.seo.title, description: workshop.seo.description },
    blocks: blocks(workshop.blocks as RawBlock[]),
    workshop: workshops[index]!,
  })),
];

export const fixtureSource: ContentSource = {
  async getNodeByUri(uri) {
    const target = normalizeUri(uri);
    return nodes.find((node) => node.uri === target) ?? null;
  },
  async getPreviewNode(id) {
    return nodes.find((node) => node.id === id) ?? null;
  },
  async getAllUris() {
    return nodes.map((node) => node.uri);
  },
  async getWorkshops() {
    return workshops;
  },
  async getSiteSettings() {
    return { title: content.site.title, description: content.site.description, ...content.settings };
  },
  async getMenu() {
    return content.menu.map((item) => ({ label: item.label, uri: normalizeUri(item.uri) }));
  },
};
