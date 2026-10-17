/**
 * The site's content model, independent of where it comes from.
 *
 * Both sources (WordPress over GraphQL, and the bundled fixtures) return these
 * shapes, so components never know which one they're reading.
 */

export type ImageData = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type LinkData = {
  title: string;
  url: string;
  target: string | null;
};

/** A block as delivered: fields are typed per block in lib/blocks/fields.ts. */
export type BlockData = {
  name: string;
  anchor: string | null;
  fields: Record<string, unknown>;
  html: string | null;
  innerBlocks: BlockData[];
};

export type Seo = {
  title: string | null;
  description: string | null;
};

export type WorkshopLevel = "beginner" | "intermediate" | "all-levels";

export type WorkshopSummary = {
  slug: string;
  uri: string;
  title: string;
  level: WorkshopLevel | null;
  levelLabel: string | null;
  duration: string | null;
  price: string | null;
  summary: string | null;
  image: ImageData | null;
};

type NodeBase = {
  id: number;
  uri: string;
  title: string;
  seo: Seo;
  blocks: BlockData[];
};

export type PageNode = NodeBase & { kind: "page" };
export type WorkshopNode = NodeBase & { kind: "workshop"; workshop: WorkshopSummary };
export type ContentNode = PageNode | WorkshopNode;

export type MenuItem = {
  label: string;
  uri: string;
};

export type SiteSettings = {
  title: string;
  description: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  openingHours: string | null;
};

/** Everything the app reads. Implemented by graphql.ts and fixtures.ts. */
export interface ContentSource {
  getNodeByUri(uri: string): Promise<ContentNode | null>;
  /** Latest revision of a page or workshop, including unpublished drafts. */
  getPreviewNode(id: number): Promise<ContentNode | null>;
  getAllUris(): Promise<string[]>;
  getWorkshops(): Promise<WorkshopSummary[]>;
  getSiteSettings(): Promise<SiteSettings>;
  getMenu(): Promise<MenuItem[]>;
}
