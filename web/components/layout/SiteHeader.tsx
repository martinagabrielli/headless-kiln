import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { MenuItem } from "@/lib/content/types";
import { MobileNav } from "./MobileNav";

export function SiteHeader({ title, menu }: { title: string; menu: MenuItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-porcelain/95 backdrop-blur supports-[backdrop-filter]:bg-porcelain/85">
      <Container className="flex h-18 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl leading-none">
          {title}
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 text-base font-medium">
            {menu.map((item) => (
              <li key={item.uri}>
                <Link href={item.uri} className="py-2 underline-offset-[0.35em] hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <MobileNav menu={menu} />
      </Container>
    </header>
  );
}
