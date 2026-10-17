import type { ComponentType } from "react";
import type { BlockData } from "@/lib/content/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { blockRegistry, isKnownBlock } from "./registry";

/**
 * Render a page's blocks in order.
 *
 * Unknown blocks render nothing in production, so a block added in WordPress
 * before the frontend knows about it can't break a page. In development they
 * show a warning in place, so the gap is obvious.
 */
export function BlockRenderer({ blocks }: { blocks: BlockData[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={`${block.name}-${index}`} block={block} index={index} />
      ))}
    </>
  );
}

function Block({ block, index }: { block: BlockData; index: number }) {
  if (isKnownBlock(block.name)) {
    // The registry is keyed by name, so this component matches these fields.
    const Component = blockRegistry[block.name] as ComponentType<Record<string, unknown>>;
    return (
      <Component
        fields={block.fields}
        anchor={block.anchor}
        isFirst={index === 0}
        headingId={`block-${index}-heading`}
      />
    );
  }

  if (block.html) {
    return <div className="rich-text mx-auto max-w-3xl px-5 py-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }} />;
  }

  if (process.env.NODE_ENV === "development") {
    return (
      <div role="note" className="mx-5 my-6 rounded-md border border-dashed border-iron/40 p-4 text-base">
        No component for block <code>{block.name}</code>. Add one to components/blocks/registry.ts.
      </div>
    );
  }
  return null;
}
