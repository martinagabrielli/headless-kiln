import { sanitizeHtml } from "@/lib/sanitize";

export function RichText({ html, className = "" }: { html: string | null | undefined; className?: string }) {
  const clean = sanitizeHtml(html);
  if (!clean) return null;
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
