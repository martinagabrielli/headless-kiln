import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getMenu, getSiteSettings } from "@/lib/content";
import type { MenuItem, SiteSettings } from "@/lib/content/types";
import { env } from "@/lib/env";
import { instrumentSans, youngSerif } from "./fonts";
import "./globals.css";

/** If WordPress is down, keep the shell rendering rather than failing every page. */
async function loadShell(): Promise<{ settings: SiteSettings; menu: MenuItem[] }> {
  try {
    const [settings, menu] = await Promise.all([getSiteSettings(), getMenu()]);
    return { settings, menu };
  } catch (error) {
    console.error("Could not load site settings or menu", error);
    return {
      settings: { title: "Kiln Studio", description: "", address: null, email: null, phone: null, openingHours: null },
      menu: [],
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await loadShell();
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: settings.title, template: `%s | ${settings.title}` },
    description: settings.description,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { settings, menu } = await loadShell();

  return (
    <html lang="en-GB" className={`${youngSerif.variable} ${instrumentSans.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-cobalt px-4 py-3 text-porcelain focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader title={settings.title} menu={menu} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} menu={menu} />
      </body>
    </html>
  );
}
