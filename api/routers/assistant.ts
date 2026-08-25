import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter, publicQuery } from '../middleware';
import { getDb } from '../queries/connection';
import { profiles, projects, experiences, awards, certificates, writings, skills, siteSettings } from '@db/schema';
import { desc, eq } from 'drizzle-orm';
import { ensureProfilePlatformLinksColumn } from '../lib/profile';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const MAX_CONTEXT_CHARS = 8_500;
const ANSWER_CACHE_TTL_MS = 5 * 60 * 1000;
const answerCache = new Map<string, { answer: string; sources: string[]; expiresAt: number }>();

type RetrievalPlan = {
  collections: Array<'profile' | 'projects' | 'experiences' | 'awards' | 'certificates' | 'writings' | 'skills'>;
  keywords: string[];
};

function recordText(record: unknown) {
  return JSON.stringify(record).toLowerCase();
}

function buildRetrievalPlan(question: string): RetrievalPlan {
  const normalized = question.toLowerCase();
  const keywords = new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2));
  const aliases: Array<[RegExp, string[]]> = [
    [/hirelay|recruit|candidate|cv|resume|চাকরি|প্রার্থী|বাছাই|রিক্রুট/, ['hirelay', 'recruitment', 'candidate', 'cv', 'matching']],
    [/automation|workflow|অটোমেশন|ওয়ার্কফ্লো/, ['automation', 'n8n', 'workflow']],
    [/skill|technology|stack|স্কিল|দক্ষতা|টেকনোলজি/, ['python', 'react', 'typescript', 'machine learning', 'skills']],
    [/education|university|study|শিক্ষা|বিশ্ববিদ্যালয়|পড়াশোনা/, ['education', 'university', 'northern']],
    [/award|prize|hackathon|পুরস্কার|অ্যাওয়ার্ড|হ্যাকাথন/, ['award', 'solvio', 'media olympiad']],
    [/certificate|certification|সার্টিফিকেট|সার্টিফিকেশন/, ['certificate', 'google', 'git']],
    [/article|writing|blog|medium|blogger|লেখা|আর্টিকেল/, ['writing', 'medium', 'blog']],
    [/radar|arduino|sensor|রাডার|আরডুইনো|সেন্সর/, ['radar', 'arduino', 'ultrasonic']],
  ];
  for (const [pattern, terms] of aliases) {
    if (pattern.test(normalized)) terms.forEach((term) => keywords.add(term));
  }
  return { collections: ['profile', 'projects', 'experiences', 'awards', 'certificates', 'writings', 'skills'], keywords: Array.from(keywords).slice(0, 18) };
}

async function retrievePortfolioContext(plan: RetrievalPlan) {
  const db = getDb();
  await ensureProfilePlatformLinksColumn(db);
  const selected = new Set(plan.collections);
  const [profileRows, projectRows, experienceRows, awardRows, certificateRows, writingRows, skillRows] = await Promise.all([
    selected.has('profile') ? db.select().from(profiles) : Promise.resolve([]),
    selected.has('projects') ? db.select().from(projects) : Promise.resolve([]),
    selected.has('experiences') ? db.select().from(experiences) : Promise.resolve([]),
    selected.has('awards') ? db.select().from(awards) : Promise.resolve([]),
    selected.has('certificates') ? db.select().from(certificates) : Promise.resolve([]),
    selected.has('writings') ? db.select().from(writings).where(eq(writings.isPublished, true)).orderBy(desc(writings.createdAt)) : Promise.resolve([]),
    selected.has('skills') ? db.select().from(skills) : Promise.resolve([]),
  ]);
  const keywordSet = plan.keywords.map((keyword) => keyword.toLowerCase().trim()).filter(Boolean);
  const tokenize = (value: string) => new Set(value.normalize('NFKC').split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1));
  const limitRows = (rows: unknown[]) => {
    if (rows.length <= 8 && keywordSet.length === 0) return rows;
    const ranked = rows.map((row) => {
      const text = recordText(row);
      const tokens = tokenize(text);
      const score = keywordSet.reduce((total, keyword) => {
        const normalized = keyword.normalize('NFKC');
        if (text.includes(normalized)) return total + (normalized.includes(' ') ? 5 : 3);
        return total + (tokens.has(normalized) ? 2 : 0);
      }, 0);
      return { row, score };
    }).sort((left, right) => right.score - left.score);
    const relevant = ranked.filter((item) => item.score > 0).slice(0, 8).map((item) => item.row);
    return (relevant.length > 0 ? relevant : ranked.slice(0, 8).map((item) => item.row));
  };
  const context = {
    profile: profileRows.map(({ email, cvUrl, ...publicProfile }) => publicProfile),
    projects: limitRows(projectRows),
    experiences: limitRows(experienceRows),
    awards: limitRows(awardRows),
    certificates: limitRows(certificateRows),
    writings: limitRows(writingRows),
    skills: limitRows(skillRows),
  };
  return JSON.stringify(context).slice(0, MAX_CONTEXT_CHARS);
}

type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type AIProvider = 'gemini' | 'groq' | 'xai' | 'openai';
type ModelOptions = { json?: boolean; model: string; apiUrl: string; provider: AIProvider };

async function callModel(apiKey: string, messages: ModelMessage[], options: ModelOptions) {
  if (options.provider === 'gemini') {
    const base = options.apiUrl.replace(/\/$/, '').replace(/\/v1beta$/, '');
    const endpoint = `${base}/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const systemText = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n');
    const contents = messages.filter((message) => message.role !== 'system').map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}), contents, generationConfig: { temperature: options.json ? 0 : 0.25, maxOutputTokens: options.json ? 300 : 650, ...(options.json ? { responseMimeType: 'application/json' } : {}) } }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) {
      const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 240);
      throw new Error(`Gemini returned ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!answer) throw new Error('Gemini returned an empty response');
    return answer;
  }

  const compatibleBase = options.apiUrl.replace(/\/$/, '');
  const endpoint = `${compatibleBase.endsWith('/v1') ? compatibleBase : `${compatibleBase}/v1`}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: options.model, temperature: options.json ? 0 : 0.25, max_tokens: options.json ? 400 : 450, ...(options.provider === 'groq' ? { reasoning_effort: 'none' } : {}), ...(options.json ? { response_format: { type: 'json_object' } } : {}), messages }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 240);
    throw new Error(`AI provider returned ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const answer = data.choices?.[0]?.message?.content?.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (!answer) throw new Error('AI provider returned an empty response');
  return answer;
}

const portfolioContext = `
You are Xervis, Nazmus Sakib’s portfolio AI assistant. The subject is Nazmus Sakib, the ML Engineer and CSE student from this portfolio—not any other public person with a similar name. If the visitor says only “Sakib”, interpret it as Nazmus Sakib. Answer only from this verified portfolio context. If a detail is not present, say you do not have that detail and invite the visitor to contact Nazmus. Never invent employers, metrics, clients, awards, or links.

Biography: Nazmus Sakib is a 24-year-old final-year Computer Science & Engineering student at Northern University of Business & Technology, Khulna, Bangladesh. He works as a Machine Learning Engineering Intern at FlyRank AI in Chicago, building NLP pipelines, data-processing systems, and model fine-tuning workflows. His CSE 4100 field-work / industrial training at Appstick included building Hirelay, an end-to-end AI-assisted recruiting platform with React, FastAPI, PostgreSQL, NLP matching, n8n automation, Docker, and security controls. Earlier, he founded NS Gaming Shop during the pandemic and worked as a freelance WordPress Developer. Alor Dishari is preserved as a featured portfolio journey segment; details should only be expanded when its original source is available. His professional direction is ML engineering, AI product building, full-stack development, and business automation. He combines practical engineering with clear technical writing and is interested in reliable, explainable, human-centered AI systems.

Selected projects:
- Hirelay: an AI-assisted recruitment platform for CV parsing, transparent candidate matching, interview scheduling, multi-platform job posting, analytics, and n8n automation. Repository: https://github.com/Nazmussakib247/hirelay
- SentimentScope: a browser-first English and Bangla sentiment analysis platform with explainable rules, in-browser ML training, visualizations, exports, and optional LLM chat. Repository: https://github.com/Nazmussakib247/sentimentscope
- Swadeshi: an evidence-led Bangladeshi craft storefront with React, Express, SQLite, accounts, saved collections, orders, validation, and CI. Repository: https://github.com/Nazmussakib247/swadeshi
- Enterprise NeXus: a multi-agent business automation OS concept with HR, Finance, Support, Analytics, Executive, RAG, and Security Intelligence modules. Repository: https://github.com/Nazmussakib247/CSE4204-8B-T04-Enterprise-Nexus-Multi-Agent-AI-Business-Automation-OS-with-Security-Intelligence
- Neighbour: a local-services marketplace with discovery, professional profiles, booking, reviews, messaging, admin controls, React, PHP, MySQL, and Docker. Repository: https://github.com/Nazmussakib247/neighbour
- SpamGuard AI: a local-first spam detection dashboard with transparent analysis, CSV workflows, browser-side models, and an optional FastAPI/scikit-learn backend. Repository: https://github.com/Nazmussakib247/spamguard-ai
- Arduino-Based Military Radar System: a Computer Architecture university assignment using Arduino and an ultrasonic sensor to sweep a detection arc, measure object distance, and visualize angle/distance readings in a radar-style interface. The hardware prototype drives the sensing loop while the computer-side visualization renders the scan output. Repository: https://github.com/Nazmussakib247/Computer-Architecture. Video: https://www.linkedin.com/posts/nazmussakib247_aurdino-based-military-radar-system-computer-activity-7289634889333714945-TQHH

Skills: C, C++, Python, SQL, Git, GitHub, Docker, HTML, CSS, React, TypeScript, Node.js, Express, FastAPI, scikit-learn, machine learning, NLP, LLMs, RAG, LangChain, SQLite, PostgreSQL, n8n, and system design.

Public links: GitHub https://github.com/Nazmussakib247, LinkedIn https://www.linkedin.com/in/nazmussakib247/, Medium https://medium.com/@nazmussakib.cse.nubt.
`.trim();

async function getAiConfig() {
  const db = getDb();
  let rows: Array<{ key: string; value: string | null }> = [];
  try {
    rows = await db.select({ key: siteSettings.key, value: siteSettings.value }).from(siteSettings);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[assistant] AI settings table unavailable; using environment configuration: ${reason}`);
  }
  const values = Object.fromEntries(rows.filter((row) => ['aiProvider', 'aiApiUrl', 'aiApiKey', 'aiModel'].includes(row.key)).map((row) => [row.key, row.value || '']));
  const apiUrl = values.aiApiUrl || process.env.AI_API_URL?.trim() || '';
  const provider = (values.aiProvider || process.env.AI_PROVIDER || (apiUrl.includes('generativelanguage.googleapis.com') ? 'gemini' : apiUrl.includes('api.groq.com') ? 'groq' : apiUrl.includes('api.x.ai') ? 'xai' : 'openai')) as AIProvider;
  return { apiUrl, apiKey: values.aiApiKey || process.env.AI_API_KEY?.trim(), model: values.aiModel || process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-3.5-flash-lite' : 'gpt-5-mini'), provider };
}

function allowed(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}

async function getLiveContext() {
  const [githubResult, mediumResult] = await Promise.allSettled([
    fetch('https://api.github.com/users/Nazmussakib247/events/public?per_page=5', { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Nazmus-Sakib-Portfolio' }, signal: AbortSignal.timeout(5000) }),
    fetch('https://medium.com/feed/@nazmussakib.cse.nubt', { headers: { Accept: 'application/rss+xml, application/xml' }, signal: AbortSignal.timeout(5000) }),
  ]);
  const live: string[] = [];
  if (githubResult.status === 'fulfilled' && githubResult.value.ok) {
    try {
      const events = (await githubResult.value.json()) as Array<{ type?: string; repo?: { name?: string }; created_at?: string }>;
      if (events.length) live.push(`Recent GitHub public activity: ${events.slice(0, 5).map((event) => `${(event.type || 'Activity').replace(/Event$/, '')} on ${event.repo?.name || 'a repository'} (${event.created_at || 'recently'})`).join('; ')}.`);
    } catch { /* optional live context */ }
  }
  if (mediumResult.status === 'fulfilled' && mediumResult.value.ok) {
    try {
      const xml = await mediumResult.value.text();
      const titles = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g)).slice(0, 4).map((match) => match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim());
      if (titles.length) live.push(`Recent Medium writing: ${titles.join('; ')}.`);
    } catch { /* optional live context */ }
  }
  return live.length ? `Live public data retrieved for this conversation:\\n${live.join('\\n')}` : 'Live public activity was unavailable; rely on the verified portfolio context only.';
}

function fallbackAnswer(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes('hirelay') || normalized.includes('recruit')) {
    return 'Hirelay is Nazmus Sakib’s AI-assisted recruitment platform. It covers CV parsing, transparent candidate matching, interview scheduling, job posting, analytics, and n8n automation. You can explore the code on GitHub from the Projects section.';
  }
  if (normalized.includes('sentiment') || normalized.includes('bangla')) {
    return 'SentimentScope is a bilingual English and Bangla sentiment analysis platform. It combines explainable rules, browser-side ML training, visualizations, exports, and optional LLM chat.';
  }
  if (normalized.includes('radar') || normalized.includes('arduino') || normalized.includes('ultrasonic') || normalized.includes('sensor')) {
    return 'The Arduino-Based Military Radar System is a Computer Architecture university assignment. An Arduino-controlled ultrasonic sensing loop sweeps an angular detection range, measures distance to objects, and feeds angle/distance readings into a radar-style visualization. The project demonstrates embedded input handling, serial-style data flow, real-time scanning logic, and visual feedback. Its source is in the Computer-Architecture repository, and the Projects modal links to the original LinkedIn video.';
  }
  if (normalized.includes('education') || normalized.includes('university') || normalized.includes('northern')) {
    return 'Nazmus Sakib is a final-year Computer Science & Engineering student at Northern University of Business & Technology, Khulna.';
  }
  if (normalized.includes('appstick') || normalized.includes('industrial training') || normalized.includes('field work')) {
    return 'As part of his CSE 4100 Field Work / Industrial Training at Appstick, Nazmus built Hirelay as a full-stack applied AI system. The implementation combined a React 18 + Vite frontend, FastAPI/Python REST services, PostgreSQL with Alembic, rule-based CV parsing, a four-layer matching engine using skill similarity, experience matching, TF-IDF similarity, and LLM-based semantic evaluation, n8n workflow automation, JWT/bcrypt security, Docker Compose deployment, automated email communication, and multi-platform job distribution.';
  }
  if (normalized.includes('hirelay') || normalized.includes('matching') || normalized.includes('cv')) {
    return 'Hirelay parses PDF/DOCX CVs, extracts skills, experience, and education, then matches candidates to jobs through skill similarity, experience matching, TF-IDF similarity, and LLM-based semantic evaluation. It also supports explainable candidate summaries, auto-shortlisting, interview invitations, job distribution, email logs, and evaluation reporting.';
  }
  if (normalized.includes('n8n') || normalized.includes('automation workflow')) {
    return 'n8n is used in Nazmus’s workflow automation layer to connect recruitment events with actions such as multi-platform job posting, webhook integrations, and communication workflows. It complements the React frontend, FastAPI services, database, and AI matching pipeline rather than replacing them.';
  }
  if (normalized.includes('skill') || normalized.includes('technology') || normalized.includes('stack')) {
    return 'Nazmus works across Python, SQL, C/C++, Git, Docker, React, TypeScript, FastAPI, scikit-learn, machine learning, NLP, LLMs, RAG, LangChain, SQLite, PostgreSQL, and automation with n8n.';
  }
  if (normalized.includes('contact') || normalized.includes('hire') || normalized.includes('available')) {
    return 'For opportunities, collaborations, or project discussions, use the contact form or connect through LinkedIn at linkedin.com/in/nazmussakib247/.';
  }
  return 'I can explain Nazmus Sakib’s projects, education, Appstick industrial training, technical skills, AI/NLP work, and public writing. Try asking about Hirelay, the Arduino radar system, Northern University, Python, RAG, or his tech stack.';
}

export const assistantRouter = createRouter({
  chat: publicQuery
    .input(z.object({
      question: z.string().trim().min(2).max(1200),
      history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) })).max(8).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      if (!allowed(ip)) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Please wait a moment before asking another question.' });
      }

      const aiConfig = await getAiConfig();
      const apiUrl = aiConfig.apiUrl;
      const apiKey = aiConfig.apiKey;
      const cacheKey = `${aiConfig.provider}:${aiConfig.model}:${input.question.trim().toLowerCase()}`;
      const cached = answerCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) return { answer: cached.answer, mode: 'ai' as const, sources: cached.sources };
      if (cached) answerCache.delete(cacheKey);
      if (!apiUrl || !apiKey) return { answer: fallbackAnswer(input.question), mode: 'fallback' as const };

      try {
        new URL(apiUrl);
      } catch {
        return { answer: fallbackAnswer(input.question), mode: 'fallback' as const };
      }

      try {
        // Use one deterministic retrieval pass before generation. This avoids a second
        // provider request on free-tier models, where two calls often trigger 429s.
        const retrievalPlan = buildRetrievalPlan(input.question);
        const sourceLabels = retrievalPlan.collections.map((collection) => ({ profile: 'Profile', projects: 'Projects', experiences: 'Experience', awards: 'Awards', certificates: 'Certificates', writings: 'Writings', skills: 'Skills' })[collection]);
        let databaseContext = 'Database retrieval was unavailable for this request; use the verified portfolio summary only.';
        try {
          databaseContext = await retrievePortfolioContext(retrievalPlan);
        } catch (databaseError) {
          const reason = databaseError instanceof Error ? databaseError.message : String(databaseError);
          console.warn(`[assistant] database retrieval unavailable (${aiConfig.provider}/${aiConfig.model}): ${reason}`);
        }
        const normalizedQuestion = input.question.toLowerCase();
        const needsLiveContext = /github|medium|writing|article|activity|recent|latest|blog|post/.test(normalizedQuestion);
        const liveContext = needsLiveContext ? await getLiveContext() : 'Live public activity was not needed for this question.';
        const answer = await callModel(apiKey, [
          { role: 'system', content: `${portfolioContext}\n\nYou are now in the answer-generation pass. The visitor is asking about Nazmus Sakib, not another person or celebrity with a similar name. Reply in the same language as the visitor’s question; for Bengali questions, answer naturally in Bengali. The DATABASE CONTEXT below is the source of truth and may contain newer or richer information than the static summary. Answer only with facts supported by the database context or clearly labelled live public activity. Never invent missing details, private email addresses, employers, metrics, dates, or links. If the database does not contain the answer, say so naturally and suggest the visitor use the contact form. Refer to Nazmus in the first person only when it sounds natural for a portfolio assistant. Keep the answer polished, warm, specific, and concise; use short paragraphs or bullets when helpful.\n\nDATABASE CONTEXT:\n${databaseContext}\n\n${liveContext}` },
          ...input.history,
          { role: 'user', content: input.question },
        ], { model: aiConfig.model, apiUrl, provider: aiConfig.provider });
        answerCache.set(cacheKey, { answer, sources: sourceLabels, expiresAt: Date.now() + ANSWER_CACHE_TTL_MS });
        return { answer, mode: 'ai' as const, sources: sourceLabels };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`[assistant] answer generation failed (${aiConfig.provider}/${aiConfig.model}): ${reason}`);
        return { answer: fallbackAnswer(input.question), mode: 'fallback' as const };
      }
    }),
});
