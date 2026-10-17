import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WorkshopList } from "@/components/workshop/WorkshopList";
import type { BlockProps } from "@/lib/blocks/fields";
import { getWorkshops } from "@/lib/content";

/** Lists published workshops. The block only holds the copy; the list is live. */
export async function WorkshopsGrid({ fields, anchor, headingId }: BlockProps<"acf/workshops-grid">) {
  const all = await getWorkshops();
  const workshops = fields.limit ? all.slice(0, fields.limit) : all;
  const hasHeading = Boolean(fields.heading);

  return (
    <Section id={anchor} labelledBy={hasHeading ? headingId : undefined}>
      <SectionHeading id={headingId} heading={fields.heading} intro={fields.intro} />
      <WorkshopList workshops={workshops} headingLevel={hasHeading ? "h3" : "h2"} />
    </Section>
  );
}
