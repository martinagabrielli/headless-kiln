import "server-only";
import { env } from "@/lib/env";
import { normalizeUri, parseBlockFields } from "./normalize";
import type {
  BlockData,
  ContentNode,
  ContentSource,
  ImageData,
  MenuItem,
  SiteSettings,
  WorkshopLevel,
  WorkshopSummary,
} from "./types";

/**
 * WordPress over WPGraphQL.
 *
 * Published content is cached for an hour and refreshed sooner when WordPress
 * calls /api/revalidate on save. Previews skip the cache and authenticate with
 * an application password, because WordPress only returns drafts to logged-in
 * users.
 */

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

/** Fallback for when WordPress doesn't call /api/revalidate (e.g. it's offline). */
const REVALIDATE_SECONDS = 3600;

export async function fetchGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { preview = false }: { preview?: boolean } = {},
): Promise<T> {
  if (!env.graphqlEndpoint) {
    throw new Error("GRAPHQL_ENDPOINT is not set.");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (preview) {
    if (!env.previewUser || !env.previewPassword) {
      throw new Error("Previews need WP_PREVIEW_USER and WP_PREVIEW_PASSWORD.");
    }
    const credentials = Buffer.from(`${env.previewUser}:${env.previewPassword}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  let response: Response;
  try {
    response = await fetch(env.graphqlEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      ...(preview ? { cache: "no-store" } : { next: { revalidate: REVALIDATE_SECONDS } }),
    });
  } catch (cause) {
    throw new Error(`WordPress is unreachable at ${env.graphqlEndpoint}.`, { cause });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    const body = await response.text().catch(() => "");
    throw new Error(`WordPress returned ${response.status} ${contentType}: ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("; "));
  }
  if (!json.data) {
    throw new Error("WordPress returned no data.");
  }
  return json.data;
}

// --- Queries -----------------------------------------------------------------

const BLOCK_FIELDS = /* GraphQL */ `
  fragment BlockFields on KilnBlock {
    name
    anchor
    fields
    html
  }
`;

const IMAGE_FIELDS = /* GraphQL */ `
  fragment ImageFields on MediaItem {
    sourceUrl
    altText
    mediaDetails {
      width
      height
    }
  }
`;

const WORKSHOP_SUMMARY = /* GraphQL */ `
  fragment WorkshopSummary on Workshop {
    slug
    uri
    title
    level
    levelLabel
    duration
    price
    summary
    featuredImage {
      node {
        ...ImageFields
      }
    }
  }
`;

const NODE_FIELDS = /* GraphQL */ `
  fragment NodeFields on ContentNode {
    __typename
    databaseId
    uri
    ... on Page {
      title
      kilnSeo {
        title
        description
      }
      kilnBlocks {
        ...BlockFields
        innerBlocks {
          ...BlockFields
        }
      }
    }
    ... on Workshop {
      ...WorkshopSummary
      kilnSeo {
        title
        description
      }
      kilnBlocks {
        ...BlockFields
        innerBlocks {
          ...BlockFields
        }
      }
    }
  }
`;

const FRAGMENTS = BLOCK_FIELDS + IMAGE_FIELDS + WORKSHOP_SUMMARY + NODE_FIELDS;

const NODE_BY_URI = /* GraphQL */ `
  query NodeByUri($uri: String!) {
    nodeByUri(uri: $uri) {
      ... on ContentNode {
        ...NodeFields
      }
    }
  }
  ${FRAGMENTS}
`;

const PREVIEW_NODE = /* GraphQL */ `
  query PreviewNode($id: ID!) {
    contentNode(id: $id, idType: DATABASE_ID, asPreview: true) {
      ...NodeFields
    }
  }
  ${FRAGMENTS}
`;

const ALL_URIS = /* GraphQL */ `
  query AllUris {
    pages(first: 100) {
      nodes {
        uri
      }
    }
    workshops(first: 100) {
      nodes {
        uri
      }
    }
  }
`;

const WORKSHOPS = /* GraphQL */ `
  query Workshops {
    workshops(first: 100, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
      nodes {
        ...WorkshopSummary
      }
    }
  }
  ${IMAGE_FIELDS}
  ${WORKSHOP_SUMMARY}
`;

const SITE = /* GraphQL */ `
  query Site {
    generalSettings {
      title
      description
    }
    studioSettings {
      address
      email
      phone
      openingHours
    }
  }
`;

const MENU = /* GraphQL */ `
  query Menu {
    menuItems(where: { location: PRIMARY, parentDatabaseId: 0 }, first: 20) {
      nodes {
        label
        uri
      }
    }
  }
`;

// --- Response shapes and mapping ---------------------------------------------

type RawImage = {
  sourceUrl: string | null;
  altText: string | null;
  mediaDetails: { width: number | null; height: number | null } | null;
} | null;

type RawBlock = {
  name: string;
  anchor: string | null;
  fields: string | null;
  html: string | null;
  innerBlocks?: RawBlock[] | null;
};

type RawWorkshopSummary = {
  slug: string;
  uri: string;
  title: string;
  level: string | null;
  levelLabel: string | null;
  duration: string | null;
  price: string | null;
  summary: string | null;
  featuredImage: { node: RawImage } | null;
};

type RawNode =
  | ({ __typename: "Page"; databaseId: number; uri: string; title: string } & RawNodeContent)
  | ({ __typename: "Workshop"; databaseId: number } & RawWorkshopSummary & RawNodeContent)
  | { __typename: string; databaseId: number; uri: string };

type RawNodeContent = {
  kilnSeo: { title: string | null; description: string | null } | null;
  kilnBlocks: RawBlock[] | null;
};

function mapImage(raw: RawImage): ImageData | null {
  if (!raw?.sourceUrl) return null;
  return {
    url: raw.sourceUrl,
    alt: raw.altText ?? "",
    width: raw.mediaDetails?.width ?? 1200,
    height: raw.mediaDetails?.height ?? 900,
  };
}

function mapBlock(raw: RawBlock): BlockData {
  return {
    name: raw.name,
    anchor: raw.anchor,
    fields: parseBlockFields(raw.fields),
    html: raw.html,
    innerBlocks: (raw.innerBlocks ?? []).map(mapBlock),
  };
}

const LEVELS: WorkshopLevel[] = ["beginner", "intermediate", "all-levels"];

function mapWorkshopSummary(raw: RawWorkshopSummary): WorkshopSummary {
  return {
    slug: raw.slug,
    uri: normalizeUri(raw.uri),
    title: raw.title,
    level: LEVELS.find((level) => level === raw.level) ?? null,
    levelLabel: raw.levelLabel,
    duration: raw.duration,
    price: raw.price,
    summary: raw.summary,
    image: mapImage(raw.featuredImage?.node ?? null),
  };
}

function mapNode(raw: RawNode | null): ContentNode | null {
  if (!raw || !("kilnBlocks" in raw)) return null;

  const base = {
    id: raw.databaseId,
    uri: normalizeUri(raw.uri),
    title: raw.title,
    seo: { title: raw.kilnSeo?.title ?? null, description: raw.kilnSeo?.description ?? null },
    blocks: (raw.kilnBlocks ?? []).map(mapBlock),
  };

  if (raw.__typename === "Workshop" && "slug" in raw) {
    return { ...base, kind: "workshop", workshop: mapWorkshopSummary(raw) };
  }
  if (raw.__typename === "Page") {
    return { ...base, kind: "page" };
  }
  return null;
}

// --- The source --------------------------------------------------------------

export const graphqlSource: ContentSource = {
  async getNodeByUri(uri) {
    const data = await fetchGraphQL<{ nodeByUri: RawNode | null }>(NODE_BY_URI, {
      uri: normalizeUri(uri),
    });
    return mapNode(data.nodeByUri);
  },

  async getPreviewNode(id) {
    const data = await fetchGraphQL<{ contentNode: RawNode | null }>(
      PREVIEW_NODE,
      { id: String(id) },
      { preview: true },
    );
    return mapNode(data.contentNode);
  },

  async getAllUris() {
    const data = await fetchGraphQL<{
      pages: { nodes: { uri: string | null }[] };
      workshops: { nodes: { uri: string | null }[] };
    }>(ALL_URIS);
    return [...data.pages.nodes, ...data.workshops.nodes]
      .map((node) => node.uri)
      .filter((uri): uri is string => Boolean(uri))
      .map(normalizeUri);
  },

  async getWorkshops() {
    const data = await fetchGraphQL<{ workshops: { nodes: RawWorkshopSummary[] } }>(WORKSHOPS);
    return data.workshops.nodes.map(mapWorkshopSummary);
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const data = await fetchGraphQL<{
      generalSettings: { title: string; description: string };
      studioSettings: Omit<SiteSettings, "title" | "description"> | null;
    }>(SITE);
    return {
      title: data.generalSettings.title,
      description: data.generalSettings.description,
      address: data.studioSettings?.address ?? null,
      email: data.studioSettings?.email ?? null,
      phone: data.studioSettings?.phone ?? null,
      openingHours: data.studioSettings?.openingHours ?? null,
    };
  },

  async getMenu(): Promise<MenuItem[]> {
    const data = await fetchGraphQL<{ menuItems: { nodes: { label: string; uri: string }[] } }>(MENU);
    return data.menuItems.nodes.map((item) => ({ label: item.label, uri: normalizeUri(item.uri) }));
  },
};
