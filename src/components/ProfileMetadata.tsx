import { useEffect } from 'react';
import { trpc } from '@/providers/trpc';
import { useSettings } from '@/hooks/useSettings';
import { fallbackProfileImage, resolveProfileImageUrl } from '@/lib/profileImage';

type StructuredData = {
  '@graph'?: Array<Record<string, unknown>>;
};

function toAbsoluteUrl(value: string, fallback: string) {
  try {
    return new URL(value.trim() || fallback, window.location.origin).href;
  } catch {
    return new URL(fallback, window.location.origin).href;
  }
}

function ensureMeta(attribute: 'name' | 'property', value: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }
  return meta;
}

function ensureLink(rel: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  return link;
}

function updateStructuredData(profile: { name?: string | null; title?: string | null; bio?: string | null; githubUrl?: string | null; linkedinUrl?: string | null; mediumUrl?: string | null }, siteUrl: string, profileImageUrl: string, title: string, description: string) {
  const structuredData = document.getElementById('portfolio-structured-data');
  if (!structuredData) return;

  const sameAs = [profile.githubUrl, profile.linkedinUrl, profile.mediumUrl].filter(Boolean);
  const graph: StructuredData = {
    '@graph': [
      {
        '@type': 'Person',
        name: profile.name || 'Nazmus Sakib',
        jobTitle: profile.title || 'ML Engineer',
        description: profile.bio || description,
        url: siteUrl,
        image: profileImageUrl,
        sameAs,
      },
      {
        '@type': 'WebSite',
        name: title,
        url: siteUrl,
        description,
      },
    ],
  };
  structuredData.textContent = JSON.stringify({ '@context': 'https://schema.org', ...graph });
}

export default function ProfileMetadata() {
  const { data: profile } = trpc.profile.get.useQuery();
  const { get, settingsFetched } = useSettings();

  useEffect(() => {
    if (!settingsFetched) return;

    const title = get('seoTitle').trim() || 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer';
    const description = get('seoDescription').trim() || 'Production-minded AI systems, bilingual NLP, LLM workflows, retrieval, full-stack engineering, and intelligent automation.';
    const siteUrl = toAbsoluteUrl(get('canonicalSiteUrl') || '/', window.location.origin).replace(/\/$/, '') + '/';
    const profileImageUrl = toAbsoluteUrl(resolveProfileImageUrl(profile?.avatarUrl), fallbackProfileImage);
    const faviconUrl = toAbsoluteUrl(resolveProfileImageUrl(get('faviconUrl')) || fallbackProfileImage, fallbackProfileImage);

    document.title = title;
    ensureMeta('name', 'description').content = description;
    ensureMeta('property', 'og:url').content = siteUrl;
    ensureMeta('property', 'og:title').content = title;
    ensureMeta('property', 'og:description').content = description;
    ensureMeta('name', 'twitter:title').content = title;
    ensureMeta('name', 'twitter:description').content = description;
    ensureLink('canonical').href = siteUrl;
    ensureLink('icon').href = faviconUrl;
    ensureLink('icon').dataset.adminManaged = 'true';

    if (profile) updateStructuredData(profile, siteUrl, profileImageUrl, title, description);
  }, [get, profile, settingsFetched]);

  return null;
}
