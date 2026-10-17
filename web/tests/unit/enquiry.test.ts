import { describe, expect, it } from "vitest";
import { createRateLimiter, validateEnquiry } from "@/lib/enquiry";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("validateEnquiry", () => {
  it("accepts a complete enquiry and trims it", () => {
    const result = validateEnquiry(form({ name: " Priya ", email: "priya@example.com", workshop: "", message: " Hello " }));
    expect(result).toEqual({
      ok: true,
      values: { name: "Priya", email: "priya@example.com", workshop: "", message: "Hello" },
    });
  });

  it("explains each missing or invalid field", () => {
    const result = validateEnquiry(form({ name: "", email: "not-an-email", message: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["email", "message", "name"]);
    expect(result.errors.email).toMatch(/name@example.com/);
  });

  it("rejects an over-long message", () => {
    const result = validateEnquiry(form({ name: "A", email: "a@example.com", message: "x".repeat(4001) }));
    expect(result.ok).toBe(false);
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit in a window, then blocks until it resets", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(allow("ip", 0)).toBe(true);
    expect(allow("ip", 10)).toBe(true);
    expect(allow("ip", 20)).toBe(false);
    expect(allow("other-ip", 20)).toBe(true);
    expect(allow("ip", 1000)).toBe(true);
  });
});
