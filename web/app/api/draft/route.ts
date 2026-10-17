import { redirect } from "next/navigation";

/**
 * Entry point for WordPress's Preview button.
 *
 * The signed link is passed straight on to /preview/, which checks it there.
 * Nothing depends on cookies, so previews work over plain http://localhost and
 * in browsers that block third-party or insecure cookies.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  for (const key of ["id", "expires", "token"]) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  redirect(`/preview/?${query.toString()}`);
}
