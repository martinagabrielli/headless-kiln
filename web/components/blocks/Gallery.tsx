import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { BlockProps } from "@/lib/blocks/fields";

export function Gallery({ fields, anchor, headingId }: BlockProps<"acf/gallery">) {
  const items = (fields.items ?? []).filter((item) => item.image);
  if (!items.length) return null;

  return (
    <Section id={anchor} labelledBy={fields.heading ? headingId : undefined}>
      <SectionHeading id={headingId} heading={fields.heading} />
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {items.map((item, index) => (
          <li key={index}>
            <figure>
              <Image
                src={item.image!.url}
                alt={item.image!.alt}
                width={item.image!.width}
                height={item.image!.height}
                sizes="(min-width: 768px) 25vw, 50vw"
                className="aspect-square w-full rounded-sm bg-slip object-cover"
              />
              {item.caption && <figcaption className="mt-3 text-base text-iron-soft">{item.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
