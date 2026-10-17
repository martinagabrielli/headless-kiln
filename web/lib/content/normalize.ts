/**
 * Helpers shared by both content sources.
 */

/** snake_case -> camelCase, e.g. primary_link -> primaryLink. */
export function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Convert every object key to camelCase, recursing into arrays and nested
 * objects (repeater rows, links, images). WordPress field names are snake_case;
 * the frontend's types are camelCase.
 */
export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [toCamelCase(key), camelizeKeys(inner)]),
    );
  }
  return value;
}

/** Parse a block's JSON-encoded fields, tolerating null and bad JSON. */
export function parseBlockFields(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return camelizeKeys(parsed) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Normalise a path to the site's form: leading and trailing slash. */
export function normalizeUri(uri: string): string {
  const trimmed = uri.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

/** Route params (["workshops", "glazing"]) -> "/workshops/glazing/". */
export function uriFromSlug(slug: string[] | undefined): string {
  return normalizeUri((slug ?? []).map(decodeURIComponent).join("/"));
}

/** "/workshops/glazing/" -> ["workshops", "glazing"]; "/" -> []. */
export function slugFromUri(uri: string): string[] {
  return normalizeUri(uri).split("/").filter(Boolean);
}
