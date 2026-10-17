import { RichText } from "@/components/ui/RichText";
import { Section } from "@/components/ui/Section";
import type { BlockProps } from "@/lib/blocks/fields";

/** Native <details> elements: keyboard and screen-reader support for free, no JavaScript. */
export function Faq({ fields, anchor, headingId }: BlockProps<"acf/faq">) {
  const items = (fields.items ?? []).filter((item) => item.question);
  if (!items.length) return null;

  return (
    <Section id={anchor} labelledBy={fields.heading ? headingId : undefined}>
      <div className="grid gap-10 md:grid-cols-12 md:gap-8">
        {fields.heading && (
          <h2 id={headingId} className="text-headline md:sticky md:top-28 md:col-span-4 md:self-start">
            {fields.heading}
          </h2>
        )}
        <div className="border-b border-rule md:col-span-8 md:col-start-5">
          {items.map((item, index) => (
            <details key={index} className="group border-t border-rule">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lede font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-iron/30 text-xl leading-none transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <RichText html={item.answer} className="pb-6 text-iron-soft" />
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
