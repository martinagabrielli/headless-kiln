import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isKnownBlock } from "@/components/blocks/registry";
import { fixtureSource } from "@/lib/content/fixtures";

const root = path.resolve(import.meta.dirname, "../..");
const pluginBlocks = path.resolve(root, "../wordpress/plugins/kiln-core/blocks");

describe("block registry", () => {
  it("has a component for every block WordPress registers, and nothing extra", async () => {
    const wordpressNames = readdirSync(pluginBlocks)
      .map((dir) => JSON.parse(readFileSync(path.join(pluginBlocks, dir, "block.json"), "utf8")).name as string)
      .sort();
    const { blockRegistry } = await import("@/components/blocks/registry");
    expect(Object.keys(blockRegistry).sort()).toEqual(wordpressNames);
  });
});

describe("fixture content", () => {
  it("uses only known blocks", async () => {
    for (const uri of await fixtureSource.getAllUris()) {
      const node = await fixtureSource.getNodeByUri(uri);
      for (const block of node!.blocks) {
        expect(isKnownBlock(block.name), `${block.name} on ${uri}`).toBe(true);
      }
    }
  });

  it("points at image files that exist", async () => {
    const workshops = await fixtureSource.getWorkshops();
    const nodes = await Promise.all((await fixtureSource.getAllUris()).map((uri) => fixtureSource.getNodeByUri(uri)));
    const urls = new Set<string>(workshops.flatMap((workshop) => (workshop.image ? [workshop.image.url] : [])));
    JSON.stringify(nodes, (key, value) => {
      if (key === "url" && typeof value === "string" && value.startsWith("/demo/")) urls.add(value);
      return value;
    });
    expect(urls.size).toBeGreaterThan(5);
    for (const url of urls) {
      expect(existsSync(path.join(root, "public", url)), url).toBe(true);
    }
  });

  it("resolves images inside repeater rows", async () => {
    const about = await fixtureSource.getNodeByUri("/about/");
    const gallery = about!.blocks.find((block) => block.name === "acf/gallery")!;
    const items = gallery.fields.items as { image: { url: string; width: number } }[];
    expect(items[0]!.image).toMatchObject({ url: "/demo/gallery-1.webp", width: 1000 });
  });
});
