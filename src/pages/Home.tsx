import { useEffect } from 'react';
import Hero from '@/sections/Hero';
import About from '@/sections/About';
import Projects from '@/sections/Projects';
import Experience from '@/sections/Experience';
import Skills from '@/sections/Skills';
import Awards from '@/sections/Awards';
import Certificates from '@/sections/Certificates';
import Blog from '@/sections/Blog';
import CV from '@/sections/CV';
import Contact from '@/sections/Contact';
import Assistant from '@/sections/Assistant';
import SocialActivity from '@/sections/SocialActivity';
import StatusBar from '@/sections/StatusBar';
import Navigation from '@/sections/Navigation';
import SmoothScroll from '@/components/fx/SmoothScroll';
import CustomCursor from '@/components/fx/CustomCursor';
import ScrollProgress from '@/components/fx/ScrollProgress';
import Preloader from '@/components/fx/Preloader';
import { useLocation } from 'react-router';
import { useSettings } from '@/hooks/useSettings';
import { trpc } from '@/providers/trpc';

export default function Home() {
  const location = useLocation();
  const { get, isVisible } = useSettings();
  const trackVisit = trpc.analytics.track.useMutation();
  const isCaseStudyReturn = (location.state as { returnTo?: string } | null)?.returnTo === 'projects';

  useEffect(() => {
    // Mobile browsers can report a provisional viewport during the first paint
    // while the browser chrome is settling. Capture the visual viewport once
    // immediately and once after the first frame so the Hero/fixed controls
    // start in their final position without requiring a manual resize.
    const syncViewport = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--portfolio-vh', `${Math.round(height)}px`);
    };

    syncViewport();
    const frame = window.requestAnimationFrame(syncViewport);
    const settleTimer = window.setTimeout(syncViewport, 260);
    const handleOrientation = () => window.setTimeout(syncViewport, 80);
    window.addEventListener('orientationchange', handleOrientation, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('portfolio:visit-tracked') === '1') return;
      sessionStorage.setItem('portfolio:visit-tracked', '1');
      trackVisit.mutate({ path: location.pathname || '/' });
    } catch {
      // Private browsing/sessionStorage restrictions should never affect the site.
    }
  }, [location.pathname, trackVisit]);

  // Admin-editable SEO meta
  useEffect(() => {
    document.title = get('seoTitle');
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = get('seoDescription');
  }, [get]);

  return (
    <SmoothScroll>
      <Preloader name="NAZMUS SAKIB" skip={isCaseStudyReturn} />
      <CustomCursor />
      <ScrollProgress />
      <main className="relative pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-14">

        <Hero />
        <Navigation />
        {isVisible('about') && <About />}
        {isVisible('projects') && <Projects />}
        {isVisible('experience') && <Experience />}
        {isVisible('skills') && <Skills />}
        {isVisible('awards') && <Awards />}
        {isVisible('certificates') && <Certificates />}
        {isVisible('blog') && <Blog />}
        <CV />
        <Assistant />
        <SocialActivity />
        {isVisible('contact') && <Contact />}
        <StatusBar />
      </main>
    </SmoothScroll>
  );
}
