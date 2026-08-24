/** Consistent animated section heading: mono kicker + big headline + optional blurb. */
export default function SectionHeading({
  kicker,
  title,
  blurb,
  align = 'left',
}: {
  kicker: string;
  title: string;
  blurb?: string;
  align?: 'left' | 'center';
}) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : '';
  return (
    <div className={`mb-14 max-w-3xl ${alignCls}`}>
      <span
        data-reveal="up"
        className="will-reveal mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#e8b923]"
      >
        <span className="inline-block h-px w-8 bg-[#e8b923]/60" />
        {kicker}
        {align === 'center' && <span className="inline-block h-px w-8 bg-[#e8b923]/60" />}
      </span>
      <h2
        data-reveal="up"
        data-reveal-delay="0.08"
        className="will-reveal text-gradient-chrome text-3xl font-semibold sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {blurb && (
        <p
          data-reveal="up"
          data-reveal-delay="0.16"
          className="will-reveal mt-4 text-sm leading-relaxed text-gray-400 sm:text-base"
        >
          {blurb}
        </p>
      )}
    </div>
  );
}
