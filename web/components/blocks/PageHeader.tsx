import { Container } from "@/components/ui/Container";
import type { BlockProps } from "@/lib/blocks/fields";

export function PageHeader({ fields, anchor, headingId }: BlockProps<"acf/page-header">) {
  const { eyebrow, heading, intro } = fields;
  return (
    <header id={anchor ?? undefined} className="border-b border-rule pt-16 pb-12 md:pt-24 md:pb-16">
      <Container>
        {eyebrow && <p className="mb-4 font-medium text-celadon">{eyebrow}</p>}
        <h1 id={headingId} className="max-w-4xl text-display">
          {heading}
        </h1>
        {intro && <p className="mt-6 max-w-2xl text-lede text-iron-soft">{intro}</p>}
      </Container>
    </header>
  );
}
