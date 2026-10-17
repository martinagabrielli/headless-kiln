import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Faq } from "@/components/blocks/Faq";
import { Hero } from "@/components/blocks/Hero";
import { Testimonials } from "@/components/blocks/Testimonials";

const common = { anchor: null, isFirst: false, headingId: "h" };

describe("blocks", () => {
  it("renders the hero's heading as the page's h1 and skips empty links", () => {
    const html = renderToStaticMarkup(
      <Hero
        {...common}
        fields={{ eyebrow: null, heading: "Learn to throw", text: null, image: null, primaryLink: null, secondaryLink: null }}
      />,
    );
    expect(html).toContain('<h1 id="h"');
    expect(html).toContain("Learn to throw");
    expect(html).not.toContain("<a");
  });

  it("strips unsafe HTML from editor content", () => {
    const html = renderToStaticMarkup(
      <Faq
        {...common}
        fields={{
          heading: "Questions",
          items: [{ question: "Safe?", answer: '<p onclick="steal()">Yes<script>alert(1)</script></p>' }],
        }}
      />,
    );
    expect(html).toContain("<p>Yes</p>");
    expect(html).not.toMatch(/script|onclick/);
  });

  it("renders nothing when a repeater is empty", () => {
    expect(renderToStaticMarkup(<Testimonials {...common} fields={{ heading: "From students", items: [] }} />)).toBe("");
  });
});
