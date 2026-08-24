import { useRef } from 'react';
import { trpc } from '@/providers/trpc';
import { Github, Linkedin, BookOpen, MapPin, GraduationCap, Hash } from 'lucide-react';
import { useReveal } from '@/components/fx/useReveal';
import { useSettings } from '@/hooks/useSettings';
import Counter from '@/components/fx/Counter';
import TiltCard from '@/components/fx/TiltCard';
import SectionHeading from '@/components/fx/SectionHeading';

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: projects } = trpc.project.list.useQuery();
  const { data: certs } = trpc.certificate.list.useQuery();
  const { data: experiences } = trpc.experience.list.useQuery();
  const { data: awards } = trpc.award.list.useQuery();
  const { get, getJson } = useSettings();
  const copy = getJson<{ about?: Record<string, string> }>('sectionCopy', {});
  const aboutCopy = copy.about ?? {};

  useReveal(sectionRef, [profile]);

  const stats = [
    { value: projects?.length ?? 0, suffix: '+', label: aboutCopy.statProjects || '' },
    { value: certs?.length ?? 0, suffix: '+', label: aboutCopy.statCertificates || '' },
    {
      value: experiences?.filter((e) => e.type !== 'education').length ?? 0,
      suffix: '+',
      label: aboutCopy.statExperience || '',
    },
    { value: awards?.length ?? 0, suffix: '', label: aboutCopy.statAwards || '' },
  ];

  const availableForWork = get('availableForWork') === 'true';
  const socialLinks = {
    github: profile?.githubUrl,
    linkedin: profile?.linkedinUrl,
    medium: profile?.mediumUrl,
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      className="bg-radial-fade relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker={aboutCopy.kicker || ''}
          title={aboutCopy.title || ''}
          blurb={aboutCopy.blurb || ''}
        />

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column */}
          <div>
            <p
              data-reveal="left"
              className="will-reveal mb-8 text-sm leading-relaxed text-gray-300 sm:text-base"
            >
              {profile?.bio || ''}
            </p>

            {/* Animated counters */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  data-reveal="up"
                  data-reveal-delay={`${0.1 + i * 0.08}`}
                  className="will-reveal glass card-hover rounded-2xl p-5"
                >
                  <div className="mb-1 text-3xl font-semibold text-white sm:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} className="text-gradient-gold" />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — profile card */}
          <div data-reveal="scale" className="will-reveal">
            <TiltCard className="glass rounded-3xl border border-[#e8b923]/15 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-5">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-[#e8b923]/40 shadow-[0_0_24px_rgba(232,185,35,0.12)] sm:h-28 sm:w-28">
                  {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name || 'Profile'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-white/[0.04] text-xs text-gray-600">Profile</div>}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-medium text-white">{profile?.name || ''}</h3>
                  <p className="text-sm text-[#e8b923]">{profile?.title || ''}</p>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                {profile?.location && <div className="flex items-center gap-3 text-sm text-gray-400"><MapPin className="h-4 w-4 text-[#e8b923]" /><span>{profile.location}</span></div>}
                {profile?.university && <div className="flex items-center gap-3 text-sm text-gray-400"><GraduationCap className="h-4 w-4 text-[#e8b923]" /><span>{profile.university}</span></div>}
                {(profile?.department || profile?.semester) && <div className="flex items-center gap-3 text-sm text-gray-400"><Hash className="h-4 w-4 text-[#e8b923]" /><span>{[profile.department, profile.semester].filter(Boolean).join(' — ')}</span></div>}
              </div>

              {availableForWork && (
                <div className="mb-6 rounded-xl border border-green-400/20 bg-green-400/5 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="animate-pulse-ring h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs uppercase tracking-wider text-green-400">{aboutCopy.availableLabel || ''}</span>
                  </div>
                  <p className="text-sm text-gray-300">{get('availabilityText')}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-white/5 p-2.5 text-gray-400 transition-all hover:bg-[#e8b923]/10 hover:text-[#e8b923]"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-white/5 p-2.5 text-gray-400 transition-all hover:bg-[#e8b923]/10 hover:text-[#e8b923]"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.medium && (
                  <a
                    href={socialLinks.medium}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-white/5 p-2.5 text-gray-400 transition-all hover:bg-[#e8b923]/10 hover:text-[#e8b923]"
                    aria-label="Medium"
                  >
                    <BookOpen className="h-4 w-4" />
                  </a>
                )}
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}
