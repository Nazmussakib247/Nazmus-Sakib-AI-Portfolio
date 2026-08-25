import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  BrainCircuit,
  FolderKanban,
  Mail,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useSettings, type SectionKey } from '@/hooks/useSettings';
import { scrollToId } from '@/components/fx/SmoothScroll';

type NavItem = { label: string; id: string; section?: SectionKey };
type SearchItem = { label: string; hint: string; id: string; icon?: string };

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

const searchIconMap = {
  projects: FolderKanban,
  experience: BriefcaseBusiness,
  ai: BrainCircuit,
  skills: Sparkles,
  certificates: BadgeCheck,
  contact: Mail,
} as const;

export default function Navigation() {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { get, isVisible } = useSettings();
  const allNavItems = parseJsonArray<NavItem>(get('navigationItems'));
  const frequentSearches = parseJsonArray<SearchItem>(get('searchSuggestions'));
  const configuredFoundation = allNavItems.find((item) => item.id === 'academic-foundation');
  const navItemsWithoutFoundation = allNavItems.filter((item) => item.id !== 'academic-foundation');
  const foundationItem: NavItem = {
    ...(configuredFoundation || {}),
    label: 'Foundation',
    id: 'academic-foundation',
    section: 'academicFoundation',
  };
  const experienceIndex = navItemsWithoutFoundation.findIndex((item) => item.id === 'experience');
  const foundationIndex = experienceIndex >= 0 ? experienceIndex + 1 : Math.min(3, navItemsWithoutFoundation.length);
  const navItemsWithAcademicFoundation = [
    ...navItemsWithoutFoundation.slice(0, foundationIndex),
    foundationItem,
    ...navItemsWithoutFoundation.slice(foundationIndex),
  ];
  const navItems = navItemsWithAcademicFoundation.filter((i) => i.label && i.id && (!i.section || isVisible(i.section)));

  const filteredSearches = frequentSearches.filter((item) => item.label && item.id &&
    `${item.label} ${item.hint}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.7);
      const ids = ['hero', ...navItems.map((i) => i.id)];
      for (let i = ids.length - 1; i >= 0; i -= 1) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 160) {
          setActiveSection(ids[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const go = (id: string) => {
    scrollToId(id);
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery('');
  };

  const toggleSearch = () => {
    setSearchOpen((current) => !current);
    setQuery('');
  };

  return (
    <>
      {/* Desktop floating pill */}
      <nav
        className={`fixed left-1/2 top-4 z-50 hidden -translate-x-1/2 transition-all duration-500 md:block ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-5 opacity-0'
        }`}
      >
        <div className="glass-strong relative isolate flex items-center gap-1 rounded-full px-2 py-2">
          <button
            type="button"
            onClick={() => go('hero')}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs font-semibold text-[#e8b923] transition-all hover:bg-[#e8b923]/10"
            aria-label="Back to the top of the portfolio"
          >
            <span>NS</span>
            <span className="relative flex h-2 w-2 items-center justify-center" aria-label="Active">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/35 motion-reduce:hidden" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.9)]" />
            </span>
          </button>
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => go(item.id)}
              className={`relative rounded-full px-3 py-1.5 text-xs transition-all duration-300 ${
                activeSection === item.id
                  ? 'bg-[#e8b923]/10 text-[#e8b923]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
              {activeSection === item.id && (
                <span className="absolute -bottom-0.5 left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-full bg-[#e8b923]" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={toggleSearch}
            aria-label="Search the portfolio"
            aria-expanded={searchOpen}
            className={`ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
              searchOpen
                ? 'border-[#e8b923]/60 bg-[#e8b923]/10 text-[#f5cd45]'
                : 'border-white/10 text-gray-400 hover:border-[#e8b923]/45 hover:bg-white/5 hover:text-white'
            }`}
          >
            {searchOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          </button>

          {searchOpen && (
            <div
              data-lenis-prevent="true"
              onWheel={(event) => event.stopPropagation()}
              className="search-suggestion-scroll absolute right-0 top-[calc(100%+0.75rem)] z-[60] flex max-h-[min(360px,calc(100dvh-8rem))] w-[min(390px,calc(100vw-2rem))] origin-top-right flex-col overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#080b17] p-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.62)] ring-1 ring-black/40 backdrop-blur-2xl touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarGutter: 'stable' }}
            >
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-[#e8b923]" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredSearches[0]) go(filteredSearches[0].id);
                  }}
                  placeholder="Search projects, skills, experience…"
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
                  aria-label="Search portfolio sections"
                />
                <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-gray-600 sm:inline-block">ESC</kbd>
              </div>
              <div className="mb-2 mt-3 flex items-center justify-between px-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-600">Frequently explored</p>
                <span className="font-mono text-[9px] text-gray-700">{filteredSearches.length} results</span>
              </div>
              <div className="space-y-1 pr-1">
                {filteredSearches.map((item) => {
                  const Icon = searchIconMap[item.icon as keyof typeof searchIconMap] || FolderKanban;
                  return (
                  <button
                    type="button"
                    key={`${item.id}-${item.label}`}
                                          onClick={() => go(item.id)}

                    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 transition-colors group-hover:border-[#e8b923]/35 group-hover:text-[#e8b923]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                                          <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-gray-200 group-hover:text-white">{item.label}</span>
                      <span className="block truncate text-[10px] text-gray-600">{item.hint}</span>
                    </span>

                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gray-700 transition-colors group-hover:text-[#e8b923]" />
                  </button>
                  );
                })}
                {filteredSearches.length === 0 && (
                  <p className="px-2.5 py-4 text-center text-xs text-gray-600">No matching portfolio area found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => {
          setMobileOpen((current) => !current);
          setSearchOpen(false);
          setQuery('');
        }}
        className={`glass-strong fixed right-4 top-4 z-50 rounded-full p-3 transition-opacity duration-500 md:hidden ${
          visible || mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </button>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 backdrop-blur-2xl transition-all duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ background: 'rgba(5, 6, 15, 0.94)' }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-6">
          {navItems.map((item, i) => (
            <button
              type="button"
              key={item.id}
              onClick={() => go(item.id)}
              style={{ transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms' }}
              className={`text-xl transition-all duration-500 ${
                mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              } ${activeSection === item.id ? 'text-[#e8b923]' : 'text-gray-400 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setQuery('');
              setSearchOpen(true);
            }}
            className={`inline-flex items-center gap-2 text-xl text-gray-400 transition-all duration-500 hover:text-white ${
              mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <Search className="h-5 w-5" />
            Search
          </button>
        </div>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/35 p-3 backdrop-blur-sm md:hidden"
          onClick={() => {
            setSearchOpen(false);
            setQuery('');
          }}
        >
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            onClick={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
            className="mx-auto mt-16 flex max-h-[calc(100dvh-5rem)] w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#080b17]/[.98] p-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.62)] ring-1 ring-black/40 backdrop-blur-2xl"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarGutter: 'stable' }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-[#e8b923]" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                    setQuery('');
                  }
                  if (event.key === 'Enter' && filteredSearches[0]) go(filteredSearches[0].id);
                }}
                placeholder="Search projects, skills, experience…"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                aria-label="Search portfolio sections"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery('');
                }}
                className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-2 mt-3 flex items-center justify-between px-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-600">Frequently explored</p>
              <span className="font-mono text-[9px] text-gray-700">{filteredSearches.length} results</span>
            </div>
            <div className="space-y-1 pr-1">
              {filteredSearches.map((item) => {
                const Icon = searchIconMap[item.icon as keyof typeof searchIconMap] || FolderKanban;
                return (
                  <button
                    type="button"
                    key={`mobile-${item.id}-${item.label}`}
                    onClick={() => go(item.id)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 group-hover:border-[#e8b923]/35 group-hover:text-[#e8b923]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-gray-200 group-hover:text-white">{item.label}</span>
                      <span className="block truncate text-[11px] text-gray-600">{item.hint}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-700 group-hover:text-[#e8b923]" />
                  </button>
                );
              })}
              {filteredSearches.length === 0 && (
                <p className="px-2.5 py-5 text-center text-xs text-gray-600">No matching portfolio area found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

