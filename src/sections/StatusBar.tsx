import { useEffect, useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { scrollToId } from '@/components/fx/SmoothScroll';

const validTargets = new Set([
  'hero',
  'about',
  'projects',
  'experience',
  'skills',
  'awards',
  'certificates',
  'blog',
  'cv',
  'activity',
  'contact',
]);

function targetId(value: string, fallback: string) {
  const normalized = value.trim().toLowerCase();
  return validTargets.has(normalized) ? normalized : fallback;
}

export default function StatusBar() {
  const { get } = useSettings();
  const [hasReachedAbout, setHasReachedAbout] = useState(false);
  const enabled = get('bottomBarEnabled') !== 'false';

  useEffect(() => {
    const about = document.getElementById('about');
    if (!about) return;

    const evaluatePosition = () => {
      if (about.getBoundingClientRect().top <= window.innerHeight * 0.82) {
        setHasReachedAbout(true);
      }
    };

    evaluatePosition();
    window.addEventListener('scroll', evaluatePosition, { passive: true });
    return () => window.removeEventListener('scroll', evaluatePosition);
  }, []);

  if (!enabled || !hasReachedAbout) return null;

  const statusText = get('bottomBarStatusText').trim() || 'now automating';
  const message = get('bottomBarMessage').trim() || 'Bilingual AI engineering · Available for selected freelance and remote engagements · Open to thoughtful collaborations';
  const hireLabel = get('bottomBarHireLabel').trim() || 'Hire Me';
  const hireTarget = targetId(get('bottomBarHireTarget'), 'contact');

  const tickerMessage = (
    <span className="inline-flex shrink-0 items-center gap-5 pr-16 text-gray-500">
      {message}
      <span className="h-3 w-px bg-white/15" aria-hidden="true" />
    </span>
  );

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#060812]/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      aria-label="Portfolio status ticker"
    >
      <div className="relative mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto] grid-rows-[2rem_2rem] items-center gap-x-3 px-3 md:flex md:h-14 md:gap-5 md:px-6 md:pr-28 lg:px-8 lg:pr-28">
        <div className="inline-flex min-w-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-300/95 md:shrink-0 md:text-[11px] md:tracking-[0.16em]">

          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/35 motion-reduce:hidden" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]" />
          </span>
          <span className="whitespace-nowrap">{statusText}</span>
        </div>
        <span className="hidden h-4 w-px shrink-0 bg-white/15 md:block" aria-hidden="true" />

        <div className="col-span-2 row-start-2 min-w-0 overflow-hidden md:row-auto md:flex-1" aria-live="polite">
          <div className="status-bar-ticker flex w-max min-w-full items-center font-mono text-[8px] uppercase tracking-[0.09em] md:text-[11px] md:tracking-[0.16em]">

            {tickerMessage}
            <span aria-hidden="true">{tickerMessage}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollToId(hireTarget)}
          className="group row-start-1 inline-flex items-center justify-self-end gap-1.5 rounded-full bg-[#e8b923] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#05060f] shadow-[0_0_18px_rgba(232,185,35,0.16)] transition-all active:scale-[0.97] hover:-translate-y-0.5 hover:bg-[#f5cd45] hover:shadow-[0_0_24px_rgba(232,185,35,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923] md:row-auto md:px-4 md:text-[10px] md:tracking-[0.16em]"

          aria-label={`${hireLabel} — scroll to ${hireTarget}`}
        >
          <BriefcaseBusiness className="h-3.5 w-3.5 transition-transform group-hover:-rotate-6" />
          <span>{hireLabel}</span>
        </button>
      </div>
    </aside>
  );
}

