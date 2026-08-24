import { createRouter, publicQuery } from '../middleware';
import { getDb } from '../queries/connection';
import { profiles } from '@db/schema';

type SocialCache = { expiresAt: number; value: SocialActivity };
type SocialActivity = {
  github: { status: 'online' | 'limited'; label: string; url: string; items: Array<{ type: string; repo: string; url: string; createdAt: string }> };
  medium: { status: 'online' | 'limited'; label: string; url: string; items: Array<{ title: string; url: string; publishedAt: string }> };
  linkedin: { status: 'profile'; label: string; url: string };
  fetchedAt: string;
};

let cache: SocialCache | null = null;
function textFromXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function githubUsernameFromUrl(value: string) {
  try {
    const pathname = new URL(value).pathname.replace(/^\/+|\/+$/g, '');
    return pathname.split('/')[0] || '';
  } catch {
    return '';
  }
}

function mediumFeedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === 'medium.com' && url.pathname.startsWith('/@')) {
      return `${url.origin}/feed${url.pathname}`;
    }
    return `${value.replace(/\/$/, '')}/feed`;
  } catch {
    return '';
  }
}

async function fetchGithub(githubUrl: string) {
  const username = githubUsernameFromUrl(githubUrl);
  if (!username) return { status: 'limited' as const, label: 'GitHub profile unavailable', url: githubUrl, items: [] };
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=6`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Nazmus-Sakib-Portfolio' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('GitHub unavailable');
    const events = (await response.json()) as Array<{ type?: string; repo?: { name?: string }; html_url?: string; created_at?: string }>;
    return {
      status: 'online' as const,
      label: 'Recent public GitHub activity',
      url: githubUrl,
      items: events.slice(0, 5).map((event) => ({
        type: (event.type || 'Activity').replace(/Event$/, ''),
        repo: event.repo?.name || 'GitHub project',
        url: event.html_url || githubUrl,
        createdAt: event.created_at || new Date().toISOString(),
      })),
    };
  } catch {
    return { status: 'limited' as const, label: 'Explore GitHub projects', url: githubUrl, items: [] };
  }
}

async function fetchMedium(mediumUrl: string) {
  const feedUrl = mediumFeedUrl(mediumUrl);
  if (!feedUrl) return { status: 'limited' as const, label: 'Medium profile unavailable', url: mediumUrl, items: [] };
  try {
    const response = await fetch(feedUrl, { headers: { Accept: 'application/rss+xml, application/xml' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Medium unavailable');
    const xml = await response.text();
    const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 4).map((match) => {
      const block = match[1];
      const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Medium article';
      const url = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || mediumUrl;
      const publishedAt = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || new Date().toISOString();
      return { title: textFromXml(title), url: textFromXml(url), publishedAt: textFromXml(publishedAt) };
    });
    return { status: 'online' as const, label: 'Latest Medium writing', url: mediumUrl, items };
  } catch {
    return { status: 'limited' as const, label: 'Read Medium writing', url: mediumUrl, items: [] };
  }
}

export const socialRouter = createRouter({
  activity: publicQuery.query(async () => {
    if (cache && cache.expiresAt > Date.now()) return cache.value;
    const db = getDb();
    const [profile] = await db.select().from(profiles).limit(1);
    const githubUrl = profile?.githubUrl || '';
    const mediumUrl = profile?.mediumUrl || '';
    const [github, medium] = await Promise.all([fetchGithub(githubUrl), fetchMedium(mediumUrl)]);
    const value: SocialActivity = {
      github,
      medium,
      linkedin: { status: 'profile', label: 'Professional profile', url: profile?.linkedinUrl || '' },
      fetchedAt: new Date().toISOString(),
    };
    cache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
    return value;
  }),
});
