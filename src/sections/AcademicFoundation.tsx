import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BookOpenCheck, BriefcaseBusiness, Calculator, CheckCircle2, ChevronDown, Cpu, GraduationCap, Layers3, Sparkles } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useSettings } from '@/hooks/useSettings';
import { useReveal } from '@/components/fx/useReveal';
import SectionHeading from '@/components/fx/SectionHeading';

const categoryIcons = [Layers3, Sparkles, BookOpenCheck, Cpu, Calculator, BriefcaseBusiness];
const categoryColors = ['#e8b923', '#a78bfa', '#60a5fa', '#4ade80', '#f59e0b', '#f472b6'];

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

  useReveal(sectionRef, [foundation]);

  return (
    <section
      id="academic-foundation"
      ref={sectionRef}
      className="relative w-full overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8b923]/45 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker={academicCopy.kicker || '/academic-foundation'}
          title={academicCopy.title || 'Academic Foundation'}
          blurb={academicCopy.blurb || 'A completed Computer Science and Engineering curriculum spanning software engineering, algorithms, artificial intelligence, systems, and applied mathematics.'}
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />)}
          </div>
        ) : !visibleCourses.length ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-gray-500">{academicCopy.empty || 'Academic coursework will appear here soon.'}</div>
        ) : (
          <>
            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              <div className="glass rounded-2xl p-4">
                <div className="mb-2 flex items-center gap-2 text-[#e8b923]"><GraduationCap className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Curriculum</span></div>
                <div className="text-2xl text-white">{visibleCourses.length}</div>
                <div className="text-xs text-gray-500">completed courses</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="mb-2 flex items-center gap-2 text-[#a78bfa]"><Layers3 className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Coverage</span></div>
                <div className="text-2xl text-white">{categories.length}</div>
                <div className="text-xs text-gray-500">academic areas</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Applied</span></div>
                <div className="text-2xl text-white">{featuredCourses.length}</div>
                <div className="text-xs text-gray-500">selected for focus</div>
              </div>
            </div>

            <div data-reveal="up" className="will-reveal glass mb-6 rounded-[28px] p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8b923]">{academicCopy.selectedLabel || 'Selected coursework'}</span>
                  <h3 className="mt-2 text-xl text-white">Foundations behind the work</h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-gray-500">{featuredCourses.length} highlighted</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCourses.map((course) => {
                  const category = categories.find((item) => item.id === course.categoryId);
                  return (
                    <div key={course.id} className="group rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e8b923]/35 hover:bg-[#e8b923]/[0.04]">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e8b923]/20 bg-[#e8b923]/8 text-[#e8b923]"><BookOpenCheck className="h-4 w-4" /></span>
                        <ArrowUpRight className="h-4 w-4 text-gray-700 transition-colors group-hover:text-[#e8b923]" />
                      </div>
                      <h4 className="text-sm leading-snug text-gray-100">{course.name}</h4>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#a78bfa]">{category?.name || 'Academic foundation'}</p>
                      {course.relatedProject && <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500"><BriefcaseBusiness className="h-3 w-3 shrink-0 text-[#e8b923]" />{academicCopy.relatedLabel || 'Applied in'} {course.relatedProject}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                className="group inline-flex items-center gap-2 rounded-full border border-[#e8b923]/35 bg-[#e8b923]/[0.06] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#e8b923] transition-all hover:border-[#e8b923] hover:bg-[#e8b923]/[0.12]"
              >
                {expanded ? 'Hide complete coursework' : academicCopy.completeLabel || 'View complete coursework'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {expanded && (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {categories.map((category, index) => {
                  const Icon = categoryIcons[index % categoryIcons.length];
                  const color = categoryColors[index % categoryColors.length];
                  return (
                    <article key={category.id} className="glass card-hover rounded-2xl p-5" style={{ borderColor: `${color}22` }}>
                      <div className="mb-4 flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}><Icon className="h-5 w-5" /></span>
                        <div>
                          <h3 className="text-sm font-medium text-white">{category.name}</h3>
                          {category.description && <p className="mt-1 text-xs leading-relaxed text-gray-500">{category.description}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(category.courses || []).map((course) => (
                          <div key={course.id} className="rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5">
                            <div className="flex items-start gap-2 text-sm text-gray-200"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />{course.name}</div>
                            {course.shortDescription && <p className="mt-1 pl-3.5 text-xs leading-relaxed text-gray-500">{course.shortDescription}</p>}
                            {course.relatedProject && <p className="mt-1.5 pl-3.5 text-[10px] uppercase tracking-[0.12em] text-[#a78bfa]">{academicCopy.relatedLabel || 'Applied in'} {course.relatedProject}</p>}
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
