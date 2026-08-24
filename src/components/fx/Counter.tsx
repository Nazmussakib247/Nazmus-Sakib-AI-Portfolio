import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Animated counter that counts up when scrolled into view. */
export default function Counter({
  value,
  suffix = '',
  className = '',
  duration = 1.8,
}: {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: value,
      duration,
      ease: 'power2.out',
      snap: { n: 1 },
      onUpdate: () => {
        el.textContent = `${Math.round(obj.n)}${suffix}`;
      },
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {value}{suffix}
    </span>
  );
}
