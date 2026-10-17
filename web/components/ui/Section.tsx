import type { ReactNode } from "react";
import { Container } from "./Container";

const tones = {
  // Two plain sections in a row share one gap instead of stacking two.
  porcelain: "tone-porcelain bg-porcelain text-iron [.tone-porcelain+&]:pt-0!",
  slip: "bg-slip text-iron",
  cobalt: "bg-cobalt text-porcelain",
} as const;

/**
 * Vertical rhythm for every block lives here, in one place, so blocks never
 * fight over margins between them.
 */
export function Section({
  children,
  id,
  tone = "porcelain",
  labelledBy,
  className = "",
}: {
  children: ReactNode;
  id?: string | null;
  tone?: keyof typeof tones;
  labelledBy?: string;
  className?: string;
}) {
  return (
    <section
      id={id ?? undefined}
      aria-labelledby={labelledBy}
      className={`py-16 md:py-24 ${tones[tone]} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}
