import { useEffect, useState } from 'react';
import gsap from 'gsap';

/** Brief branded preloader with a counting percentage, then curtain lift. */
export default function Preloader({ name = 'NS', skip = false }: { name?: string; skip?: boolean }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (skip) {
      setDone(true);
      return;
    }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDone(true);
      return;
    }
    const obj = { n: 0 };
    const counter = document.getElementById('preloader-count');
    const safetyTimer = window.setTimeout(() => setDone(true), 4500);
    const tl = gsap.timeline({
      onComplete: () => {
        window.clearTimeout(safetyTimer);
        setDone(true);
      },
    });
    tl.to(obj, {
      n: 100,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (counter) counter.textContent = `${Math.round(obj.n)}%`;
      },
    });
    tl.to('#preloader-inner', { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in' });
    tl.to('#preloader', { yPercent: -100, duration: 0.7, ease: 'power4.inOut' });
    return () => {
      window.clearTimeout(safetyTimer);
      tl.kill();
    };
  }, [skip]);

  if (done || skip) return null;

  return (
    <div
      id="preloader"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: '#05060f' }}
    >
      <div id="preloader-inner" className="text-center">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.4em] text-[#e8b923]">
          {name}
        </div>
        <div id="preloader-count" className="text-gradient-gold text-5xl font-semibold">
          0%
        </div>
      </div>
    </div>
  );
}
