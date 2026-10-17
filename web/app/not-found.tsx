import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="py-24 md:py-32">
      <h1 className="text-display">This page isn&apos;t here</h1>
      <p className="mt-6 max-w-xl text-lede text-iron-soft">
        It may have moved, or the workshop may have finished. The full list of current workshops is one click away.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/workshops/" className={`${buttonStyles.base} ${buttonStyles.primary}`}>
          See workshops
        </Link>
        <Link href="/" className={`${buttonStyles.base} ${buttonStyles.secondary}`}>
          Go to the home page
        </Link>
      </div>
    </Container>
  );
}
