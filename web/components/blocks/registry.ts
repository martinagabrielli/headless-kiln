import type { ComponentType } from "react";
import type { BlockName, BlockProps } from "@/lib/blocks/fields";
import { ContactForm } from "./ContactForm";
import { Cta } from "./Cta";
import { Faq } from "./Faq";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import { PageHeader } from "./PageHeader";
import { RichTextBlock } from "./RichTextBlock";
import { Testimonials } from "./Testimonials";
import { TextImage } from "./TextImage";
import { WorkshopsGrid } from "./WorkshopsGrid";

/**
 * WordPress block name -> React component.
 *
 * The mapped type makes this exhaustive: add a block to BlockFieldsMap and
 * TypeScript fails until it has a component here. A unit test also checks this
 * list against the block.json files in the WordPress plugin.
 */
export const blockRegistry: { [N in BlockName]: ComponentType<BlockProps<N>> } = {
  "acf/hero": Hero,
  "acf/page-header": PageHeader,
  "acf/text-image": TextImage,
  "acf/rich-text": RichTextBlock,
  "acf/workshops-grid": WorkshopsGrid,
  "acf/testimonials": Testimonials,
  "acf/faq": Faq,
  "acf/gallery": Gallery,
  "acf/cta": Cta,
  "acf/contact-form": ContactForm,
};

export function isKnownBlock(name: string): name is BlockName {
  return Object.hasOwn(blockRegistry, name);
}
