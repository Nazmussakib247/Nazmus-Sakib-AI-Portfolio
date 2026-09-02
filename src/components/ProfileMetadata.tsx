import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useSettings } from '@/hooks/useSettings';
import { fallbackProfileImage, resolveProfileImageUrl } from '@/lib/profileImage';

type StructuredData = {
  '@graph'?: Array<Record<string, unknown>>;
};

type CaseStudySeo = {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
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

function updateStructuredData(
  profile: { name?: string | null; title?: string | null; bio?: string | null; githubUrl?: string | null; linkedinUrl?: string | null; mediumUrl?: string | null },
  siteUrl: string,
  profileImageUrl: string,
  title: string,
  description: string,
  caseStudy: CaseStudySeo | null,
) {
  const structuredData = document.getElementById('portfolio-structured-data');
  if (!structuredData) return;

  const sameAs = [profile.githubUrl, profile.linkedinUrl, profile.mediumUrl].filter(Boolean);
  const graph: Array<Record<string, unknown>> = [
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
  ];

  if (caseStudy) {
    graph.push({
      '@type': 'CreativeWork',
      name: caseStudy.title.replace(/ \| Nazmus Sakib$/, ''),
      headline: caseStudy.title,
      description: caseStudy.description,
      url: caseStudy.canonicalUrl,
      image: caseStudy.imageUrl,
      author: { '@type': 'Person', name: profile.name || 'Nazmus Sakib', url: siteUrl },
      mainEntityOfPage: caseStudy.canonicalUrl,
    });
  }

  const payload: StructuredData = { '@graph': graph };
  structuredData.textContent = JSON.stringify({ '@context': 'https://schema.org', ...payload });
}

export default function ProfileMetadata() {
  const location = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();
  const { get, settingsFetched } = useSettings();
  const caseStudyMatch = location.pathname.match(/^\/projects\/([^/]+)\/case-study\/?$/);
  const caseStudySlug = caseStudyMatch ? decodeURIComponent(caseStudyMatch[1]) : '';
  const isCaseStudyRoute = Boolean(caseStudySlug);
  const { data: caseStudyProject, isLoading: caseStudyLoading } = trpc.project.getCaseStudyBySlug.useQuery(
    { slug: caseStudySlug || '__disabled__' },
    { enabled: isCaseStudyRoute, staleTime: 300_000 },
  );

  useEffect(() => {
    if (!settingsFetched) return;
    // Keep the server-rendered case-study metadata intact until its project data is ready.
    if (isCaseStudyRoute && caseStudyLoading) return;
    if (isCaseStudyRoute && !caseStudyProject) return;

    const baseTitle = get('seoTitle').trim() || 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer';
    const baseDescription = get('seoDescription').trim() || 'Production-minded AI systems, bilingual NLP, LLM workflows, retrieval, full-stack engineering, and intelligent automation.';
    const baseSiteUrl = toAbsoluteUrl(get('canonicalSiteUrl') || '/', window.location.origin).replace(/\/$/, '') + '/';
    const profileImageUrl = toAbsoluteUrl(resolveProfileImageUrl(profile?.avatarUrl), fallbackProfileImage);
    const caseStudyImage = Array.isArray(caseStudyProject?.caseStudyMedia)
      ? caseStudyProject.caseStudyMedia.find((item) => typeof item === 'object' && item && typeof (item as { url?: unknown }).url === 'string') as { url: string } | undefined
      : undefined;
    const caseStudy: CaseStudySeo | null = caseStudyProject
      ? {
          title: `${caseStudyProject.title} Case Study | Nazmus Sakib`,
          description: caseStudyProject.caseStudySummary?.trim() || caseStudyProject.description,
          canonicalUrl: new URL(`/projects/${encodeURIComponent(caseStudyProject.slug || caseStudySlug)}/case-study`, window.location.origin).href,
          imageUrl: toAbsoluteUrl(caseStudyProject.thumbnailUrl || caseStudyImage?.url || '/og-image.png', '/og-image.png'),
        }
      : null;
    const title = caseStudy?.title || baseTitle;
    const description = caseStudy?.description || baseDescription;
    const siteUrl = caseStudy?.canonicalUrl || baseSiteUrl;
    const faviconUrl = toAbsoluteUrl('/favicon.png?v=2', '/favicon.png?v=2');

    document.title = title;
    ensureMeta('name', 'description').content = description;
    ensureMeta('property', 'og:url').content = siteUrl;
    ensureMeta('property', 'og:title').content = title;
    ensureMeta('property', 'og:description').content = description;
    ensureMeta('name', 'twitter:title').content = title;
    ensureMeta('name', 'twitter:description').content = description;
    ensureMeta('property', 'og:image:alt').content = caseStudy ? `${caseStudyProject?.title} case study — Nazmus Sakib` : get('socialPreviewImageAlt');
    ensureMeta('name', 'twitter:image:alt').content = caseStudy ? `${caseStudyProject?.title} case study — Nazmus Sakib` : get('socialPreviewImageAlt');
    ensureLink('canonical').href = siteUrl;
    ensureLink('icon').href = faviconUrl;
    ensureLink('icon').type = 'image/png';
    ensureLink('icon').sizes.value = '96x96';

    if (profile) updateStructuredData(profile, baseSiteUrl, profileImageUrl, baseTitle, baseDescription, caseStudy);
  }, [caseStudyLoading, caseStudyProject, caseStudySlug, get, isCaseStudyRoute, location.pathname, profile, settingsFetched]);

  return null;
}
