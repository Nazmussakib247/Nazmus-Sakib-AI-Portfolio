import { useEffect, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';
import { BrainCircuit, Database } from 'lucide-react';

type FloatingCard = {
  label: string;
  iconUrl: string;
  left: string;
  top: string;
  driftX: string;
  driftY: string;
  duration: number;
  delay: number;
  size: 'sm' | 'md';
  icon?: LucideIcon;
  iconClassName?: string;
};

const floatingCards: FloatingCard[] = [
  { label: 'Git', iconUrl: '/images/skills/git-original.svg', left: '5%', top: '18%', driftX: '12px', driftY: '17px', duration: 11, delay: -5, size: 'sm' },
  { label: 'C', iconUrl: '/images/skills/c-original.svg', left: '8%', top: '31%', driftX: '14px', driftY: '-18px', duration: 12, delay: -2, size: 'sm' },
  { label: 'SQL', iconUrl: '', icon: Database, left: '5%', top: '46%', driftX: '-14px', driftY: '-16px', duration: 14, delay: -12, size: 'sm' },
  { label: 'Neural Net', iconUrl: '', icon: BrainCircuit, left: '12%', top: '61%', driftX: '14px', driftY: '13px', duration: 15, delay: -11, size: 'md' },
  { label: 'C++', iconUrl: '/images/skills/cplusplus-original.svg', left: '16%', top: '74%', driftX: '-16px', driftY: '15px', duration: 14, delay: -8, size: 'md' },
  { label: 'Python', iconUrl: '/images/skills/python-original.svg', left: '7%', top: '86%', driftX: '16px', driftY: '-15px', duration: 13, delay: -10, size: 'md' },
  { label: 'HTML', iconUrl: '/images/skills/html5-original.svg', left: '24%', top: '81%', driftX: '-12px', driftY: '-13px', duration: 12, delay: -1, size: 'sm' },
  { label: 'GitHub', iconUrl: '/images/skills/github-original.svg', left: '84%', top: '18%', driftX: '15px', driftY: '18px', duration: 15, delay: -3, size: 'md', iconClassName: 'brightness-0 invert opacity-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]' },
  { label: 'Docker', iconUrl: '/images/skills/docker-original.svg', left: '80%', top: '31%', driftX: '13px', driftY: '15px', duration: 16, delay: -14, size: 'md' },
  { label: 'Machine Learning', iconUrl: '', icon: BrainCircuit, left: '74%', top: '46%', driftX: '-12px', driftY: '-18px', duration: 17, delay: -9, size: 'md' },
  { label: 'RAG', iconUrl: '', icon: Database, left: '86%', top: '60%', driftX: '-14px', driftY: '17px', duration: 16, delay: -4, size: 'sm' },
  { label: 'scikit-learn', iconUrl: '/images/skills/scikitlearn-original.svg', left: '78%', top: '72%', driftX: '13px', driftY: '-16px', duration: 14, delay: -6, size: 'sm' },
  { label: 'n8n', iconUrl: '/images/skills/n8n-original.svg', left: '68%', top: '78%', driftX: '-13px', driftY: '15px', duration: 15, delay: -7, size: 'sm' },
  { label: 'CSS', iconUrl: '/images/skills/css3-original.svg', left: '74%', top: '87%', driftX: '12px', driftY: '-14px', duration: 13, delay: -5, size: 'sm' },
];

function SkillIcon({ card, mobile = false }: { card: FloatingCard; mobile?: boolean }) {
  const iconSize = mobile ? 'h-4 w-4' : card.size === 'md' ? 'h-6 w-6' : 'h-5 w-5';

  return card.icon ? (
    <card.icon className={`${iconSize} text-[#e8b923]/80`} strokeWidth={1.5} />
  ) : (
    <img
      src={card.iconUrl}
      alt=""
      className={`${iconSize} object-contain opacity-80 saturate-[0.8] ${card.iconClassName || ''}`}
    />
  );
}

export default function FloatingSkillLogos() {
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!pointerQuery.matches || reducedMotionQuery.matches) return;

    const cards = cardRefs.current.filter((card): card is HTMLDivElement => Boolean(card));
    const movers = cards.map((card, index) => ({
      x: gsap.quickTo(card, 'x', { duration: 0.7 + (index % 3) * 0.12, ease: 'power3.out' }),
      y: gsap.quickTo(card, 'y', { duration: 0.8 + (index % 4) * 0.1, ease: 'power3.out' }),
      depth: 5 + (index % 4) * 2,
    }));

    const move = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      movers.forEach((mover) => {
        mover.x(x * mover.depth);
        mover.y(y * mover.depth);
      });
    };

    const reset = () => movers.forEach((mover) => { mover.x(0); mover.y(0); });
    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseleave', reset, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', reset);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none relative z-[1] lg:absolute lg:inset-0">
      {/* Desktop: preserve the original asymmetric floating arrangement. */}
      <div className="absolute inset-0 hidden opacity-70 lg:block">
        {floatingCards.map((card, index) => {
          const cssVariables = {
            '--skill-drift-x': card.driftX,
            '--skill-drift-y': card.driftY,
            '--skill-duration': `${card.duration}s`,
            '--skill-delay': `${card.delay}s`,
          } as CSSProperties;

          return (
            <div
              key={`desktop-${card.label}-${index}`}
              className="skill-float absolute"
              style={{ ...cssVariables, left: card.left, top: card.top }}
            >
              <div
                ref={(element) => { cardRefs.current[index] = element; }}
                className={`skill-float-card flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0e1a]/65 px-2.5 py-2 shadow-[0_0_24px_rgba(124,92,255,0.08)] backdrop-blur-sm transition-all duration-500 hover:border-[#e8b923]/35 hover:bg-[#111527]/80 ${
                  card.size === 'md' ? 'min-w-[78px]' : 'min-w-[62px]'
                }`}
              >
                <SkillIcon card={card} />
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: keep every hardcoded logo visible in a compact dock below the Hero flow. */}
      <div className="pointer-events-none relative z-[2] flex justify-center px-3 py-2 lg:absolute lg:inset-x-0 lg:bottom-[calc(8.5rem+env(safe-area-inset-bottom))] lg:hidden lg:px-3 lg:py-0">
        <div className="grid w-full max-w-[23rem] grid-cols-7 gap-1 sm:max-w-[34rem] sm:grid-cols-8 sm:gap-1.5">

        {floatingCards.map((card, index) => (
          <div
            key={`mobile-${card.label}-${index}`}
            className="flex h-7 min-w-0 items-center justify-center rounded-lg border border-white/10 bg-[#0b0e1a]/70 px-1 shadow-[0_0_16px_rgba(124,92,255,0.08)] backdrop-blur-sm transition-colors duration-200 sm:h-8"

            title={card.label}
          >
            <SkillIcon card={card} mobile />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
