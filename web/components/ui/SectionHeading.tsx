/**
 * The heading at the top of a block. Renders nothing when the editor left it
 * empty, so blocks can be used without a title.
 */
export function SectionHeading({
  id,
  heading,
  intro,
  className = "",
}: {
  id: string;
  heading: string | null | undefined;
  intro?: string | null;
  className?: string;
}) {
  if (!heading && !intro) return null;
  return (
    <div className={`mb-10 max-w-3xl md:mb-14 ${className}`}>
      {heading && (
        <h2 id={id} className="text-headline">
          {heading}
        </h2>
      )}
      {intro && <p className="mt-4 text-lede text-iron-soft">{intro}</p>}
    </div>
  );
}
