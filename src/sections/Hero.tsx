import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronDown, ArrowRight, Download, Github, Linkedin, BookOpen } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useSettings } from '@/hooks/useSettings';
import Magnetic from '@/components/fx/Magnetic';
import { scrollToId } from '@/components/fx/SmoothScroll';
import FloatingSkillLogos from '@/components/fx/FloatingSkillLogos';

/* ---------------- Particle network canvas ---------------- */
function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    const count = Math.min(110, Math.floor(window.innerWidth / 14));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.8 + 0.6,
      hue: Math.random() > 0.82 ? 'violet' : 'gold',
    }));

    const draw = () => {
      time += 0.016;
      ctx.fillStyle = '#05060f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aurora glows
      const g1 = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.25, 0,
        canvas.width * 0.7, canvas.height * 0.25, canvas.width * 0.45
      );
      g1.addColorStop(0, 'rgba(124, 92, 255, 0.10)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const g2 = ctx.createRadialGradient(
        canvas.width * 0.25, canvas.height * 0.7, 0,
        canvas.width * 0.25, canvas.height * 0.7, canvas.width * 0.4
      );
      g2.addColorStop(0, 'rgba(232, 185, 35, 0.07)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles + connections
      particles.forEach((p, i) => {
        p.x += p.vx + Math.sin(time + p.y * 0.008) * 0.08;
        p.y += p.vy;

        // gentle mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0.1) {
          p.x += (dx / dist) * 0.6;
          p.y += (dy / dist) * 0.6;
        }

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(232, 185, 35, ${(1 - d / 110) * 0.1})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle =
          p.hue === 'violet'
            ? 'rgba(124, 92, 255, 0.7)'
            : 'rgba(232, 185, 35, 0.55)';
        ctx.fill();
      });

      // Scan line
      const scanY = (time * 90) % canvas.height;
      const scan = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scan.addColorStop(0, 'rgba(232, 185, 35, 0)');
      scan.addColorStop(0.5, 'rgba(232, 185, 35, 0.03)');
      scan.addColorStop(1, 'rgba(232, 185, 35, 0)');
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 40, canvas.width, 80);

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [canvasRef]);
}

/* ---------------- Typewriter for rotating roles ---------------- */
function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (words.length === 0) return;
    let wordIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = words[wordIdx % words.length];
      if (!deleting) {
        charIdx++;
        setText(word.slice(0, charIdx));
        if (charIdx === word.length) {
          deleting = true;
          timeout = setTimeout(tick, 1800);
          return;
        }
        timeout = setTimeout(tick, 55 + Math.random() * 45);
      } else {
        charIdx--;
        setText(word.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          wordIdx++;
          timeout = setTimeout(tick, 350);
          return;
        }
        timeout = setTimeout(tick, 28);
      }
    };
    timeout = setTimeout(tick, 400);
    return () => clearTimeout(timeout);
  }, [words]);

  return <span className="type-caret text-[#e8b923]">{text}</span>;
}

/* ---------------- Hero ---------------- */
export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: profile } = trpc.profile.get.useQuery();
  const { get, taglines } = useSettings();

  useParticleCanvas(canvasRef);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = el.querySelectorAll('[data-hero]');
    if (prefersReduced) {
      items.forEach((n) => ((n as HTMLElement).style.opacity = '1'));
      return;
    }
    // Keep the first viewport resilient: content should never remain hidden if
    // an animation frame is delayed or interrupted by a browser/runtime issue.
    const revealImmediately = () => {
      items.forEach((node) => {
        const element = node as HTMLElement;
        element.style.opacity = '1';
        element.style.transform = 'none';
        element.style.filter = 'none';
      });
    };
    const fallback = window.setTimeout(revealImmediately, 1800);
    const tl = gsap.timeline({ delay: 0.12, onComplete: () => window.clearTimeout(fallback) });
    tl.fromTo(
      items,
      { opacity: 0, y: 44, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.14, ease: 'power3.out' }
    );
    return () => {
      window.clearTimeout(fallback);
      tl.kill();
    };
  }, []);

  const headline = get('heroHeadline') || profile?.name?.toUpperCase() || '';
  const primaryTarget = get('heroPrimaryTarget') || 'projects';
  const secondaryTarget = get('heroSecondaryTarget') || 'contact';
  const scrollTarget = get('heroScrollTarget') || 'about';
  const openCvPreview = () => window.dispatchEvent(new CustomEvent('portfolio:open-cv-preview'));
  const socialLinks = [
    { label: 'GitHub', href: profile?.githubUrl, icon: Github },
    { label: 'LinkedIn', href: profile?.linkedinUrl, icon: Linkedin },
    { label: 'Medium', href: profile?.mediumUrl, icon: BookOpen },
  ];

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden" style={{ background: '#05060f' }}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      <div className="bg-grid absolute inset-0 z-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,#000_35%,transparent_80%)]" />
      <FloatingSkillLogos />

      <div ref={contentRef} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pb-16 sm:pb-0">
        <div className="text-center">
          <div data-hero className="relative top-4 mb-6">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-[#e8b923]">
              {get('heroBadge')}
            </span>
          </div>

          <h1
            data-hero
            className="text-gradient-chrome mb-4 max-w-full text-4xl font-bold tracking-tight sm:mb-5 sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {headline}
          </h1>

          <div data-hero className="mb-5 flex min-h-[28px] items-center justify-center gap-2 sm:mb-6 sm:gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#e8b923]/70" />
            <p className="font-mono text-sm tracking-wide text-gray-300 sm:text-base">
              <Typewriter words={taglines} />
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#e8b923]/70" />
          </div>

          <p data-hero className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-gray-400 sm:mb-10 sm:text-base">
            {get('heroSubtext')}
          </p>

          <div data-hero className="flex max-w-[340px] flex-wrap items-center justify-center gap-3 sm:max-w-none sm:gap-4">
            <Magnetic>
              <button
                onClick={() => scrollToId(primaryTarget)}
                className="glow-gold group inline-flex items-center gap-2 rounded-full bg-[#e8b923] px-7 py-3.5 text-sm font-semibold text-[#05060f] transition-all duration-300 hover:bg-[#f5cd45]"
              >
                {get('heroPrimaryCta')}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Magnetic>
            <Magnetic>
              <button
                onClick={() => scrollToId(secondaryTarget)}
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-[#e8b923]/50 hover:text-[#e8b923]"
              >
                {get('heroSecondaryCta')}
              </button>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={openCvPreview}
                aria-label="View Nazmus Sakib's CV"
                className="group/cv inline-flex items-center gap-2 rounded-full border border-[#e8b923]/40 bg-[#e8b923]/10 px-6 py-3.5 text-sm font-semibold text-[#e8b923] shadow-[0_0_24px_rgba(232,185,35,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e8b923] hover:bg-[#e8b923] hover:text-[#05060f] hover:shadow-[0_0_28px_rgba(232,185,35,0.28)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current/30 transition-transform duration-300 group-hover/cv:rotate-[-8deg]">
                  <Download className="h-3.5 w-3.5" />
                </span>
                <span>{get('heroCvCta')}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 transition-transform duration-300 group-hover/cv:scale-150" />
              </button>
            </Magnetic>
          </div>

          <div data-hero className="mt-6 flex items-center justify-center gap-3 sm:mt-7">
            {socialLinks.map(({ label, href, icon: Icon }) => href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-300 hover:-translate-y-1 hover:border-[#e8b923]/50 hover:text-[#e8b923]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ) : null)}
          </div>
        </div>

        <button
          type="button"
          data-hero
          aria-label="Scroll to About section"
          onClick={() => scrollToId(scrollTarget)}
          className="group relative z-20 mt-5 flex min-w-[96px] -translate-y-1 flex-col items-center gap-2 rounded-2xl px-4 py-2 text-gray-500 transition-all duration-300 hover:-translate-y-2 hover:bg-white/5 hover:text-[#e8b923]"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.35em]">{get('heroScrollLabel')}</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
