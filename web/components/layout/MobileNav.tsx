"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/content/types";

export function MobileNav({ menu }: { menu: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close after navigating.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes the menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 rounded-md border border-iron/25 px-4 text-base font-medium"
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav
        id="mobile-menu"
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-rule bg-porcelain"
      >
        <ul className="px-5 py-4">
          {menu.map((item) => (
            <li key={item.uri}>
              <Link href={item.uri} className="block border-b border-rule py-4 font-display text-title last:border-0">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
