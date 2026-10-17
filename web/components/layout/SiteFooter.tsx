import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { MenuItem, SiteSettings } from "@/lib/content/types";

export function SiteFooter({ settings, menu }: { settings: SiteSettings; menu: MenuItem[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-[3px] border-iron bg-slip">
      <Container className="grid gap-10 py-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <p className="font-display text-3xl">{settings.title}</p>
          <p className="mt-3 max-w-sm text-base text-iron-soft">{settings.description}</p>
        </div>
        {settings.address && (
          <div className="text-base md:col-span-3">
            <h2 className="font-sans text-base font-medium">Find us</h2>
            <p className="mt-2 whitespace-pre-line text-iron-soft">{settings.address}</p>
          </div>
        )}
        {settings.openingHours && (
          <div className="text-base md:col-span-3">
            <h2 className="font-sans text-base font-medium">Open</h2>
            <p className="mt-2 whitespace-pre-line text-iron-soft">{settings.openingHours}</p>
          </div>
        )}
        <nav aria-label="Footer" className="text-base md:col-span-2">
          <ul className="space-y-2">
            {menu.map((item) => (
              <li key={item.uri}>
                <Link href={item.uri} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-rule">
        <Container className="flex flex-col gap-2 py-6 text-sm text-iron-soft sm:flex-row sm:justify-between">
          <p>
            © {year} {settings.title}. A demo site; the studio is fictional.
          </p>
          <p>
            Built with headless WordPress and Next.js by{" "}
            <a href="https://martinagabrielli.com" className="underline underline-offset-4 hover:text-iron">
              Martina Gabrielli
            </a>
            .{" "}
            <a href="https://github.com/martinagabrielli/headless-kiln" className="underline underline-offset-4 hover:text-iron">
              Source on GitHub
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
