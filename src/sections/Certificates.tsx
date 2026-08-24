import { useMemo, useRef, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { ExternalLink, Award, ChevronLeft, ChevronRight, Plane, X } from 'lucide-react';
import { useReveal } from '@/components/fx/useReveal';
import SectionHeading from '@/components/fx/SectionHeading';
import { useSettings } from '@/hooks/useSettings';

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

export default function Certificates() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { data: dbCerts } = trpc.certificate.list.useQuery();
  const { getJson } = useSettings();
  const copy = getJson<{ certificates?: Record<string, string> }>('sectionCopy', {});
  const certificateCopy = copy.certificates ?? {};
  const certs = dbCerts || [];
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(certs.map((cert) => cert.category?.trim()).filter((category): category is string => Boolean(category))))],
    [certs]
  );
  const filteredCerts = activeCategory === 'All' ? certs : certs.filter((cert) => (cert.category || 'General') === activeCategory);

  useReveal(sectionRef, [dbCerts, activeCategory]);

  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section
      id="certificates"
      ref={sectionRef}
      className="relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-deep)' }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between">
          <SectionHeading
            kicker={certificateCopy.kicker || ''}
            title={certificateCopy.title || ''}
            blurb={certificateCopy.blurb || ''}
          />
          <div data-reveal="right" className="will-reveal mb-14 hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="glass rounded-full p-3 text-gray-400 transition-colors hover:text-[#e8b923]"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="glass rounded-full p-3 text-gray-400 transition-colors hover:text-[#e8b923]"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!dbCerts || categories.length > 1 ? (
          <div data-reveal="up" className="will-reveal mb-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all duration-300 ${activeCategory === category ? 'glow-gold bg-[#e8b923] text-[#05060f]' : 'glass text-gray-400 hover:text-[#e8b923]'}`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}

        <div
          ref={scrollerRef}
          data-reveal="up"
          className="certificate-scroller will-reveal flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
        >
          {filteredCerts.length === 0 && <p className="w-full py-12 text-center text-sm text-gray-500">{certificateCopy.empty || ''}</p>}
          {filteredCerts.map((cert, i) => (
            <div
              key={cert.id || i}
              className="glass card-hover border-sweep w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-2xl p-6 sm:w-[320px]"
            >
              {cert.thumbnailUrl ? (
                <button
                  onClick={() => setLightbox(cert.thumbnailUrl!)}
                  className="group/img -mx-6 -mt-6 mb-5 block aspect-[4/3] w-[calc(100%+3rem)] overflow-hidden bg-white/[0.03] p-2"
                  aria-label={`View ${cert.title} certificate`}
                >
                  <img
                    src={cert.thumbnailUrl}
                    alt={cert.title}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-700 group-hover/img:scale-[1.03]"
                  />
                </button>
              ) : (
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#e8b923]/25 bg-[#e8b923]/8">
                  <Award className="h-5 w-5 text-[#e8b923]" />
                </div>
              )}
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#e8b923]/20 bg-[#e8b923]/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#e8b923]">
                  {cert.category || 'General'}
                </span>
                {cert.issueDate && (
                  <span className="font-mono text-[10px] text-gray-600">
                    {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              <h3 className="mb-1 line-clamp-2 text-base font-medium text-white">{cert.title}</h3>
              <p className="mb-3 text-sm text-gray-500">{cert.issuer}</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {normalizeStringArray(cert.skillsGained).slice(0, 4).map((skill) => (
                  <span key={skill} className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-400">
                    {skill}
                  </span>
                ))}
              </div>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#e8b923] transition-colors hover:text-[#f5cd45]"
                >
                  {certificateCopy.verify || ''}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="certificate-travel-guide" aria-hidden="true">
          <span className="certificate-travel-start" />
          <div className="certificate-travel-line">
            <Plane className="certificate-travel-plane" strokeWidth={1.8} />
          </div>
          <span className="certificate-travel-label">{certificateCopy.collection || ''}</span>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Certificate"
            className="max-h-[88vh] max-w-full rounded-xl border border-white/10 object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="glass-strong absolute top-5 right-5 rounded-full p-2.5 text-white transition-colors hover:text-[#e8b923]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
