export const fallbackProfileImage = '/images/profile-avatar.jpg';

// This is the legacy profile upload currently stored in production. New Admin
// uploads remain supported; only the known old portrait falls back.
const legacyProfileImageMarkers = ['/api/files/29'];

export function resolveProfileImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim() || '';
  return !trimmed || legacyProfileImageMarkers.some((marker) => trimmed.includes(marker))
    ? fallbackProfileImage
    : trimmed;
}
