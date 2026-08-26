import { useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { Github, ExternalLink, ChevronRight, ChevronLeft, X, BookOpen, ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useReveal } from '@/components/fx/useReveal';
import TiltCard from '@/components/fx/TiltCard';
import SectionHeading from '@/components/fx/SectionHeading';
import { useSettings } from '@/hooks/useSettings';
import {
  clearCaseStudyReturnContext,
  getCaseStudyOriginPath,
  readCaseStudyReturnContext,
  saveCaseStudyReturnContext,
} from '@/lib/caseStudyNavigation';

type ProjectLike = {
  id: number;
  title: string;
  description: string;
  techStack: unknown;
  githubUrl: string | null;
  liveUrl: string | null;
  videoUrl?: string | null;
  orderIndex: number | null;
  thumbnailUrl: string | null;
  screenshots: unknown;
  isFeatured?: boolean | null;
  slug?: string | null;
  caseStudyEnabled?: boolean | null;
  caseStudySummary?: string | null;
  problemStatement?: string | null;
  roleDescription?: string | null;
  outcomeSummary?: string | null;
  liveLabel?: string;
};

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

function ProjectScreenshotCarousel({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (images.length < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [images.length, paused, reducedMotion]);

  useEffect(() => {
    setActiveIndex(0);
  }, [images.join('|')]);

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label={images.length > 1 ? `${title} screenshots rotating automatically` : `${title} screenshot`}
    >
      {images.length > 0 ? images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={index === activeIndex ? `${title} screenshot ${index + 1}` : ''}
          aria-hidden={index === activeIndex ? undefined : true}
          loading={index === 0 ? 'lazy' : 'eager'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      )) : (
        <div className="flex h-full items-center justify-center bg-white/[0.03] px-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-gray-600">
          Preview unavailable
        </div>
      )}
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
          {images.map((image, index) => <span key={`${image}-dot`} className={`h-1 rounded-full transition-all duration-500 ${index === activeIndex ? 'w-5 bg-[#e8b923]' : 'w-1 bg-white/50'}`} />)}
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: dbProjects } = trpc.project.list.useQuery();
  const location = useLocation();
  const { getJson } = useSettings();
  const copy = getJson<{ projects?: Record<string, string> }>('sectionCopy', {});
  const projectCopy = copy.projects ?? {};
  const allLabel = projectCopy.all || 'All';
  const currentPath = getCaseStudyOriginPath(location);
  const projects = (dbProjects || []).filter((project) => project.isFeatured !== false) as ProjectLike[];
  const [filter, setFilter] = useState<string>(() => {
    const context = readCaseStudyReturnContext();
    return context?.originPath === currentPath && context.filter ? context.filter : allLabel;
  });
  const [selected, setSelected] = useState<ProjectLike | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selected?.id]);

  useEffect(() => {
    if (!dbProjects?.length) return;

    const context = readCaseStudyReturnContext();
    const returnState = location.state as { returnTo?: string } | null;
    const shouldReturnToProjects = returnState?.returnTo === 'projects'
      || Boolean(context && (context.originKey === location.key || context.originPath === currentPath));

    // Do not let ordinary Home loads consume a context created for another route.
    if (!shouldReturnToProjects) return;

    const fallbackTop = sectionRef.current ? Math.max(0, sectionRef.current.offsetTop - 24) : 0;
    const scrollTop = context?.scrollY ?? fallbackTop;
    let attempts = 0;
    let lastHeight = 0;
    let settledFrames = 0;
    let cancelled = false;

    const restoreScroll = () => {
      if (cancelled) return;
      const lenis = (window as unknown as {
        __lenis?: { scrollTo: (value: number, options?: { immediate?: boolean }) => void };
      }).__lenis;
      if (lenis) {
        lenis.scrollTo(scrollTop, { immediate: true });
      } else {
        window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
      }

      const height = document.documentElement.scrollHeight;
      settledFrames = height === lastHeight ? settledFrames + 1 : 0;
      lastHeight = height;
      attempts += 1;
      if (attempts < 24 && settledFrames < 2) {
        requestAnimationFrame(restoreScroll);
        return;
      }

      if (context) clearCaseStudyReturnContext();
      if (returnState?.returnTo === 'projects') {
        window.history.replaceState(null, document.title, window.location.href);
      }
    };

    const frame = requestAnimationFrame(restoreScroll);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [dbProjects, currentPath, location.key, location.state]);

  // Distinct tech tags for filtering
  const tags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => normalizeStringArray(p.techStack).forEach((t) => set.add(t)));
    return [projectCopy.all || 'All', ...Array.from(set).slice(0, 8)];
  }, [projects, projectCopy.all]);

  const visible = filter === allLabel ? projects : projects.filter((p) => normalizeStringArray(p.techStack).includes(filter));

  const getImages = (p: ProjectLike) => {
    const sources = [p.thumbnailUrl, ...normalizeStringArray(p.screenshots)].filter(Boolean) as string[];
    return Array.from(new Set(sources));
  };

  useReveal(sectionRef, [dbProjects, filter]);

  const getThumb = (p: ProjectLike) => p.thumbnailUrl || undefined;
  const getOwnershipLabel = (p: ProjectLike) => p.title.toLowerCase().includes('enterprise nexus')
    ? 'Team Lead · RAG & AI Integration · Documentation · Deployment · Security'
    : 'End-to-end ownership · Designed, built & deployed by Nazmus Sakib';

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="film-grain relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-deep)' }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker={projectCopy.kicker || ''}
          title={projectCopy.title || ''}
          blurb={projectCopy.blurb || ''}
        />

        {/* Filter pills */}
        <div data-reveal="up" className="will-reveal mb-12 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all duration-300 ${
                filter === tag
                  ? 'glow-gold bg-[#e8b923] text-[#05060f]'
                  : 'glass text-gray-400 hover:text-[#e8b923]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
                      {visible.length === 0 && <p className="col-span-full py-12 text-center text-sm text-gray-500">{projectCopy.empty || ''}</p>}
            {visible.map((project, i) => (

            <div
              key={project.id || i}
              data-reveal={i % 2 === 0 ? 'left' : 'right'}
              data-reveal-delay={`${(i % 2) * 0.12}`}
              className="will-reveal"
            >
              <TiltCard className="border-sweep glass card-hover group h-full rounded-3xl" maxTilt={4}>
                <div className="flex h-full flex-col">
                  <button
                    type="button"
                    className="block w-full flex-1 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8b923]"
                    onClick={() => setSelected(project)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(project);
                      }
                    }}
                    aria-label={`View details for ${project.title}`}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-t-3xl">
                      <ProjectScreenshotCarousel images={getImages(project)} title={project.title} />
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#05060f] via-transparent to-transparent" />
                    </div>
                    <div className="p-6 sm:p-7">
                      <h3 className="mb-2 text-xl font-medium text-white transition-colors group-hover:text-[#e8b923]">
                        {project.title}
                      </h3>
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#e8b923]/80">
                        {getOwnershipLabel(project)}
                      </p>
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-400">
                        {project.description}
                      </p>
                      {(project.problemStatement || project.outcomeSummary) && (
                        <div className="mb-5 grid gap-2 sm:grid-cols-2">
                          {project.problemStatement && <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8b923]/80">Problem</p><p className="line-clamp-2 text-xs leading-relaxed text-gray-400">{project.problemStatement}</p></div>}
                          {project.outcomeSummary && <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e8b923]/80">Outcome</p><p className="line-clamp-2 text-xs leading-relaxed text-gray-400">{project.outcomeSummary}</p></div>}
                        </div>
                      )}
                      <div className="mb-5 flex flex-wrap gap-2">
                        {normalizeStringArray(project.techStack).slice(0, 5).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full border border-[#e8b923]/20 bg-[#e8b923]/5 px-2.5 py-1 font-mono text-[11px] text-[#e8b923]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 pb-6 sm:px-7">
                    <button
                      type="button"
                      onClick={() => setSelected(project)}
                      className="inline-flex items-center gap-1 text-sm text-[#e8b923] transition-colors hover:text-[#f5cd45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b17]"
                    >
                      {projectCopy.details || ''}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                    {project.caseStudyEnabled && project.slug && (
                      <Link
                        to={`/projects/${project.slug}/case-study`}
                        state={{ caseStudyOrigin: true }}
                        onClick={() => {
                          const lenis = (window as unknown as { __lenis?: { scroll?: number } }).__lenis;
                          saveCaseStudyReturnContext({
                            originPath: currentPath,
                            originKey: location.key,
                            scrollY: Number.isFinite(lenis?.scroll) ? Number(lenis?.scroll) : window.scrollY,
                            filter,
                            projectSlug: project.slug || '',
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e8b923]/30 bg-[#e8b923]/[0.06] px-3 py-1.5 text-xs font-medium text-[#f5cd45] transition-all hover:border-[#e8b923]/65 hover:bg-[#e8b923]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Explore Case Study <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>

      {/* Project detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-details-title"
            onKeyDown={(event) => { if (event.key === 'Escape') setSelected(null); }}
            className="glass-strong project-details-panel max-h-[88vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl"
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video">
              {(() => {
                const gallery = getImages(selected);
                const activeIndex = Math.min(selectedImageIndex, Math.max(gallery.length - 1, 0));
                const activeImage = gallery[activeIndex] || getThumb(selected);
                return (
                  <>
                    {activeImage ? (
                      <img src={activeImage} alt={`${selected.title} preview ${activeIndex + 1}`} className="h-full w-full rounded-t-3xl object-cover transition-opacity duration-500" />
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-t-3xl bg-white/[0.03] font-mono text-xs uppercase tracking-[0.2em] text-gray-600">
                        Preview unavailable
                      </div>
                    )}
                    {gallery.length > 1 && (
                      <>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedImageIndex((activeIndex - 1 + gallery.length) % gallery.length); }} className="glass-strong absolute top-1/2 left-4 -translate-y-1/2 rounded-full p-2 text-white transition-colors hover:text-[#e8b923]" aria-label="Previous screenshot">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedImageIndex((activeIndex + 1) % gallery.length); }} className="glass-strong absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-2 text-white transition-colors hover:text-[#e8b923]" aria-label="Next screenshot">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
                          {gallery.map((_, index) => <button key={index} type="button" onClick={(event) => { event.stopPropagation(); setSelectedImageIndex(index); }} aria-label={`Show screenshot ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-[#e8b923]' : 'w-1.5 bg-white/50'}`} />)}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="glass-strong absolute top-4 right-4 rounded-full p-2 text-white transition-colors hover:text-[#e8b923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-7">
              <h3 id="project-details-title" className="mb-3 text-2xl font-medium text-white">{selected.title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-gray-300">{selected.description}</p>
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e8b923]/20 bg-[#e8b923]/[0.04] p-4"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#e8b923]">Ownership</p><p className="text-xs leading-relaxed text-gray-400">{getOwnershipLabel(selected)}</p></div>
                {selected.problemStatement && <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Problem</p><p className="text-xs leading-relaxed text-gray-400">{selected.problemStatement}</p></div>}
                {selected.outcomeSummary && <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Outcome</p><p className="text-xs leading-relaxed text-gray-400">{selected.outcomeSummary}</p></div>}
              </div>
              <div className="mb-6 flex flex-wrap gap-2">
                {normalizeStringArray(selected.techStack).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-[#e8b923]/20 bg-[#e8b923]/5 px-3 py-1 font-mono text-xs text-[#e8b923]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              {getImages(selected).length > 1 && (
                <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
                  {getImages(selected).map((image, index) => (
                    <button key={image} type="button" onClick={() => setSelectedImageIndex(index)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-all ${index === selectedImageIndex ? 'border-[#e8b923] ring-2 ring-[#e8b923]/30' : 'border-white/10 opacity-70 hover:opacity-100'}`} aria-label={`Select screenshot ${index + 1}`}>
                      <img src={image} alt={`${selected.title} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4">
                {selected.githubUrl && selected.githubUrl !== '#' && (
                  <a
                    href={selected.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white transition-colors hover:text-[#e8b923]"
                  >
                    <Github className="h-4 w-4" />
                    Source Code
                  </a>
                )}
                {selected.liveUrl && selected.liveUrl !== '#' && (
                  <a
                    href={selected.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#e8b923] px-5 py-2.5 text-sm font-medium text-[#05060f] transition-colors hover:bg-[#f5cd45]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {'liveLabel' in selected && selected.liveLabel
                      ? selected.liveLabel
                      : selected.title.toLowerCase().includes('radar')
                        ? 'Live Video'
                        : 'Live Demo'}
                  </a>
                )}
                {selected.videoUrl && selected.videoUrl !== '#' && (
                  <a
                    href={selected.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]"
                  >
                    <ExternalLink className="h-4 w-4" /> Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
