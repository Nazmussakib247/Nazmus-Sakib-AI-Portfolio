import { useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { ArrowUpRight, FileText, BookOpen, Newspaper, Globe2, ChevronDown } from 'lucide-react';
import { useReveal } from '@/components/fx/useReveal';
import TiltCard from '@/components/fx/TiltCard';
import SectionHeading from '@/components/fx/SectionHeading';
import { useSettings } from '@/hooks/useSettings';

const platformIcon: Record<string, React.ElementType> = {
  medium: BookOpen,
  pdf: FileText,
  blogspot: Newspaper,
};

export default function Blog() {
  const sectionRef = useRef<HTMLElement>(null);
  const { get, getJson } = useSettings();
  const copy = getJson<{ blog?: Record<string, string> }>('sectionCopy', {});
  const blogCopy = copy.blog ?? {};
  const { data: dbWritings, isLoading } = trpc.writing.list.useQuery();
  const writings = useMemo(() => dbWritings ?? [], [dbWritings]);
  const allLabel = blogCopy.all || 'All';
  const [activeCategory, setActiveCategory] = useState(allLabel);
  const [visibleAdditionalCount, setVisibleAdditionalCount] = useState(0);
  const categories = useMemo(
    () => [allLabel, ...Array.from(new Set(writings.map((post) => post.category).filter((category): category is string => Boolean(category))))],
    [writings, allLabel]
  );
  const categoryWritings = activeCategory === allLabel ? writings : writings.filter((post) => post.category === activeCategory);
  const featuredWritings = categoryWritings.filter((post) => post.isFeatured);
  const moreWritings = categoryWritings.filter((post) => !post.isFeatured);
  const displayedWritings = [...featuredWritings, ...moreWritings.slice(0, visibleAdditionalCount)];
  const remainingWritings = Math.max(0, moreWritings.length - visibleAdditionalCount);

  useEffect(() => {
    setVisibleAdditionalCount(0);
  }, [activeCategory]);

  useReveal(sectionRef, [dbWritings, activeCategory, visibleAdditionalCount]);

  return (
    <section
      id="blog"
      ref={sectionRef}
      className="bg-radial-fade relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker={blogCopy.kicker || ''}
          title={blogCopy.title || ''}
          blurb={blogCopy.blurb || ''}
        />

        <a href={get('bloggerUrl')} target="_blank" rel="noopener noreferrer" data-reveal="up" className="glass card-hover group mb-10 flex items-center justify-between gap-4 rounded-2xl p-5 will-reveal">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e8b923]/25 bg-[#e8b923]/8"><Globe2 className="h-5 w-5 text-[#e8b923]" /></span>
            <div><div className="text-sm font-medium text-white">{blogCopy.bloggerCta || ''}</div><div className="text-xs text-gray-500">{blogCopy.bloggerBlurb || ''}</div></div>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-500 transition-colors group-hover:text-[#e8b923]" />
        </a>

        {!isLoading && writings.length > 0 && (
          <div data-reveal="up" className="will-reveal mb-10 flex flex-wrap gap-2">
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
        )}
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">{blogCopy.loading || ''}</div>
        ) : writings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">{blogCopy.empty || ''}</div>
        ) : (
          <>
            {displayedWritings.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">
                {blogCopy.featuredEmpty || 'No featured articles in this category yet.'}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayedWritings.map((post, i) => {
                  const Icon = platformIcon[post.platform || 'medium'] || BookOpen;
                  return (
                    <div key={post.id || i} data-reveal="up" data-reveal-delay={`${(i % 3) * 0.1}`} className="will-reveal">
                      <a
                        href={post.externalUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block h-full"
                      >
                        <TiltCard className="glass card-hover border-sweep flex h-full flex-col rounded-2xl p-6" maxTilt={5}>
                          {post.coverImageUrl && (
                            <div className="-mx-6 -mt-6 mb-5 aspect-[16/9] overflow-hidden rounded-t-2xl">
                              <img
                                src={post.coverImageUrl}
                                alt={post.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            </div>
                          )}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="rounded-full border border-[#e8b923]/20 bg-[#e8b923]/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#e8b923]">
                              {post.category || blogCopy.articleLabel || ''}
                            </span>
                            <Icon className="h-4 w-4 text-gray-500" />
                          </div>
                          <h3 className="mb-2 text-lg font-medium text-white transition-colors group-hover:text-[#e8b923]">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-400">
                              {post.excerpt}
                            </p>
                          )}
                          <span className="mt-auto inline-flex items-center gap-1 text-sm text-[#e8b923]">
                            {blogCopy.readLabel || 'Read Article'}
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </TiltCard>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
            {remainingWritings > 0 && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  aria-label={`Load 6 more articles; ${remainingWritings} remaining`}
                  onClick={() => setVisibleAdditionalCount((current) => Math.min(current + 6, moreWritings.length))}
                  className="glass inline-flex items-center gap-2 rounded-full border border-[#e8b923]/25 px-5 py-2.5 text-sm text-[#e8b923] transition-all duration-300 hover:border-[#e8b923]/60 hover:bg-[#e8b923]/10"
                >
                  {blogCopy.readMore || 'Read More'} · {Math.min(6, remainingWritings)} more
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
