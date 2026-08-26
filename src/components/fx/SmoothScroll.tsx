import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wraps the page with Lenis smooth scrolling, kept in sync with GSAP ScrollTrigger.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Let anchor buttons use lenis
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}

/** Smooth-scroll to an element id, falling back to native behavior. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 20);
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;

  if (lenis) {
    lenis.scrollTo(target, { immediate: false });
    return;
  }

  window.scrollTo({ top: target, behavior: 'smooth' });
}
