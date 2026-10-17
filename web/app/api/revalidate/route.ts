import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { normalizeUri } from "@/lib/content/normalize";

/**
 * Called by WordPress after content changes (kiln-core/inc/frontend.php).
 *
 *   POST /api/revalidate/   Authorization: Bearer <REVALIDATION_SECRET>
 *   { "paths": ["/workshops/glazing-and-surface/", "/"] }   or   { "paths": ["*"] }
 */

function authorised(header: string | null, secret: string): boolean {
  const given = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "", "utf8");
  const wanted = Buffer.from(secret, "utf8");
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(request: Request) {
  if (!env.revalidationSecret) {
    return Response.json({ error: "Revalidation isn't set up: REVALIDATION_SECRET is missing." }, { status: 503 });
  }
  if (!authorised(request.headers.get("authorization"), env.revalidationSecret)) {
    return Response.json({ error: "Invalid secret." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON like {\"paths\": [\"/\"]}." }, { status: 400 });
  }

  const paths = (body as { paths?: unknown })?.paths;
  if (!Array.isArray(paths) || !paths.length || !paths.every((path) => typeof path === "string")) {
    return Response.json({ error: "\"paths\" must be a non-empty list of strings." }, { status: 400 });
  }

  if (paths.includes("*")) {
    // Navigation and studio details appear on every page.
    revalidatePath("/", "layout");
    return Response.json({ revalidated: ["*"] });
  }

  const revalidated = paths.filter((path) => path.startsWith("/")).map(normalizeUri);
  for (const path of revalidated) {
    // Route paths are stored without the trailing slash that URLs use here.
    revalidatePath(path === "/" ? "/" : path.slice(0, -1));
  }
  return Response.json({ revalidated });
}
