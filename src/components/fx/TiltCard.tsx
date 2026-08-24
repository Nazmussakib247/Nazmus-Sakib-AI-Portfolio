import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';

/** 3D tilt-on-hover card with a moving specular highlight. */
export default function TiltCard({
  children,
  className = '',
  maxTilt = 7,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    gsap.to(el, {
      rotateY: (px - 0.5) * maxTilt * 2,
      rotateX: (0.5 - py) * maxTilt * 2,
      transformPerspective: 900,
      duration: 0.5,
      ease: 'power2.out',
    });
    if (glareRef.current) {
      gsap.to(glareRef.current, {
        opacity: 1,
        x: `${px * 100}%`,
        y: `${py * 100}%`,
        duration: 0.4,
      });
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    if (glareRef.current) gsap.to(glareRef.current, { opacity: 0, duration: 0.4 });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
      <div
        ref={glareRef}
        className="tilt-glare pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full opacity-0"
        style={{ background: 'radial-gradient(circle, rgba(232,185,35,0.18) 0%, rgba(34,211,238,0.07) 32%, transparent 72%)', mixBlendMode: 'screen' }}
      />
    </div>
  );
}
