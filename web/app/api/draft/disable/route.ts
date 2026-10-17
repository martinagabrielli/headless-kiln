import { redirect } from "next/navigation";

/** Leave a preview. Previews hold no state, so this just goes home. */
export async function GET() {
  redirect("/");
}
