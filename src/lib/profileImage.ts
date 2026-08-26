export const fallbackProfileImage = '/images/profile-avatar.jpg';

// The current production profile upload is the old AI portrait. New Admin
// uploads use their own URLs and continue to render normally.
const legacyProfileImageMarkers = ['/api/files/29'];

export function resolveProfileImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim() || '';
  return !trimmed || legacyProfileImageMarkers.some((marker) => trimmed.includes(marker))
    ? fallbackProfileImage
    : trimmed;
}
