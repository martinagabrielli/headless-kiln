import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { PREVIEW_COOKIE, verifyPreviewToken } from "@/lib/preview";

/** Entry point for WordPress's Preview button. */
export async function GET(request: Request) {
  if (!env.previewSecret) {
    return new Response("Previews aren't set up: PREVIEW_SECRET is missing.", { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const result = verifyPreviewToken({
    id: params.get("id"),
    expires: params.get("expires"),
    token: params.get("token"),
    secret: env.previewSecret,
  });
  if (!result.ok) {
    return new Response(result.reason, { status: 401 });
  }

  (await draftMode()).enable();
  (await cookies()).set(PREVIEW_COOKIE, String(result.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  redirect("/preview/");
}
