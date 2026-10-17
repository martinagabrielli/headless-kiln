import type { ImageData, LinkData } from "@/lib/content/types";

/**
 * Field types for each block, in camelCase.
 *
 * These mirror wordpress/plugins/kiln-core/inc/schema.php. Fields an editor can
 * leave empty arrive as null, so they're typed that way and every component
 * handles the empty case.
 */

export type HeroFields = {
  eyebrow: string | null;
  heading: string;
  text: string | null;
  image: ImageData | null;
  primaryLink: LinkData | null;
  secondaryLink: LinkData | null;
};

export type PageHeaderFields = {
  eyebrow: string | null;
  heading: string;
  intro: string | null;
};

export type TextImageFields = {
  heading: string | null;
  /** HTML */
  text: string | null;
  image: ImageData | null;
  imagePosition: "left" | "right" | null;
  link: LinkData | null;
};

export type RichTextFields = {
  heading: string | null;
  /** HTML */
  content: string | null;
};

export type WorkshopsGridFields = {
  heading: string | null;
  intro: string | null;
  limit: number | null;
};

export type TestimonialsFields = {
  heading: string | null;
  items: { quote: string | null; name: string | null; detail: string | null }[];
};

export type FaqFields = {
  heading: string | null;
  /** answer is HTML */
  items: { question: string | null; answer: string | null }[];
};

export type GalleryFields = {
  heading: string | null;
  items: { image: ImageData | null; caption: string | null }[];
};

export type CtaFields = {
  heading: string;
  text: string | null;
  link: LinkData | null;
};

export type ContactFormFields = {
  heading: string | null;
  intro: string | null;
};

/** Block name -> its fields. The registry must cover every key. */
export type BlockFieldsMap = {
  "acf/hero": HeroFields;
  "acf/page-header": PageHeaderFields;
  "acf/text-image": TextImageFields;
  "acf/rich-text": RichTextFields;
  "acf/workshops-grid": WorkshopsGridFields;
  "acf/testimonials": TestimonialsFields;
  "acf/faq": FaqFields;
  "acf/gallery": GalleryFields;
  "acf/cta": CtaFields;
  "acf/contact-form": ContactFormFields;
};

export type BlockName = keyof BlockFieldsMap;

export type BlockProps<N extends BlockName> = {
  fields: BlockFieldsMap[N];
  anchor: string | null;
  /** True for the first block on the page: its image loads with priority. */
  isFirst: boolean;
  /** Unique on the page, for aria-labelledby between a section and its heading. */
  headingId: string;
};
