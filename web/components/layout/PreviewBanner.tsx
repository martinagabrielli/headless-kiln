/** Shown on every page while draft mode is on, so editors know what they're seeing. */
export function PreviewBanner() {
  return (
    <div role="status" className="bg-iron px-5 py-3 text-center text-sm text-porcelain">
      You&apos;re viewing a preview with unpublished changes.{" "}
      {/* A full page load on purpose: this route clears cookies, it isn't a page. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/draft/disable/" className="font-medium underline underline-offset-4">
        Exit preview
      </a>
    </div>
  );
}
