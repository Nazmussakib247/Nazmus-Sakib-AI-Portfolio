import { describe, expect, it } from 'vitest';
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, normalizeSeoSetting } from './seo';

describe('normalizeSeoSetting', () => {
  it('normalizes legacy title and description values', () => {
    expect(normalizeSeoSetting('seoTitle', ' Nazmus Sakib — AI Engineer · AI Product Engineer ')).toBe(DEFAULT_SEO_TITLE);
    expect(normalizeSeoSetting('seoDescription', 'Portfolio of an ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.')).toBe(DEFAULT_SEO_DESCRIPTION);
  });

  it('trims normal values and safely handles empty values', () => {
    expect(normalizeSeoSetting('seoTitle', '  Custom portfolio title  ')).toBe('Custom portfolio title');
    expect(normalizeSeoSetting('seoDescription', null)).toBe('');
    expect(normalizeSeoSetting('other', undefined)).toBe('');
  });
});
