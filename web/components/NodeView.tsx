import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { WorkshopHeader } from "@/components/workshop/WorkshopHeader";
import type { ContentNode } from "@/lib/content/types";

/** A page or workshop: workshops get their details header above the blocks. */
export function NodeView({ node }: { node: ContentNode }) {
  return (
    <>
      {node.kind === "workshop" && <WorkshopHeader workshop={node.workshop} />}
      <BlockRenderer blocks={node.blocks} />
    </>
  );
}
