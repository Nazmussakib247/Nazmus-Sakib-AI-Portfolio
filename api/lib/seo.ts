export const DEFAULT_SEO_TITLE = 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer';
export const DEFAULT_SEO_DESCRIPTION = 'Production-minded AI systems, bilingual NLP, LLM workflows, retrieval, full-stack engineering, and intelligent automation.';

const LEGACY_SEO_TITLES = new Set([
  'Nazmus Sakib — AI Engineer | RAG, LLM & Automation',
  'Nazmus Sakib — AI Engineer · AI Product Engineer',
]);

const LEGACY_SEO_DESCRIPTIONS = new Set([
  'Portfolio of Nazmus Sakib, an AI Engineer specializing in RAG, LLM systems, NLP, intelligent automation, and full-stack AI products.',
  'Portfolio of Nazmus Sakib, an ML Engineer and AI Product Engineer building practical NLP, LLM, retrieval, automation, and full-stack AI systems.',
  'Portfolio of an ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.',
]);

export function normalizeSeoSetting(key: string, value: string | null | undefined) {
  const trimmed = value?.trim() || '';
  if (key === 'seoTitle' && LEGACY_SEO_TITLES.has(trimmed)) return DEFAULT_SEO_TITLE;
  if (key === 'seoDescription' && LEGACY_SEO_DESCRIPTIONS.has(trimmed)) return DEFAULT_SEO_DESCRIPTION;
  return trimmed;
}
