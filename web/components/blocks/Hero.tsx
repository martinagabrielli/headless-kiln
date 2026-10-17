import { ArchImage } from "@/components/ui/ArchImage";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { BlockProps } from "@/lib/blocks/fields";

export function Hero({ fields, anchor, isFirst, headingId }: BlockProps<"acf/hero">) {
  const { eyebrow, heading, text, image, primaryLink, secondaryLink } = fields;

  return (
    <section id={anchor ?? undefined} aria-labelledby={headingId} className="overflow-hidden pt-10 md:pt-16">
      <Container>
        <div className="grid items-end gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6 md:pb-20 lg:col-span-7">
            {eyebrow && <p className="mb-5 font-medium text-celadon">{eyebrow}</p>}
            <h1 id={headingId} className="text-display">
              {heading}
            </h1>
            {text && <p className="mt-6 max-w-xl text-lede text-iron-soft">{text}</p>}
            {(primaryLink || secondaryLink) && (
              <div className="mt-9 flex flex-wrap gap-3">
                {primaryLink && <ButtonLink link={primaryLink} />}
                {secondaryLink && <ButtonLink link={secondaryLink} variant="secondary" />}
              </div>
            )}
          </div>
          {image && (
            <div className="animate-rise md:col-span-6 lg:col-span-5">
              <ArchImage image={image} priority={isFirst} sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          )}
        </div>
      </Container>
      {/* The kiln shelf the hero stands on. */}
      <div aria-hidden className="h-[3px] bg-iron" />
    </section>
  );
}
