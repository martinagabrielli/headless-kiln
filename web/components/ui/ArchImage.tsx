import Image from "next/image";
import type { ImageData } from "@/lib/content/types";

/**
 * An image in a kiln-arch frame: the site's one signature shape. Used for
 * featured images only, so it keeps its meaning.
 */
export function ArchImage({
  image,
  sizes,
  priority = false,
  className = "",
}: {
  image: ImageData;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-t-[999px] bg-slip ${className}`}
      style={{ aspectRatio: `${image.width} / ${image.height}` }}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
