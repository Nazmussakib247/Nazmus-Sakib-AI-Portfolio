import { useRef } from 'react';
import { Activity, BookOpen, ExternalLink, Github, Linkedin, Radio } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import SectionHeading from '@/components/fx/SectionHeading';
import { useReveal } from '@/components/fx/useReveal';
import { useSettings } from '@/hooks/useSettings';

function relativeTime(value: string, labels: { recent: string; minute: string; hour: string; day: string }) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return labels.recent;
  const minutes = Math.max(1, Math.floor((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes}${labels.minute}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${labels.hour}`;
  return `${Math.floor(hours / 24)}${labels.day}`;
}

export default function SocialActivity() {
  const sectionRef = useRef<HTMLElement>(null);
  const { getJson } = useSettings();
  const copy = getJson<{ activity?: Record<string, string> }>('sectionCopy', {});
  const activityCopy = copy.activity ?? {};
  const timeLabels = {
    recent: activityCopy.recentLabel || '',
    minute: activityCopy.minuteSuffix || '',
    hour: activityCopy.hourSuffix || '',
    day: activityCopy.daySuffix || '',
  };
  const { data, isLoading } = trpc.social.activity.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  useReveal(sectionRef, [data]);

  return (
    <section id="activity" ref={sectionRef} className="relative w-full px-4 py-24 sm:px-6 lg:px-8 lg:py-32" style={{ background: 'var(--bg-deep)' }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading kicker={activityCopy.kicker || ''} title={activityCopy.title || ''} blurb={activityCopy.blurb || ''} />
        <div data-reveal="up" className="will-reveal grid gap-5 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><Github className="h-5 w-5 text-white" /><span className="text-sm font-medium text-white">{activityCopy.githubLabel || ''}</span></div><span className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${data?.github.status === 'online' ? 'text-green-400' : 'text-gray-500'}`}><Radio className="h-3 w-3" />{data?.github.status === 'online' ? activityCopy.liveStatus || '' : activityCopy.profileStatus || ''}</span></div>
            <div className="space-y-3">{isLoading ? <p className="text-sm text-gray-500">{activityCopy.loadingGithub || ''}</p> : data?.github.items.length ? data.github.items.map((item, index) => <a key={`${item.repo}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-[#e8b923]/25"><div className="text-xs text-gray-300">{item.type} <span className="text-[#e8b923]">{item.repo}</span></div><div className="mt-1 font-mono text-[10px] text-gray-600">{relativeTime(item.createdAt, timeLabels)}</div></a>) : <p className="text-sm leading-relaxed text-gray-500">{activityCopy.emptyGithub || ''}</p>}</div>
            {data?.github.url && <a href={data.github.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs text-[#e8b923]">{activityCopy.openGithub || ''} <ExternalLink className="h-3.5 w-3.5" /></a>}
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-[#e8b923]" /><span className="text-sm font-medium text-white">{activityCopy.mediumLabel || ''}</span></div><span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-green-400"><Activity className="h-3 w-3" />{activityCopy.feedStatus || ''}</span></div>
            <div className="space-y-3">{isLoading ? <p className="text-sm text-gray-500">{activityCopy.loadingMedium || ''}</p> : data?.medium.items.length ? data.medium.items.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-[#e8b923]/25"><div className="line-clamp-2 text-xs leading-relaxed text-gray-300">{item.title}</div><div className="mt-1 font-mono text-[10px] text-gray-600">{relativeTime(item.publishedAt, timeLabels)}</div></a>) : <p className="text-sm leading-relaxed text-gray-500">{activityCopy.emptyMedium || ''}</p>}</div>
            {data?.medium.url && <a href={data.medium.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs text-[#e8b923]">{activityCopy.openMedium || ''} <ExternalLink className="h-3.5 w-3.5" /></a>}
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><Linkedin className="h-5 w-5 text-[#6fa8dc]" /><span className="text-sm font-medium text-white">{activityCopy.linkedinLabel || ''}</span></div><span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{activityCopy.profileStatus || ''}</span></div>
            <div className="flex min-h-[174px] flex-col justify-between"><p className="text-sm leading-relaxed text-gray-400">{activityCopy.linkedinBlurb || ''}</p>{data?.linkedin.url && <a href={data.linkedin.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 self-start rounded-full border border-[#6fa8dc]/25 bg-[#6fa8dc]/5 px-4 py-2 text-xs text-[#9fc9ec] transition-colors hover:border-[#e8b923]/40 hover:text-[#e8b923]">{activityCopy.viewProfile || ''} <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
          </div>
        </div>
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-gray-600">{activityCopy.footer || ''}</p>
      </div>
    </section>
  );
}
