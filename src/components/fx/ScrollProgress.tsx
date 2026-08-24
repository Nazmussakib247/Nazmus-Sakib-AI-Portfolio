import { useEffect, useRef } from 'react';

/** Thin gold progress bar fixed to the top of the viewport. */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = barRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      el.style.transform = `scaleX(${p})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent">
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0"
        style={{ background: 'linear-gradient(90deg, #e8b923, #7c5cff)' }}
      />
    </div>
  );
}
