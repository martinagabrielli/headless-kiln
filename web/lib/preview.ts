import { createHmac, timingSafeEqual } from "node:crypto";

export const PREVIEW_COOKIE = "kiln_preview_id";

/**
 * Check a signed preview link from WordPress.
 *
 * WordPress signs "{id}:{expires}" with the shared secret (see
 * kiln-core/inc/frontend.php), so the secret itself never appears in a URL.
 */
export function verifyPreviewToken({
  id,
  expires,
  token,
  secret,
  now = Date.now(),
}: {
  id: string | null;
  expires: string | null;
  token: string | null;
  secret: string;
  now?: number;
}): { ok: true; id: number } | { ok: false; reason: string } {
  if (!id || !expires || !token) return { ok: false, reason: "The preview link is incomplete." };
  if (!/^\d+$/.test(id) || !/^\d+$/.test(expires)) return { ok: false, reason: "The preview link is malformed." };
  if (Number(expires) * 1000 < now) return { ok: false, reason: "The preview link has expired. Click Preview in WordPress again." };

  const expected = createHmac("sha256", secret).update(`${id}:${expires}`).digest("hex");
  const given = Buffer.from(token, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return { ok: false, reason: "The preview link isn't valid." };
  }
  return { ok: true, id: Number(id) };
}
