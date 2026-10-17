import Link from "next/link";
import type { ComponentProps } from "react";
import type { LinkData } from "@/lib/content/types";

type Props = Omit<ComponentProps<"a">, "href" | "target"> & { link: LinkData };

/** next/link for internal paths, a plain anchor for everything else. */
export function SmartLink({ link, children, ...rest }: Props) {
  const content = children ?? link.title;
  if (link.url.startsWith("/") && !link.target) {
    return (
      <Link href={link.url} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <a
      href={link.url}
      target={link.target ?? undefined}
      rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
      {...rest}
    >
      {content}
    </a>
  );
}
