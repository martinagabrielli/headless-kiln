/**
 * Server configuration, read once.
 *
 * With no GRAPHQL_ENDPOINT the app runs in fixture mode on the bundled demo
 * content (content/kiln-studio.json), so it builds and deploys without a
 * WordPress install. Everything else is optional and only switches features
 * on: previews need the preview secret and an application password, the
 * contact form needs the enquiry secret, revalidation needs its secret.
 */

function optional(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

const graphqlEndpoint = optional("GRAPHQL_ENDPOINT");

export const env = {
  graphqlEndpoint,
  /** Origin of the WordPress install, e.g. http://localhost:8888. */
  wordpressOrigin: graphqlEndpoint ? new URL(graphqlEndpoint).origin : null,
  siteUrl: (optional("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
  revalidationSecret: optional("REVALIDATION_SECRET"),
  previewSecret: optional("PREVIEW_SECRET"),
  previewUser: optional("WP_PREVIEW_USER"),
  previewPassword: optional("WP_PREVIEW_PASSWORD"),
  enquirySecret: optional("ENQUIRY_SECRET"),
} as const;

export const isFixtureMode = env.graphqlEndpoint === null;
