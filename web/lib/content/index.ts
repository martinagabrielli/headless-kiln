import "server-only";
import { cache } from "react";
import { isFixtureMode } from "@/lib/env";
import { fixtureSource } from "./fixtures";
import { graphqlSource } from "./graphql";
import type { ContentSource } from "./types";

/**
 * The content source for this deployment: WordPress when GRAPHQL_ENDPOINT is
 * set, otherwise the bundled fixtures.
 *
 * Each read is wrapped in React's cache(), so a page and its metadata asking
 * for the same node in one request make a single call.
 */
const source: ContentSource = isFixtureMode ? fixtureSource : graphqlSource;

export const getNodeByUri = cache(source.getNodeByUri);
export const getPreviewNode = cache(source.getPreviewNode);
export const getAllUris = cache(source.getAllUris);
export const getWorkshops = cache(source.getWorkshops);
export const getSiteSettings = cache(source.getSiteSettings);
export const getMenu = cache(source.getMenu);

export type * from "./types";
