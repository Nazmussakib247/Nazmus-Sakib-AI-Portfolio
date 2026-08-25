import { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useSettings } from '@/hooks/useSettings';
import { useReveal } from '@/components/fx/useReveal';
import SectionHeading from '@/components/fx/SectionHeading';

export default function AcademicFoundation() {
  const sectionRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { data: foundation, isLoading } = trpc.academicFoundation.list.useQuery();
  const { getJson } = useSettings();
  const copy = getJson<{ academicFoundation?: Record<string, string> }>('sectionCopy', {});
  const academicCopy = copy.academicFoundation || {};
  const categories = foundation || [];
  const visibleCourses = useMemo(
    () => categories.flatMap((category) => category.courses || []),
    [categories],
  );
  const featuredCourses = visibleCourses.filter((course) => course.isFeatured);
  const selectedNames = featuredCourses.map((course) => course.name).join(' · ');

  useReveal(sectionRef, [foundation]);

  return (
    <section
      id="academic-foundation"
      ref={sectionRef}
      className="relative w-full overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8b923]/45 to-transparent" />
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          kicker={academicCopy.kicker || '/academic-foundation'}
          title={academicCopy.title || 'Academic Foundation'}
          blurb={academicCopy.blurb || 'A completed Computer Science and Engineering curriculum spanning software engineering, algorithms, artificial intelligence, systems, and applied mathematics.'}
        />

        {isLoading ? (
          <div className="h-40 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]" />
        ) : !visibleCourses.length ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-gray-500">{academicCopy.empty || 'Academic coursework will appear here soon.'}</div>
        ) : (
          <div data-reveal="up" className="will-reveal glass rounded-3xl p-5 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8b923]">{academicCopy.selectedLabel || 'Selected coursework'}</span>
                <h3 className="mt-2 text-xl text-white">Foundations behind the work</h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">{featuredCourses.length} of {visibleCourses.length} selected</span>
            </div>

            <p className="mt-5 text-sm leading-8 text-gray-300 sm:text-base sm:leading-9">{selectedNames}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600">{visibleCourses.length} completed courses · {categories.length} academic areas</span>
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                className="group inline-flex items-center gap-2 rounded-full border border-[#e8b923]/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#e8b923] transition-colors hover:border-[#e8b923] hover:bg-[#e8b923]/[0.08]"
              >
                {expanded ? 'Hide full list' : academicCopy.completeLabel || 'View complete coursework'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {expanded && (
              <div className="mt-6 grid gap-x-8 gap-y-6 border-t border-white/8 pt-6 md:grid-cols-2">
                {categories.map((category, index) => {
                  const courseNames = (category.courses || []).map((course) => course.name).join(' · ');
                  return (
                    <article key={category.id} className="border-l border-[#e8b923]/30 pl-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-[0.16em] text-[#e8b923]">{String(index + 1).padStart(2, '0')}</span>
                        <span className="h-px w-6 bg-[#e8b923]/35" />
                        <h4 className="text-sm font-medium text-white">{category.name}</h4>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-gray-500">{courseNames}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
