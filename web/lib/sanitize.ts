import sanitize from "sanitize-html";

/**
 * Clean HTML from the CMS before it's rendered.
 *
 * Editors can only produce formatted text, so anything beyond these tags is
 * removed rather than trusted. External links opening in a new tab get
 * rel="noopener noreferrer".
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitize(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li", "h3", "h4", "blockquote"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs:
          attribs.target === "_blank"
            ? { ...attribs, rel: "noopener noreferrer" }
            : attribs,
      }),
    },
  });
}

/** Plain text from HTML, for meta descriptions and the like. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitize(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}
