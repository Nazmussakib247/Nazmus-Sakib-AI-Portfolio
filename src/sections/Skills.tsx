import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { trpc } from '@/providers/trpc';
import {
  Brain, Code2, Server, Workflow, Wrench, Cpu, Code, Database, Cloud, Terminal,
  Palette, Globe, Shield, Zap, type LucideIcon,
} from 'lucide-react';
import { useReveal } from '@/components/fx/useReveal';
import SectionHeading from '@/components/fx/SectionHeading';
import { useSettings } from '@/hooks/useSettings';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, LucideIcon> = {
  brain: Brain, code2: Code2, server: Server, workflow: Workflow, wrench: Wrench,
  cpu: Cpu, code: Code, database: Database, cloud: Cloud, terminal: Terminal,
  palette: Palette, globe: Globe, shield: Shield, zap: Zap,
};

type SkillRow = {
  id: number;
  category: string;
  iconName: string | null;
  iconUrl: string | null;
  name: string;
  level: number | null;
  orderIndex: number | null;
};


export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: dbSkills } = trpc.skill.list.useQuery();
  const { getJson } = useSettings();
  const copy = getJson<{ skills?: Record<string, string> }>('sectionCopy', {});
  const skillCopy = copy.skills ?? {};
  const skills = useMemo(() => (dbSkills || []) as SkillRow[], [dbSkills]);

  useReveal(sectionRef, [dbSkills]);

  // Animate proficiency bars on scroll
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-bar]'));
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      bars.forEach((b) => (b.style.width = `${b.dataset.bar}%`));
      return;
    }

    const tweens = bars.map((bar) =>
      gsap.fromTo(
        bar,
        { width: '0%' },
        {
          width: `${bar.dataset.bar}%`,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: { trigger: bar, start: 'top 92%' },
        }
      )
    );
    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, [skills]);

  // Group skills by category, preserving order
  const grouped = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  // Marquee items
  const marqueeItems = skills.map((s) => s.name);

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="bg-grid relative w-full overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-deep)' }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker={skillCopy.kicker || ''}
          title={skillCopy.title || ''}
          blurb={skillCopy.blurb || ''}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).map(([category, items], ci) => {
            const Icon = iconMap[(items[0]?.iconName || 'code').toLowerCase()] || Code;
            return (
              <div
                key={category}
                data-reveal="up"
                data-reveal-delay={`${(ci % 3) * 0.1}`}
                className="will-reveal glass card-hover border-sweep rounded-2xl p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8b923]/25 bg-[#e8b923]/8">
                    <Icon className="h-5 w-5 text-[#e8b923]" />
                  </span>
                  <h3 className="text-base font-medium text-white">{category}</h3>
                </div>
                <div className="space-y-4">
                  {items.map((skill) => (
                    <div key={skill.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm text-gray-300">{skill.name}</span>
                        <span className="font-mono text-xs text-gray-500">{skill.level ?? 0}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          data-bar={skill.level ?? 0}
                          className="h-full w-0 rounded-full"
                          style={{ background: 'linear-gradient(90deg, #e8b923, #7c5cff)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Infinite marquee */}
      <div className="mt-20">
        <div className="border-y border-white/5 bg-white/[0.02] py-4">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="mx-6 flex items-center gap-6 whitespace-nowrap font-mono text-sm text-gray-500">
                {skills.find((skill) => skill.name === item)?.iconUrl ? (
                  <img
                    src={skills.find((skill) => skill.name === item)?.iconUrl || ''}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 object-contain opacity-85"
                  />
                ) : (
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#e8b923]/70" />
                )}
                {item}
                <span aria-hidden="true" className="h-px w-5 bg-gradient-to-r from-[#e8b923]/60 to-transparent" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
