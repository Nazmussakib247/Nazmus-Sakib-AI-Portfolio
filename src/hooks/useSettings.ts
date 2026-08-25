import { trpc } from '@/providers/trpc';


export const DEFAULT_SETTINGS: Record<string, string> = {
  heroBadge: '<ml · web · automation />',
  heroHeadline: 'NAZMUS SAKIB',
  heroTagline: 'ML Engineer,AI Engineer,AI Product Engineer',
  heroSubtext:
    'ML Engineer building production-minded AI systems with Python, NLP, LLMs, retrieval, and automation—from bilingual analysis to intelligent business products.',
  heroPrimaryCta: 'View Projects',
  heroPrimaryTarget: 'projects',
  heroSecondaryCta: 'Get In Touch',
  heroSecondaryTarget: 'contact',
  heroCvCta: 'View CV',
  heroScrollLabel: 'Scroll',
  heroScrollTarget: 'about',
  availableForWork: 'true',
  availabilityText: 'Open to opportunities',
  footerText: 'Designed and developed by Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer.',
  bloggerUrl: 'https://nazmuss247.blogspot.com/',
  xUrl: 'https://x.com/Nazmussakib0247',
  seoTitle: 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer',
  seoDescription:
    'Portfolio of Nazmus Sakib, an ML Engineer and AI Product Engineer building practical NLP, LLM, retrieval, automation, and full-stack AI systems.',
  canonicalSiteUrl: 'https://nazmussakib.tech/',
  socialPreviewImageUrl: '/images/hero-portrait.jpg',
  socialPreviewImageAlt: 'Nazmus Sakib — ML Engineer and AI product builder',
  faviconUrl: '/images/profile-avatar.jpg',
  sectionVisibility:
    '{"about":true,"projects":true,"experience":true,"skills":true,"awards":true,"certificates":true,"blog":true,"contact":true}',
  bottomBarEnabled: 'true',
  bottomBarStatusText: 'now automating',
  bottomBarMessage: 'Bilingual AI engineering · Available for selected freelance and remote engagements · Open to thoughtful collaborations',
  bottomBarHireLabel: 'Hire Me',
  bottomBarHireTarget: 'contact',
  assistantAvatarUrl: '/images/assistant/xervis-avatar.png',
  assistantGreetingAudioUrl: '/audio/xervis-greeting.mp3',
  navigationItems: '[{"label":"About","id":"about","section":"about"},{"label":"Projects","id":"projects","section":"projects"},{"label":"Experience","id":"experience","section":"experience"},{"label":"Skills","id":"skills","section":"skills"},{"label":"Awards","id":"awards","section":"awards"},{"label":"Blog","id":"blog","section":"blog"},{"label":"CV","id":"cv"},{"label":"Activity","id":"activity"},{"label":"Contact","id":"contact","section":"contact"}]',
  searchSuggestions: '[{"label":"Explore AI projects","hint":"ML products and systems","id":"projects","icon":"projects"},{"label":"Hirelay recruitment platform","hint":"AI matching and automation","id":"projects","icon":"experience"},{"label":"SentimentScope analysis","hint":"Bilingual sentiment intelligence","id":"projects","icon":"ai"},{"label":"Core AI & ML skills","hint":"Tools and capabilities","id":"skills","icon":"skills"},{"label":"Professional experience","hint":"Journey and current work","id":"experience","icon":"experience"},{"label":"Certifications","hint":"Verified learning milestones","id":"certificates","icon":"certificates"},{"label":"Start a conversation","hint":"Contact Nazmus","id":"contact","icon":"contact"}]',
  sectionCopy: `{"about":{"kicker":"/about","title":"About Me","blurb":"The person behind the code — background, education, and what drives me.","availableLabel":"Available","statProjects":"Projects Built","statCertificates":"Certifications","statExperience":"Work Experiences","statAwards":"Awards Won"},"projects":{"kicker":"/projects","title":"Featured Projects","blurb":"A selection of work spanning machine learning, full-stack development, embedded systems, and automation.","empty":"Projects will appear here once published from the CMS.","details":"View Details","all":"All"},"experience":{"kicker":"/experience","title":"Journey So Far","blurb":"From Northern University to industrial training, AI engineering, entrepreneurship, and interdisciplinary work.","linkedinCta":"View verified experience on LinkedIn","workLabel":"Work","educationLabel":"Education","internshipLabel":"Internship","presentLabel":"Present"},"skills":{"kicker":"/skills","title":"Technical Arsenal","blurb":"Tools and technologies I use to turn ideas into working systems."},"awards":{"kicker":"/recognition","title":"Milestones beyond the code","blurb":"Verified achievements spanning AI innovation, interdisciplinary learning, and academic recognition."},"certificates":{"kicker":"/certificates","title":"Certifications","blurb":"Continuous learning, formally recognized.","empty":"Certificates will appear here once published from the CMS.","verify":"Verify Credential","collection":"Explore the collection"},"blog":{"kicker":"/blog","title":"Writings & Articles","blurb":"Thoughts on machine learning, automation, and building software.","bloggerCta":"Read more on Blogger","bloggerBlurb":"Long-form notes and personal writing from Nazmus Sakib","loading":"Loading published articles…","empty":"No published articles have been added yet.","articleLabel":"Article","readLabel":"Read Article","all":"All"},"cv":{"kicker":"/cv","title":"Curriculum Vitae","blurb":"Preview my CV here first. Download it only when you are ready.","profileLabel":"Professional profile","profileFallback":"Profile","profileBlurb":"ML Engineer and AI product builder working across NLP, LLMs, full-stack systems, and automation. Open the preview to review selected projects, experience, education, and ways to connect.","viewLabel":"View CV","noLink":"CV link will appear here when published","previewBadge":"Preview first · Download inside","focusLabel":"Focus","focusText":"Practical AI products, NLP, LLM workflows, and intelligent automation.","selectedLabel":"Selected work","selectedFallback":"Selected projects will appear here once published.","connectLabel":"Connect","githubLabel":"GitHub","linkedinLabel":"LinkedIn","mediumLabel":"Medium","previewKicker":"In-page preview","previewTitleSuffix":"CV preview","closeLabel":"Close CV preview","noPreview":"CV preview is not published yet.","reviewNote":"Review the CV here, then download a copy if needed.","downloadFileName":"Nazmus-Sakib-CV.pdf","downloadLabel":"Download PDF"},"activity":{"kicker":"/activity","title":"Across The Web","blurb":"Recent public signals from GitHub and Medium, with direct links to connect professionally.","githubLabel":"GitHub","mediumLabel":"Medium","linkedinLabel":"LinkedIn","liveStatus":"Live","profileStatus":"Profile","feedStatus":"Feed","loadingGithub":"Loading activity…","emptyGithub":"No recent public events available. Explore the repositories directly.","openGithub":"Open GitHub","loadingMedium":"Loading writing…","emptyMedium":"Read the latest writing and notes on the Medium profile.","openMedium":"Open Medium","linkedinBlurb":"Connect for professional updates, collaboration, and opportunities in AI engineering, full-stack systems, and automation.","viewProfile":"View profile","footer":"Explore the latest work, writing, and professional updates across Nazmus Sakib’s public platforms.","recentLabel":"recently","minuteSuffix":"m ago","hourSuffix":"h ago","daySuffix":"d ago"},"contact":{"kicker":"/contact","title":"Let's Build Something Together","blurb":"Open to opportunities in machine learning engineering, full-stack development, and automation architecture. Drop a message — I usually reply within a day.","submitLabel":"Send Message","sendingLabel":"Sending…","sentTitle":"Message Sent!","sentBlurb":"Thanks for reaching out — I'll get back to you soon.","anotherLabel":"Send another message","namePlaceholder":"Your name *","emailPlaceholder":"Your email *","subjectPlaceholder":"Subject","messagePlaceholder":"Your message *","channelCta":"Connect with me"}}`,
  xervisIntro: "Hi, I’m Xervis — Nazmus Sakib’s AI Assistant. Ask me about his projects, skills, or experience.",
  xervisStarter: "I can help you explore Nazmus Sakib’s ML projects, AI engineering work, skills, and public writing.",
  xervisSuggestions: '["Tell me about your AI projects","What are your core skills?","Which project uses RAG?","What awards has Nazmus received?","Tell me about the Appstick training","What is SentimentScope?","How did Nazmus build Hirelay?","What kind of AI products does he build?","Show me his certifications","How can I contact Nazmus?"]',
  xervisPlaceholder: "Ask Xervis about a project or skill…",
};

export type SectionKey =
  | 'about'
  | 'projects'
  | 'experience'
  | 'skills'
  | 'awards'
  | 'certificates'
  | 'blog'
  | 'contact';

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function useSettings() {
  const { data } = trpc.settings.getAll.useQuery(undefined, {
    staleTime: 60_000,
    retry: 1,
  });

  const settings = { ...DEFAULT_SETTINGS, ...(data || {}) };

  const get = (key: string) => settings[key] ?? '';

  let visibility: Record<SectionKey, boolean>;
  try {
    visibility = JSON.parse(settings.sectionVisibility);
  } catch {
    visibility = JSON.parse(DEFAULT_SETTINGS.sectionVisibility);
  }

  const isVisible = (key: SectionKey) => visibility[key] !== false;

  const taglines = settings.heroTagline
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const getJson = <T,>(key: string, fallback: T) => parseJson(settings[key] ?? '', fallback);

  return { settings, get, getJson, isVisible, taglines };
}
