import { RichText } from "@/components/ui/RichText";
import { Section } from "@/components/ui/Section";
import type { BlockProps } from "@/lib/blocks/fields";

export function RichTextBlock({ fields, anchor, headingId }: BlockProps<"acf/rich-text">) {
  const { heading, content } = fields;
  return (
    <Section id={anchor} labelledBy={heading ? headingId : undefined}>
      <div className="grid gap-6 md:grid-cols-12 md:gap-8">
        {heading && (
          <h2 id={headingId} className="text-headline md:col-span-4">
            {heading}
          </h2>
        )}
        <RichText html={content} className={heading ? "md:col-span-7 md:col-start-6" : "md:col-span-8"} />
      </div>
    </Section>
  );
}
