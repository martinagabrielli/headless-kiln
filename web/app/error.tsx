"use client";

import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-24 md:py-32">
      <h1 className="text-headline">This page couldn&apos;t load</h1>
      <p className="mt-6 max-w-xl text-lede text-iron-soft">
        The content service didn&apos;t respond. Try again in a moment.
      </p>
      <button type="button" onClick={reset} className={`mt-9 ${buttonStyles.base} ${buttonStyles.primary}`}>
        Try again
      </button>
    </Container>
  );
}
