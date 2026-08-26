export const CASE_STUDY_RETURN_STORAGE_KEY = 'portfolio-case-study-return';

const LEGACY_SCROLL_KEY = 'portfolio-return-scroll';
const LEGACY_HASH_KEY = 'portfolio-return-hash';
const MAX_CONTEXT_AGE_MS = 24 * 60 * 60 * 1000;

export type CaseStudyReturnContext = {
  originPath: string;
  originKey: string;
  scrollY: number;
  filter: string;
  projectSlug: string;
  createdAt: number;
};

type RouterReturnState = { returnTo?: string } | null | undefined;

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function getCaseStudyOriginPath(location: { pathname: string; search: string; hash: string }) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function readCaseStudyReturnContext(): CaseStudyReturnContext | null {
  if (!storageAvailable()) return null;

  try {
    const raw = window.sessionStorage.getItem(CASE_STUDY_RETURN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CaseStudyReturnContext>;
    const context: CaseStudyReturnContext = {
      originPath: typeof parsed.originPath === 'string' ? parsed.originPath : '',
      originKey: typeof parsed.originKey === 'string' ? parsed.originKey : '',
      scrollY: Number(parsed.scrollY),
      filter: typeof parsed.filter === 'string' ? parsed.filter : '',
      projectSlug: typeof parsed.projectSlug === 'string' ? parsed.projectSlug : '',
      createdAt: Number(parsed.createdAt),
    };

    const valid = context.originPath.startsWith('/')
      && context.originKey.length > 0
      && Number.isFinite(context.scrollY)
      && context.scrollY >= 0
      && Number.isFinite(context.createdAt)
      && Date.now() - context.createdAt <= MAX_CONTEXT_AGE_MS;

    if (!valid) {
      clearCaseStudyReturnContext();
      return null;
    }

    return context;
  } catch {
    clearCaseStudyReturnContext();
    return null;
  }
}

export function saveCaseStudyReturnContext(context: Omit<CaseStudyReturnContext, 'createdAt'>) {
  if (!storageAvailable()) return;

  try {
    window.sessionStorage.setItem(CASE_STUDY_RETURN_STORAGE_KEY, JSON.stringify({
      ...context,
      createdAt: Date.now(),
    } satisfies CaseStudyReturnContext));
    window.sessionStorage.removeItem(LEGACY_SCROLL_KEY);
    window.sessionStorage.removeItem(LEGACY_HASH_KEY);
  } catch {
    // Storage restrictions should never prevent case-study navigation.
  }
}

export function clearCaseStudyReturnContext() {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.removeItem(CASE_STUDY_RETURN_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_SCROLL_KEY);
    window.sessionStorage.removeItem(LEGACY_HASH_KEY);
  } catch {
    // Storage restrictions should never affect ordinary navigation.
  }
}

export function isCaseStudyReturn(
  context: CaseStudyReturnContext | null,
  locationKey: string,
  currentPath: string,
  routerState: RouterReturnState,
) {
  if (routerState?.returnTo === 'projects') return true;
  return Boolean(context && (context.originKey === locationKey || context.originPath === currentPath));
}
