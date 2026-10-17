import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPreviewToken } from "@/lib/preview";

const secret = "test-secret";
const now = Date.UTC(2026, 9, 17, 12, 0, 0);
const expires = String(Math.floor(now / 1000) + 600);

// The same signature WordPress makes in kiln-core/inc/frontend.php.
const sign = (id: string, exp: string) => createHmac("sha256", secret).update(`${id}:${exp}`).digest("hex");

describe("verifyPreviewToken", () => {
  it("accepts a link signed by WordPress", () => {
    expect(verifyPreviewToken({ id: "42", expires, token: sign("42", expires), secret, now })).toEqual({ ok: true, id: 42 });
  });

  it("rejects a link for a different post", () => {
    expect(verifyPreviewToken({ id: "43", expires, token: sign("42", expires), secret, now }).ok).toBe(false);
  });

  it("rejects an expired link", () => {
    const past = String(Math.floor(now / 1000) - 1);
    const result = verifyPreviewToken({ id: "42", expires: past, token: sign("42", past), secret, now });
    expect(result).toMatchObject({ ok: false, reason: expect.stringContaining("expired") });
  });

  it("rejects a link signed with another secret", () => {
    const forged = createHmac("sha256", "other").update(`42:${expires}`).digest("hex");
    expect(verifyPreviewToken({ id: "42", expires, token: forged, secret, now }).ok).toBe(false);
  });

  it.each([
    { id: null, expires, token: "x" },
    { id: "42", expires: null, token: "x" },
    { id: "42", expires, token: null },
    { id: "4 2", expires, token: "x" },
  ])("rejects incomplete or malformed links", (input) => {
    expect(verifyPreviewToken({ ...input, secret, now }).ok).toBe(false);
  });
});
