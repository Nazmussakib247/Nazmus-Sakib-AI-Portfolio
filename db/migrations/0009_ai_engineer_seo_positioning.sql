-- Align the public role positioning around one primary identity.
-- Only replace the previous defaults; preserve administrator-customized values.

UPDATE site_settings
SET value = 'Nazmus Sakib — AI Engineer | RAG, LLM & Automation', updated_at = NOW()
WHERE key = 'seoTitle'
  AND value = 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer';

UPDATE site_settings
SET value = 'Portfolio of Nazmus Sakib, an AI Engineer specializing in RAG, LLM systems, NLP, intelligent automation, and full-stack AI products.', updated_at = NOW()
WHERE key = 'seoDescription'
  AND value IN (
    'Portfolio of Nazmus Sakib, an ML Engineer and AI Product Engineer building practical NLP, LLM, retrieval, automation, and full-stack AI systems.',
    'Portfolio of Nazmus Sakib, an ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.'
  );

UPDATE profiles
SET title = 'AI Engineer · RAG & LLM Systems · Intelligent Automation', updated_at = NOW()
WHERE title = 'ML Engineer · Full Stack Developer · Automation Architect';

UPDATE site_settings
SET value = 'AI ENGINEER · RAG · LLM SYSTEMS', updated_at = NOW()
WHERE key = 'heroBadge'
  AND value = 'AI ENGINEER · RAG · AUTOMATION';

UPDATE site_settings
SET value = 'Building practical AI systems, retrieval workflows, and intelligent automation.', updated_at = NOW()
WHERE key = 'footerText'
  AND value = 'Designed and developed by Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer.';

-- Migration intentionally does not overwrite customized values.

