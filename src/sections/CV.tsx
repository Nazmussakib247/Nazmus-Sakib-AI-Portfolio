import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Download, Eye, FileText, Github, Linkedin, Link2, X } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useReveal } from '@/components/fx/useReveal';
import SectionHeading from '@/components/fx/SectionHeading';
import { useSettings } from '@/hooks/useSettings';
import KaggleMark from '@/components/brands/KaggleMark';

export const CV_PREVIEW_EVENT = 'portfolio:open-cv-preview';

type PdfModule = typeof import('pdfjs-dist');
type PdfDocument = import('pdfjs-dist').PDFDocumentProxy;
let pdfModulePromise: Promise<PdfModule> | null = null;

function loadPdfModule() {
  if (!pdfModulePromise) {
    pdfModulePromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, worker]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjsLib;
    });
  }
  return pdfModulePromise;
}

export function prefetchPdfViewer() {
  void loadPdfModule();
}

const EXTRA_PLATFORM_OPTIONS = [
  { key: 'hackerrank', label: 'HackerRank', mark: 'HR' },
  { key: 'kaggle', label: 'Kaggle', mark: 'K' },
  { key: 'leetcode', label: 'LeetCode', mark: 'LC' },
  { key: 'codeforces', label: 'Codeforces', mark: 'CF' },
  { key: 'huggingface', label: 'Hugging Face', mark: 'HF' },
  { key: 'gitlab', label: 'GitLab', mark: 'GL' },
  { key: 'stackoverflow', label: 'Stack Overflow', mark: 'SO' },
  { key: 'devto', label: 'DEV Community', mark: 'DEV' },
  { key: 'behance', label: 'Behance', mark: 'BE' },
  { key: 'dribbble', label: 'Dribbble', mark: 'DB' },
] as const;

function getCvTrafficSource() {
  if (typeof window === 'undefined') return 'direct' as const;
  const referrer = document.referrer.toLowerCase();
  if (!referrer) return 'direct' as const;
  if (referrer.includes('google.')) return 'google' as const;
  if (referrer.includes('linkedin.com')) return 'linkedin' as const;
  if (referrer.includes('github.com')) return 'github' as const;
  if (referrer.includes('medium.com')) return 'medium' as const;
  if (referrer.startsWith(window.location.origin)) return 'direct' as const;
  return 'referral' as const;
}

function MobilePdfPreview({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPdf(null);
    setPageCount(0);
    loadPdfModule().then((pdfjsLib) => pdfjsLib.getDocument(url).promise).then((document) => {
      if (cancelled) {
        void document.destroy();
        return;
      }
      setPdf(document);
      setPageCount(document.numPages);
      setStatus('ready');
    }).catch(() => {
      if (!cancelled) setStatus('error');
    });
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (!pdf || !pageCount) return;
    let cancelled = false;
    const renderPages = async () => {
      const containerWidth = Math.max(280, (containerRef.current?.clientWidth || 360) - 24);
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        if (cancelled) return;
        const page = await pdf.getPage(pageNumber);
        const canvas = canvasRefs.current[pageNumber - 1];
        if (!canvas) continue;
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1.5, containerWidth / baseViewport.width) });
        const context = canvas.getContext('2d');
        if (!context) continue;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        await page.render({ canvasContext: context, viewport }).promise;
      }
    };
    void renderPages();
    return () => { cancelled = true; };
  }, [pdf, pageCount]);

  if (status === 'error') {
    return <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-sm text-gray-400"><p>Mobile preview could not render this PDF.</p><a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#e8b923]/40 px-4 py-2 text-[#e8b923]">Open CV PDF</a></div>;
  }
  return <div ref={containerRef} aria-label={title} className="h-full overflow-y-auto bg-[#202124] p-3"><div className="mx-auto flex w-fit min-w-full flex-col items-center gap-3">{status === 'loading' && <p className="py-8 text-sm text-gray-500">Loading CV preview…</p>}{Array.from({ length: pageCount }, (_, index) => <canvas key={index} ref={(canvas) => { canvasRefs.current[index] = canvas; }} className="block max-w-full bg-white shadow-lg" aria-label={`${title} page ${index + 1}`} />)}</div></div>;
}

export default function CV() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { getJson } = useSettings();
  const copy = getJson<{ cv?: Record<string, string> }>('sectionCopy', {});
  const cvCopy = copy.cv ?? {};
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: projects } = trpc.project.list.useQuery();
  useReveal(sectionRef, [profile, projects]);

  const cvUrl = profile?.cvUrl || '';
  const selectedWork = (projects ?? []).slice(0, 6).map((project) => project.title).filter(Boolean).join(', ');
  const trackCvEvent = trpc.analytics.trackCv.useMutation();
  const downloadHref = cvUrl.startsWith('/api/files/') ? '/api/cv/download' : cvUrl;
  const recordCvEvent = useCallback((kind: 'preview' | 'download') => {
    trackCvEvent.mutate({
      kind,
      source: getCvTrafficSource(),
      path: `${window.location.pathname}${window.location.hash}`.slice(0, 160),
    });
  }, [trackCvEvent]);

  useEffect(() => {
    const openPreview = () => {
      recordCvEvent('preview');
      setIsPreviewOpen(true);
    };
    window.addEventListener(CV_PREVIEW_EVENT, openPreview);
    return () => window.removeEventListener(CV_PREVIEW_EVENT, openPreview);
  }, [recordCvEvent]);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPreviewOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPreviewOpen]);

  return (
    <>
      <section
        id="cv"
        ref={sectionRef}
        className="relative w-full overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            kicker={cvCopy.kicker || ''}
            title={cvCopy.title || ''}
            blurb={cvCopy.blurb || ''}
          />

          <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div data-reveal="left" className="will-reveal glass-strong relative overflow-hidden rounded-3xl border border-[#e8b923]/20 p-7 sm:p-10">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#7c5cff]/10 blur-3xl" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e8b923]/30 bg-[#e8b923]/10">
                      <FileText className="h-7 w-7 text-[#e8b923]" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#e8b923]">{cvCopy.profileLabel || ''}</p>
                      <h3 className="mt-1 text-2xl font-medium text-white">{profile?.name || cvCopy.profileFallback || ''}</h3>
                    </div>
                  </div>
                  <p className="max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">{cvCopy.profileBlurb || ''}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {cvUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        recordCvEvent('preview');
                        setIsPreviewOpen(true);
                      }}
                      onPointerEnter={prefetchPdfViewer}
                      onFocus={prefetchPdfViewer}
                      className="glow-gold group inline-flex items-center gap-2 rounded-full bg-[#e8b923] px-6 py-3 text-sm font-semibold text-[#05060f] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f5cd45]"
                    >
                      <Eye className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      {cvCopy.viewLabel || ''}
                      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#05060f]/60" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-xs text-gray-500">
                      {cvCopy.noLink || ''}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-xs text-gray-500">
                    {cvCopy.previewBadge || ''}
                  </span>
                </div>
              </div>
            </div>

            <div data-reveal="right" className="will-reveal grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="glass card-hover rounded-2xl p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#e8b923]">{cvCopy.focusLabel || ''}</p>
                <p className="text-sm leading-relaxed text-gray-300">{cvCopy.focusText || ''}</p>
              </div>
              <div className="glass card-hover rounded-2xl p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#e8b923]">{cvCopy.selectedLabel || ''}</p>
                <p className="text-sm leading-relaxed text-gray-300">{selectedWork || cvCopy.selectedFallback || ''}</p>
              </div>
              <div className="glass card-hover rounded-2xl p-5">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#e8b923]">{cvCopy.connectLabel || ''}</p>
                <div className="flex flex-wrap items-center gap-2 text-gray-400">
                  {profile?.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" aria-label={cvCopy.githubLabel || 'GitHub'} title={cvCopy.githubLabel || 'GitHub'} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]"><Github className="h-4 w-4" /></a>}
                  {profile?.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={cvCopy.linkedinLabel || 'LinkedIn'} title={cvCopy.linkedinLabel || 'LinkedIn'} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]"><Linkedin className="h-4 w-4" /></a>}
                  {profile?.mediumUrl && <a href={profile.mediumUrl} target="_blank" rel="noopener noreferrer" aria-label={cvCopy.mediumLabel || 'Medium'} title={cvCopy.mediumLabel || 'Medium'} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]"><BookOpen className="h-4 w-4" /></a>}
                  {EXTRA_PLATFORM_OPTIONS.map((platform) => {
                    const url = profile?.platformLinks?.[platform.key];
                    if (!url) return null;
                    return (
                      <a
                        key={platform.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={platform.label}
                        title={platform.label}
                        className={platform.key === 'kaggle' ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]' : 'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border border-white/10 px-2 font-mono text-[9px] font-semibold tracking-tight transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]'}
                      >
                        {platform.key === 'kaggle' ? <KaggleMark /> : <><Link2 className="h-3 w-3" /><span>{platform.mark}</span></>}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05060f]/90 p-3 backdrop-blur-md sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-preview-title"
            className="flex h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#e8b923]/30 bg-[#11131f] shadow-[0_24px_100px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#e8b923]">{cvCopy.previewKicker || ''}</p>
                <h2 id="cv-preview-title" className="mt-1 text-lg font-medium text-white">{`${profile?.name || cvCopy.profileFallback || ''} · ${cvCopy.title || ''}`}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                aria-label={cvCopy.closeLabel || ''}
                className="rounded-full border border-white/10 p-2 text-gray-400 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-white">
              {cvUrl ? (
                <>
                  <iframe src={`${cvUrl}${cvUrl.includes('?') ? '&' : '?'}preview=1`} title={`${profile?.name || cvCopy.profileFallback || ''} ${cvCopy.previewTitleSuffix || ''}`} className="hidden h-full w-full sm:block" />
                  <div className="h-full sm:hidden"><MobilePdfPreview url={`${cvUrl}${cvUrl.includes('?') ? '&' : '?'}preview=1`} title={`${profile?.name || cvCopy.profileFallback || ''} ${cvCopy.previewTitleSuffix || ''}`} /></div>
                </>
              ) : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">{cvCopy.noPreview || ''}</div>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 sm:px-6">
              <p className="text-xs text-gray-500">{cvCopy.reviewNote || ''}</p>
              {cvUrl && (
                <a
                  href={downloadHref}
                  download={cvCopy.downloadFileName || ''}
                  onClick={() => recordCvEvent('download')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e8b923]/40 bg-[#e8b923]/10 px-4 py-2 text-xs font-semibold text-[#e8b923] transition-colors hover:bg-[#e8b923] hover:text-[#05060f]"
                >
                  <Download className="h-3.5 w-3.5" />
                  {cvCopy.downloadLabel || ''}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
