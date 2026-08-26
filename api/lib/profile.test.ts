import { describe, expect, it } from 'vitest';
import { cleanPlatformLinks, PLATFORM_LINK_KEYS } from './profile';

describe('cleanPlatformLinks', () => {
  it('keeps only supported non-empty links and trims values', () => {
    const result = cleanPlatformLinks({
      github: 'https://github.com/Nazmussakib247',
      devto: '  https://dev.to/nazmussakib247  ',
      medium: '',
      kaggle: 'https://www.kaggle.com/nazmussakib247',
      unknown: 'https://example.com',
    });

    expect(result).toEqual({
      devto: 'https://dev.to/nazmussakib247',
      kaggle: 'https://www.kaggle.com/nazmussakib247',
    });
    expect(Object.keys(result).every((key) => (PLATFORM_LINK_KEYS as readonly string[]).includes(key))).toBe(true);
  });

  it('returns an empty object for missing or empty input', () => {
    expect(cleanPlatformLinks(undefined)).toEqual({});
    expect(cleanPlatformLinks({ github: '   ', kaggle: undefined })).toEqual({});
  });
});
