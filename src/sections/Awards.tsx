import { useRef, useState } from 'react';
import { Award as AwardIcon, ExternalLink, Medal, Star, Trophy, X, type LucideIcon } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useReveal } from '@/components/fx/useReveal';
import TiltCard from '@/components/fx/TiltCard';
import SectionHeading from '@/components/fx/SectionHeading';

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  medal: Medal,
  award: AwardIcon,
};

export default function Awards() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: awards, isLoading } = trpc.award.list.useQuery();
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null);

  useReveal(sectionRef, [awards]);

  return (
    <section
      id="awards"
      ref={sectionRef}
      className="relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker="/recognition"
          title="Milestones beyond the code"
          align="center"
          blurb="Verified achievements spanning AI innovation, interdisciplinary learning, and academic recognition."
        />

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-gray-500">Loading recognitions…</div>
        ) : awards && awards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {awards.map((award, i) => {
            const Icon = iconMap[award.iconName || 'award'] || AwardIcon;
            return (
              <div key={award.id} data-reveal="scale" data-reveal-delay={`${i * 0.1}`} className="will-reveal">
                <TiltCard className="glass card-hover border-sweep flex h-full flex-col overflow-hidden rounded-2xl" maxTilt={5}>
                  {award.image ? (
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ src: award.image!, alt: award.imageAlt || award.title, title: award.title })}
                      className="group relative block aspect-[16/10] w-full overflow-hidden border-b border-white/10 bg-black/20 text-left"
                      aria-label={`View ${award.title} image`}
                    >
                      <img
                        src={award.image}
                        alt={award.imageAlt || award.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-3 bottom-3 rounded-lg bg-black/65 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                        View image
                      </span>
                    </button>
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-white/10 bg-black/20">
                      <Icon className="h-10 w-10 text-[#e8b923]/70" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#e8b923]/30 bg-gradient-to-br from-[#e8b923]/15 to-[#7c5cff]/10">
                        <Icon className="h-5 w-5 text-[#e8b923]" />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#e8b923]">Verified</span>
                    </div>
                    {award.eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">{award.eyebrow}</p>}
                    <h3 className="mb-3 text-lg font-medium text-white">{award.title}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-gray-400">{award.description}</p>
                    {award.sourceUrl && (
                      <a
                        href={award.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#e8b923] transition-colors hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {award.sourceLabel || 'View source'}
                      </a>
                    )}
                  </div>
                </TiltCard>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-gray-500">No recognitions have been added yet.</div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedImage.title} image preview`}
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img src={selectedImage.src} alt={selectedImage.alt} className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <p className="mt-3 text-center font-mono text-xs uppercase tracking-[0.12em] text-gray-300">{selectedImage.title}</p>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -right-2 -top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white transition hover:border-[#e8b923] hover:text-[#e8b923]"
              aria-label="Close image preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
