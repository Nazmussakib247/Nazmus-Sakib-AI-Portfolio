import { lazy, Suspense, useEffect } from 'react';
import Hero from '@/sections/Hero';
import About from '@/sections/About';
import Projects from '@/sections/Projects';
import Experience from '@/sections/Experience';
import AcademicFoundation from '@/sections/AcademicFoundation';
import Skills from '@/sections/Skills';
import Awards from '@/sections/Awards';
import Certificates from '@/sections/Certificates';
import Blog from '@/sections/Blog';
import CV from '@/sections/CV';
import Contact from '@/sections/Contact';
const Assistant = lazy(() => import('@/sections/Assistant'));
import SocialActivity from '@/sections/SocialActivity';
import StatusBar from '@/sections/StatusBar';
import Navigation from '@/sections/Navigation';
import SmoothScroll from '@/components/fx/SmoothScroll';
import CustomCursor from '@/components/fx/CustomCursor';
import ScrollProgress from '@/components/fx/ScrollProgress';
import Preloader from '@/components/fx/Preloader';
import { useLocation } from 'react-router';
import { useSettings } from '@/hooks/useSettings';
import { getCaseStudyOriginPath, isCaseStudyReturn as matchesCaseStudyReturn, readCaseStudyReturnContext } from '@/lib/caseStudyNavigation';
import { trpc } from '@/providers/trpc';

export default function Home() {
  const location = useLocation();
  const { isVisible } = useSettings();
  const trackVisit = trpc.analytics.track.useMutation();
  const returnContext = readCaseStudyReturnContext();
  const currentPath = getCaseStudyOriginPath(location);
  const isCaseStudyReturn = matchesCaseStudyReturn(
    returnContext,
    location.key,
    currentPath,
    location.state as { returnTo?: string } | null,
  );

  useEffect(() => {
    try {
      if (sessionStorage.getItem('portfolio:visit-tracked') === '1') return;
      sessionStorage.setItem('portfolio:visit-tracked', '1');
      trackVisit.mutate({ path: location.pathname || '/' });
    } catch {
      // Private browsing/sessionStorage restrictions should never affect the site.
    }
  }, [location.pathname, trackVisit]);


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
        {isVisible('academicFoundation') && <AcademicFoundation />}
        {isVisible('skills') && <Skills />}
        {isVisible('awards') && <Awards />}
        {isVisible('certificates') && <Certificates />}
        {isVisible('blog') && <Blog />}
        <CV />
        <Suspense fallback={null}><Assistant /></Suspense>
        <SocialActivity />
        {isVisible('contact') && <Contact />}
        <StatusBar />
      </main>
    </SmoothScroll>
  );
}
