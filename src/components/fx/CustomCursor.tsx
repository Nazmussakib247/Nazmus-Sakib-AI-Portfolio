import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { CSSProperties } from 'react';

type CursorParticle = {
  id: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  size: number;
  life: number;
  color: string;
};

const PARTICLE_COLORS = ['#e8b923', '#f5cd45', '#22d3ee', '#38bdf8', '#8b5cf6', '#c084fc'];
const MAX_PARTICLES = 160;

/** Desktop-only pointer field: a gold/cyan reticle, spotlight, and colorful rising particle drops. */
export default function CustomCursor() {
  const [particles, setParticles] = useState<CursorParticle[]>([]);
  const particleIdRef = useRef(0);

  useEffect(() => {
    const effects = document.querySelector<HTMLDivElement>('.cursor-effects');
    const field = document.querySelector<HTMLDivElement>('.cursor-field');
    const dot = document.querySelector<HTMLDivElement>('.cursor-dot');
    const ring = document.querySelector<HTMLDivElement>('.cursor-ring');
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!effects || !field || !dot || !ring || !pointerQuery.matches || reducedMotionQuery.matches) return;

    const fieldX = gsap.quickTo(field, 'x', { duration: 0.68, ease: 'power3.out' });
    const fieldY = gsap.quickTo(field, 'y', { duration: 0.68, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.25, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.25, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'power2.out' });

    let previousX = window.innerWidth / 2;
    let previousY = window.innerHeight / 2;
    let lastMoveAt = 0;
    let lastEmitAt = 0;

    const move = (event: MouseEvent) => {
      const now = performance.now();
      const velocityX = event.clientX - previousX;
      const velocityY = event.clientY - previousY;
      const speed = Math.min(22, Math.hypot(velocityX, velocityY) * 0.85);
      const angle = Math.atan2(velocityY, velocityX);
      const perpendicularX = -Math.sin(angle);
      const perpendicularY = Math.cos(angle);

      fieldX(event.clientX);
      fieldY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);

      // Emit only while moving, with more drops at higher pointer velocity.
      if (now - lastEmitAt >= 12 && speed > 0.25) {
        const emitCount = Math.min(5, Math.max(1, Math.ceil(speed / 4.5)));
        const emitted: CursorParticle[] = Array.from({ length: emitCount }, (_, index) => {
          const lateral = (Math.random() - 0.5) * (10 + speed * 0.7);
          const backward = 2 + index * 1.7;
          return {
            id: particleIdRef.current + index + 1,
            x: event.clientX + perpendicularX * lateral - velocityX * 0.12,
            y: event.clientY + perpendicularY * lateral - velocityY * 0.12,
            driftX: (Math.random() - 0.5) * 22 + perpendicularX * (Math.random() * 9),
            driftY: -(18 + Math.random() * 22) - Math.abs(velocityY) * 0.1,
            size: 2 + Math.random() * 2.8,
            life: 520 + Math.random() * 260 + backward * 4,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          };
        });
        particleIdRef.current += emitted.length;
        setParticles((current) => [...current, ...emitted].slice(-MAX_PARTICLES));
        lastEmitAt = now;
      }

      previousX = event.clientX;
      previousY = event.clientY;
      lastMoveAt = now;
      effects.classList.add('is-visible', 'is-moving');
    };

    const over = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      effects.classList.toggle(
        'is-hovering',
        Boolean(target.closest('a, button, [role="button"], input, textarea, select, .cursor-target'))
      );
    };

    const tick = () => {
      if (performance.now() - lastMoveAt > 180) effects.classList.remove('is-moving');
    };

    const leave = () => {
      effects.classList.remove('is-visible', 'is-hovering', 'is-moving');
      setParticles([]);
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseover', over, { passive: true });
    window.addEventListener('mouseleave', leave, { passive: true });
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseleave', leave);
      gsap.ticker.remove(tick);
    };
  }, []);

  const removeParticle = (id: number) => {
    setParticles((current) => current.filter((particle) => particle.id !== id));
  };

  return (
    <div className="cursor-effects hidden md:block" aria-hidden="true">
      <div className="cursor-field" />
      <div className="cursor-particles">
        {particles.map((particle) => {
          const particleStyle = {
            '--particle-x': `${particle.x}px`,
            '--particle-y': `${particle.y}px`,
            '--particle-drift-x': `${particle.driftX}px`,
            '--particle-drift-y': `${particle.driftY}px`,
            '--particle-size': `${particle.size}px`,
            '--particle-life': `${particle.life}ms`,
            '--particle-color': particle.color,
          } as CSSProperties;

          return (
            <span
              key={particle.id}
              className="cursor-particle"
              style={particleStyle}
              onAnimationEnd={() => removeParticle(particle.id)}
            />
          );
        })}
      </div>
      <div className="cursor-ring" />
      <div className="cursor-dot" />
    </div>
  );
}
