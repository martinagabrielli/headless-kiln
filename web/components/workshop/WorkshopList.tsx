import Image from "next/image";
import Link from "next/link";
import type { WorkshopSummary } from "@/lib/content/types";

/**
 * Workshops as rows, like a firing log: what it is, who it's for, when, and
 * what it costs, lined up so they can be compared at a glance.
 */
export function WorkshopList({ workshops, headingLevel = "h3" }: { workshops: WorkshopSummary[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;

  if (!workshops.length) {
    return <p className="text-lede text-iron-soft">No workshops are published yet. New dates are added every season.</p>;
  }

  return (
    <ul className="border-b border-rule">
      {workshops.map((workshop) => (
        <li
          key={workshop.slug}
          className="group relative grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 gap-y-2 border-t border-rule py-6 sm:grid-cols-[104px_minmax(0,1fr)] md:grid-cols-[112px_minmax(0,1fr)_9rem_13rem_5rem] md:items-center md:gap-x-8"
        >
          <div className="row-span-4 self-start md:row-span-1 md:self-center">
            {workshop.image && (
              <Image
                src={workshop.image.url}
                alt=""
                width={224}
                height={280}
                sizes="112px"
                className="aspect-[4/5] w-full rounded-t-full bg-slip object-cover"
              />
            )}
          </div>
          <div>
            <Heading className="text-title">
              <Link
                href={workshop.uri}
                className="decoration-1 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline"
              >
                {workshop.title}
              </Link>
            </Heading>
            {workshop.summary && <p className="mt-2 max-w-prose text-base text-iron-soft">{workshop.summary}</p>}
          </div>
          {workshop.levelLabel && (
            <p className="text-base font-medium text-celadon">
              <span className="sr-only">Level: </span>
              {workshop.levelLabel}
            </p>
          )}
          {workshop.duration && (
            <p className="text-base">
              <span className="sr-only">When: </span>
              {workshop.duration}
            </p>
          )}
          {workshop.price && (
            <p className="font-display text-title md:text-right">
              <span className="sr-only">Price: </span>
              {workshop.price}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
