export const fallbackProfileImage = '/images/profile-avatar.jpg';

export function resolveProfileImageUrl(value: string | null | undefined) {
  return value?.trim() || fallbackProfileImage;
}
