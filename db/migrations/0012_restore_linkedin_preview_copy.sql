-- Restore the recruiter-facing LinkedIn preview copy without overwriting custom Admin values.
UPDATE site_settings
SET value = 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer', updated_at = NOW()
WHERE key = 'seoTitle'
  AND value IN (
    'Nazmus Sakib — AI Engineer | RAG, LLM & Automation',
    'Nazmus Sakib — AI Engineer · AI Product Engineer'
  );

UPDATE site_settings
SET value = 'Production-minded AI systems, bilingual NLP, LLM workflows, retrieval, full-stack engineering, and intelligent automation.', updated_at = NOW()
WHERE key = 'seoDescription'
  AND value IN (
    'Portfolio of Nazmus Sakib, an AI Engineer specializing in RAG, LLM systems, NLP, intelligent automation, and full-stack AI products.',
    'Portfolio of Nazmus Sakib, an ML Engineer and AI Product Engineer building practical NLP, LLM, retrieval, automation, and full-stack AI systems.',
    'Portfolio of an ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.'
  );
