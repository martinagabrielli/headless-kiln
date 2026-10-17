import Link from "next/link";
import { ArchImage } from "@/components/ui/ArchImage";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { WorkshopSummary } from "@/lib/content/types";

export function WorkshopHeader({ workshop }: { workshop: WorkshopSummary }) {
  const facts = [
    { label: "Level", value: workshop.levelLabel },
    { label: "When", value: workshop.duration },
    { label: "Price", value: workshop.price },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <header className="overflow-hidden pt-10 md:pt-14">
      <Container>
        <Link href="/workshops/" className="text-base font-medium text-celadon hover:underline">
          All workshops
        </Link>
        <div className="mt-6 grid items-end gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7 md:pb-16">
            <h1 className="text-display">{workshop.title}</h1>
            {workshop.summary && <p className="mt-6 max-w-xl text-lede text-iron-soft">{workshop.summary}</p>}
            {facts.length > 0 && (
              <dl className="mt-10 grid max-w-xl grid-cols-1 gap-y-4 border-t border-rule pt-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,6rem)] sm:gap-x-8">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-base text-iron-soft">{fact.label}</dt>
                    <dd className="mt-1 text-lede font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ButtonLink
              className="mt-10"
              link={{ title: "Ask about this workshop", url: `/visit/?workshop=${workshop.slug}#enquire`, target: null }}
            />
          </div>
          {workshop.image && (
            <div className="md:col-span-5">
              <ArchImage image={workshop.image} priority sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          )}
        </div>
      </Container>
      <div aria-hidden className="h-[3px] bg-iron" />
    </header>
  );
}
