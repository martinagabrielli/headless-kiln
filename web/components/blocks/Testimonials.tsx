import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { BlockProps } from "@/lib/blocks/fields";

export function Testimonials({ fields, anchor, headingId }: BlockProps<"acf/testimonials">) {
  const items = (fields.items ?? []).filter((item) => item.quote);
  if (!items.length) return null;

  return (
    <Section id={anchor} tone="slip" labelledBy={fields.heading ? headingId : undefined}>
      <SectionHeading id={headingId} heading={fields.heading} />
      <ul className="grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-iron/15">
        {items.map((item, index) => (
          <li key={index} className="md:px-8 md:first:pl-0 md:last:pr-0">
            <figure>
              <blockquote className="font-display text-title">“{item.quote}”</blockquote>
              {(item.name || item.detail) && (
                <figcaption className="mt-6 text-base">
                  {item.name && <span className="block font-medium">{item.name}</span>}
                  {item.detail && <span className="block text-iron-soft">{item.detail}</span>}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
