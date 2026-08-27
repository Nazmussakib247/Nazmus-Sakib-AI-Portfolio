import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP scroll-reveal for children marked with [data-reveal].
 * Supported values: up | down | left | right | scale | fade
 * Optional [data-reveal-delay] (seconds).
 *
 * Pass `deps` for content that loads async (query data) so triggers rebuild.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (elements.length === 0) return;

    if (prefersReduced) {
      elements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 80);

    elements.forEach((el) => {
      const dir = el.dataset.reveal || 'up';
      const delay = parseFloat(el.dataset.revealDelay || '0');

      const from: gsap.TweenVars = { opacity: 0 };
      if (dir === 'up') from.y = 60;
      if (dir === 'down') from.y = -60;
      if (dir === 'left') from.x = window.innerWidth < 640 ? -32 : -70;
      if (dir === 'right') from.x = window.innerWidth < 640 ? 32 : 70;
      if (dir === 'scale') from.scale = 0.88;

      const tween = gsap.fromTo(el, from, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
      tweens.push(tween);
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });

    return () => {
      window.clearTimeout(refreshTimer);
      triggers.forEach((t) => t.kill());
      tweens.forEach((t) => t.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
