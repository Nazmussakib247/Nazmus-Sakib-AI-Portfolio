import { useEffect } from 'react';
import { trpc } from '@/providers/trpc';

const fallbackProfileImage = '/images/profile-avatar.jpg';

type StructuredData = {
  '@graph'?: Array<Record<string, unknown>>;
};

function toAbsoluteUrl(value: string) {
  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return new URL(fallbackProfileImage, window.location.origin).href;
  }
}

function updateSocialPreviewImage(imageUrl: string) {
  document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.setAttribute('content', imageUrl);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.setAttribute('content', imageUrl);
}

function updateStructuredProfileImage(imageUrl: string) {
  const structuredData = document.getElementById('portfolio-structured-data');
  if (!structuredData?.textContent) return;

  try {
    const parsed = JSON.parse(structuredData.textContent) as StructuredData;
    const person = parsed['@graph']?.find((entry) => entry['@type'] === 'Person');
    if (!person) return;
    person.image = imageUrl;
    structuredData.textContent = JSON.stringify(parsed);
  } catch {
    // Keep the valid initial structured data if another script is updating it.
  }
}

export default function ProfileMetadata() {
  const { data: profile } = trpc.profile.get.useQuery();

  useEffect(() => {
    if (!profile) return;

    const imageUrl = toAbsoluteUrl(profile.avatarUrl?.trim() || fallbackProfileImage);
    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ?? document.createElement('link');

    favicon.rel = 'icon';
    favicon.href = imageUrl;
    favicon.removeAttribute('type');
    favicon.dataset.profileFavicon = 'true';
    if (!favicon.parentNode) document.head.appendChild(favicon);

    updateSocialPreviewImage(imageUrl);
    updateStructuredProfileImage(imageUrl);
  }, [profile]);

  return null;
}
