import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import type { BlockProps } from "@/lib/blocks/fields";

export function Cta({ fields, anchor, headingId }: BlockProps<"acf/cta">) {
  const { heading, text, link } = fields;
  return (
    <Section id={anchor} tone="cobalt" labelledBy={headingId}>
      <div className="grid items-end gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <h2 id={headingId} className="text-headline">
            {heading}
          </h2>
          {text && <p className="mt-4 max-w-2xl text-lede text-porcelain/85">{text}</p>}
        </div>
        {link && (
          <div className="md:col-span-4 md:justify-self-end">
            <ButtonLink link={link} variant="inverse" />
          </div>
        )}
      </div>
    </Section>
  );
}
