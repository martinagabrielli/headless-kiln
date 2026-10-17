import type { LinkData } from "@/lib/content/types";
import { SmartLink } from "./SmartLink";

export const buttonStyles = {
  base: "inline-flex min-h-12 items-center justify-center rounded-md px-6 text-base font-medium transition-colors duration-150",
  primary: "bg-cobalt text-porcelain hover:bg-cobalt-deep",
  secondary: "border border-iron/30 text-iron hover:border-iron hover:bg-iron/5",
  inverse: "bg-porcelain text-cobalt hover:bg-white",
} as const;

export function ButtonLink({
  link,
  variant = "primary",
  className = "",
}: {
  link: LinkData;
  variant?: Exclude<keyof typeof buttonStyles, "base">;
  className?: string;
}) {
  return <SmartLink link={link} className={`${buttonStyles.base} ${buttonStyles[variant]} ${className}`} />;
}
