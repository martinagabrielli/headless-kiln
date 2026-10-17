import { ArchImage } from "@/components/ui/ArchImage";
import { ButtonLink } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import { Section } from "@/components/ui/Section";
import type { BlockProps } from "@/lib/blocks/fields";

export function TextImage({ fields, anchor, isFirst, headingId }: BlockProps<"acf/text-image">) {
  const { heading, text, image, imagePosition, link } = fields;
  const imageFirst = imagePosition === "left";

  return (
    <Section id={anchor} labelledBy={heading ? headingId : undefined}>
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <div className={`md:col-span-6 ${imageFirst ? "md:order-2 md:col-start-7" : "lg:col-span-5"}`}>
          {heading && (
            <h2 id={headingId} className="mb-6 text-headline">
              {heading}
            </h2>
          )}
          <RichText html={text} className="text-iron-soft" />
          {link && <ButtonLink link={link} variant="secondary" className="mt-8" />}
        </div>
        {image && (
          <div
            className={`md:col-span-5 ${imageFirst ? "md:order-1 md:col-start-1" : "md:col-start-8"}`}
          >
            <ArchImage image={image} priority={isFirst} sizes="(min-width: 768px) 40vw, 100vw" />
          </div>
        )}
      </div>
    </Section>
  );
}
