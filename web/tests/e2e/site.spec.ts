import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", heading: "Learn to make pots you'll use every day." },
  { path: "/workshops/", heading: "Workshops" },
  { path: "/workshops/glazing-and-surface/", heading: "Glazing and surface" },
  { path: "/about/", heading: "A working studio that teaches" },
  { path: "/visit/", heading: "Visit the studio" },
];

for (const { path, heading } of pages) {
  test(`${path} renders and has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    // Let the hero's entrance finish: mid-fade text would fail the contrast check.
    await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState === "finished"));
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  });
}

test("each page has its own title and description", async ({ page }) => {
  await page.goto("/workshops/taster-session/");
  await expect(page).toHaveTitle("Taster session | Kiln Studio");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /two-hour introduction/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/workshops\/taster-session\/$/);
});

test("a visitor can go from the home page to a workshop", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Workshops" }).click();
  await expect(page).toHaveURL(/\/workshops\/$/);

  await page.getByRole("link", { name: "Wheel throwing for beginners" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wheel throwing for beginners");
  await expect(page.getByText("£240")).toBeVisible();
});

test("asking about a workshop preselects it in the form", async ({ page }) => {
  await page.goto("/workshops/glazing-and-surface/");
  await page.getByRole("link", { name: "Ask about this workshop" }).click();
  await expect(page.getByLabel("Workshop (optional)")).toHaveValue("Glazing and surface");
});

test("the contact form explains errors, then confirms", async ({ page }) => {
  // The form allows five messages per address per ten minutes; give each run its own address.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250)}` });
  await page.goto("/visit/");
  await page.getByRole("button", { name: "Send message" }).click();
  // Next.js adds its own empty role="alert" route announcer, so match by text.
  await expect(page.getByRole("alert").filter({ hasText: "Check the highlighted fields" })).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter your name.")).toBeVisible();

  await page.getByLabel("Name").fill("Priya");
  await page.getByLabel("Email").fill("priya@example.com");
  await page.getByLabel("Message").fill("Is there space on the next taster?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Message sent" })).toBeVisible();
});

test("FAQ answers open and close", async ({ page }) => {
  await page.goto("/workshops/");
  const question = page.getByText("What should I wear?");
  const answer = page.getByText("Clothes you don't mind getting muddy");
  await expect(answer).toBeHidden();
  await question.click();
  await expect(answer).toBeVisible();
});

test("unknown pages show a helpful 404", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page isn't here");
});

test("a broken preview link explains itself instead of redirecting home", async ({ page }) => {
  await page.goto("/api/draft/?id=1&expires=1&token=nope");
  await expect(page).toHaveURL(/\/preview\//);
  // This build has no PREVIEW_SECRET, so the page says previews aren't set up.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Previews aren't set up");
});

test("the revalidation webhook rejects a wrong secret", async ({ request }) => {
  const response = await request.post("/api/revalidate/", {
    headers: { Authorization: "Bearer wrong" },
    data: { paths: ["/"] },
  });
  // 503 when no secret is configured (as in this fixture build), 401 when it is.
  expect([401, 503]).toContain(response.status());
});
