"use server";

import { headers } from "next/headers";
import { env, isFixtureMode } from "@/lib/env";
import { createRateLimiter, validateEnquiry, type EnquiryErrors, type EnquiryValues } from "@/lib/enquiry";

export type EnquiryState = {
  status: "idle" | "sent" | "demo" | "error";
  message?: string;
  errors?: EnquiryErrors;
  values?: EnquiryValues;
};

const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

/**
 * Handle the contact form.
 *
 * Next.js checks that server actions are posted from this site's own origin,
 * so there's no separate CSRF token. Submissions are validated here, then
 * forwarded to WordPress with a shared secret; the browser never talks to
 * WordPress directly.
 */
export async function sendEnquiry(_previous: EnquiryState, form: FormData): Promise<EnquiryState> {
  // Honeypot: people never see this field, simple bots fill it in. Pretend it worked.
  if (form.get("website")) {
    return { status: "sent" };
  }

  const result = validateEnquiry(form);
  if (!result.ok) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      errors: result.errors,
      values: result.values,
    };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(ip)) {
    return {
      status: "error",
      message: "You've sent several messages in a short time. Wait ten minutes and try again.",
      values: result.values,
    };
  }

  if (isFixtureMode || !env.enquirySecret || !env.wordpressOrigin) {
    return { status: "demo" };
  }

  try {
    const response = await fetch(`${env.wordpressOrigin}/wp-json/kiln/v1/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kiln-Secret": env.enquirySecret },
      body: JSON.stringify(result.values),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`WordPress answered ${response.status}`);
    }
  } catch (error) {
    console.error("Enquiry not delivered", error);
    return {
      status: "error",
      message: "Your message couldn't be sent. Try again in a moment, or email us directly.",
      values: result.values,
    };
  }

  return { status: "sent" };
}
