/**
 * Contact form rules, kept free of Next.js so they can be unit tested.
 */

export const ENQUIRY_LIMITS = { name: 120, email: 254, workshop: 200, message: 4000 } as const;

export type EnquiryValues = {
  name: string;
  email: string;
  workshop: string;
  message: string;
};

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

export type EnquiryResult =
  | { ok: true; values: EnquiryValues }
  | { ok: false; values: EnquiryValues; errors: EnquiryErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(form: FormData, key: keyof EnquiryValues): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function validateEnquiry(form: FormData): EnquiryResult {
  const values: EnquiryValues = {
    name: text(form, "name"),
    email: text(form, "email"),
    workshop: text(form, "workshop"),
    message: text(form, "message"),
  };
  const errors: EnquiryErrors = {};

  if (!values.name) errors.name = "Enter your name.";
  else if (values.name.length > ENQUIRY_LIMITS.name) errors.name = `Keep your name under ${ENQUIRY_LIMITS.name} characters.`;

  if (!values.email) errors.email = "Enter your email address so we can reply.";
  else if (!EMAIL.test(values.email) || values.email.length > ENQUIRY_LIMITS.email)
    errors.email = "Enter an email address like name@example.com.";

  if (values.workshop.length > ENQUIRY_LIMITS.workshop) errors.workshop = "Choose a workshop from the list.";

  if (!values.message) errors.message = "Write a message.";
  else if (values.message.length > ENQUIRY_LIMITS.message)
    errors.message = `Keep your message under ${ENQUIRY_LIMITS.message} characters.`;

  return Object.keys(errors).length ? { ok: false, values, errors } : { ok: true, values };
}

/**
 * A small fixed-window rate limiter.
 *
 * In memory, so on serverless hosting each instance counts separately: it
 * stops a single client hammering the form, not a distributed attack. A shared
 * store (Redis, a database) is the next step if that ever matters.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function allow(key: string, now = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}
