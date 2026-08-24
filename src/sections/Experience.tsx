import { useRef } from 'react';
import { trpc } from '@/providers/trpc';
import { Briefcase, GraduationCap, Building, MapPin } from 'lucide-react';
import { useReveal } from '@/components/fx/useReveal';
import SectionHeading from '@/components/fx/SectionHeading';
import { useSettings } from '@/hooks/useSettings';


const typeMeta: Record<string, { icon: React.ElementType; color: string }> = {
  work: { icon: Briefcase, color: '#4ade80' },
  education: { icon: GraduationCap, color: '#60a5fa' },
  internship: { icon: Building, color: '#c084fc' },
};

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: dbExperiences } = trpc.experience.list.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const { getJson } = useSettings();
  const copy = getJson<{ experience?: Record<string, string> }>('sectionCopy', {});
  const experienceCopy = copy.experience ?? {};
  const experiences = dbExperiences || [];

  useReveal(sectionRef, [dbExperiences, profile]);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          kicker={experienceCopy.kicker || ''}
          title={experienceCopy.title || ''}
          blurb={experienceCopy.blurb || ''}
        />
        {profile?.linkedinUrl && (
          <div className="mb-10 flex justify-center sm:justify-start">
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#e8b923] transition-colors hover:text-white">
              {experienceCopy.linkedinCta || ''} <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}

        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute top-0 bottom-0 left-4 w-px bg-gradient-to-b from-[#e8b923]/60 via-[#7c5cff]/40 to-transparent sm:left-1/2" />

          <div className="space-y-12">
            {experiences.map((exp, i) => {
              const meta = typeMeta[exp.type] || typeMeta.work;
              const typeLabel = exp.type === 'education' ? experienceCopy.educationLabel : exp.type === 'internship' ? experienceCopy.internshipLabel : experienceCopy.workLabel;
              const Icon = meta.icon;
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={exp.id || i}
                  data-reveal={isLeft ? 'left' : 'right'}
                  className={`will-reveal relative flex ${
                    isLeft ? 'sm:justify-start' : 'sm:justify-end'
                  } justify-start`}
                >
                  {/* Node */}
                  <span
                    className="glass absolute left-4 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border sm:left-1/2"
                    style={{ borderColor: `${meta.color}55` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  </span>

                  <div
                    className={`glass card-hover ml-12 w-full rounded-2xl p-6 sm:ml-0 sm:w-[calc(50%-3rem)] ${
                      isLeft ? 'sm:mr-auto' : 'sm:ml-auto'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                        style={{ color: meta.color, background: `${meta.color}18` }}
                      >
                        {typeLabel || ''}
                      </span>
                      <span className="font-mono text-xs text-gray-500">
                        {exp.startDate || ''} {exp.endDate || experienceCopy.presentLabel ? `— ${exp.endDate || experienceCopy.presentLabel}` : ''}
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-medium text-white">{exp.title}</h3>
                    <p className="mb-1 text-sm text-[#e8b923]">{exp.organization}</p>
                    {exp.location && (
                      <p className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {exp.location}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-sm leading-relaxed text-gray-400">{exp.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
