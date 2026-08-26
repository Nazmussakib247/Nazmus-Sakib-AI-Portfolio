import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowUpRight, ExternalLink, GitBranch, Layers3, ShieldCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : []; } catch { return []; }
}

type ArchitectureNode = { id: string; label: string; detail?: string; orderIndex: number };
type Decision = { title: string; decision: string; tradeoff: string; orderIndex: number };
type Metric = { label: string; value: string; unit?: string; context: string; sourceNote?: string; isVerified: boolean; orderIndex: number };
type MediaItem = { url: string; altText: string; caption: string; kind: string; orderIndex: number };
type CaseStudyLink = { label: string; url: string; kind?: string; orderIndex: number };

function sortByOrder<T extends { orderIndex: number }>(value: unknown) {
  return parseArray<T>(value).sort((a, b) => a.orderIndex - b.orderIndex);
}

export default function CaseStudy() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = trpc.project.getCaseStudyBySlug.useQuery({ slug });
  const returnToProjects = () => navigate("/", { state: { returnTo: "projects" } });

  if (isLoading) return <main className="min-h-screen bg-[#05060f] px-6 py-32 text-center text-gray-400">Loading case study…</main>;
  if (isError || !project) return <main className="min-h-screen bg-[#05060f] px-6 py-32 text-center text-gray-400"><p className="mb-6">This case study is unavailable.</p><button type="button" onClick={returnToProjects} className="text-[#e8b923]">Return to projects</button></main>;

  const architecture = sortByOrder<ArchitectureNode>(project.caseStudyArchitecture);
  const decisions = sortByOrder<Decision>(project.caseStudyDecisions);
  const metrics = sortByOrder<Metric>(project.caseStudyMetrics).filter((metric) => metric.isVerified);
  const media = sortByOrder<MediaItem>(project.caseStudyMedia);
  const links = sortByOrder<CaseStudyLink>(project.caseStudyLinks);
  const caseStudyStack = parseArray<string>(project.caseStudyStack);
  const stack = caseStudyStack.length ? caseStudyStack : parseArray<string>(project.techStack);

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-16">
        <button type="button" onClick={returnToProjects} className="mb-12 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#e8b923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923] focus-visible:ring-offset-4 focus-visible:ring-offset-[#05060f]"><ArrowLeft className="h-4 w-4" /> Back to projects</button>
        <header className="max-w-4xl border-b border-white/10 pb-12">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-[#e8b923]">Flagship case study · {project.caseStudyEnabled ? "Published" : "Draft"}</p>
          <h1 className="mb-6 text-4xl font-semibold tracking-tight sm:text-6xl">{project.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-300">{project.caseStudySummary || project.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {links.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#e8b923] px-4 py-2 text-sm font-medium text-[#05060f] hover:bg-[#f5cd45]">{link.label}<ArrowUpRight className="h-4 w-4" /></a>)}
          </div>
        </header>

        <div className="grid gap-12 py-14 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-12">
            <section><h2 className="mb-4 text-2xl font-medium">What problem this solves</h2><p className="leading-8 text-gray-400">{project.problemStatement || "This section will be added when verified project context is available."}</p></section>
            <section><h2 className="mb-4 text-2xl font-medium">My contribution</h2><p className="leading-8 text-gray-400">{project.roleDescription || "Contribution details will be added when verified."}</p></section>
            <section><h2 className="mb-4 text-2xl font-medium">Architecture</h2><p className={architecture.length ? "mb-6 text-gray-400" : "text-gray-400"}>{project.architectureSummary}</p>{architecture.length > 0 && <div className="grid gap-3 sm:grid-cols-5">{architecture.map((node, index) => <div key={node.id} className="relative rounded-2xl border border-[#e8b923]/20 bg-white/[0.03] p-4">{index < architecture.length - 1 && <span className="absolute -right-3 top-1/2 hidden text-[#e8b923] sm:block">→</span>}<p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#e8b923]">0{index + 1}</p><h3 className="text-sm font-medium text-white">{node.label}</h3>{node.detail && <p className="mt-2 text-xs leading-relaxed text-gray-500">{node.detail}</p>}</div>)}</div>}</section>
            {decisions.length > 0 && <section><h2 className="mb-6 text-2xl font-medium">Technical decisions and trade-offs</h2><div className="space-y-4">{decisions.map((item) => <article key={`${item.title}-${item.orderIndex}`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="mb-2 font-medium text-white">{item.title}</h3><p className="text-sm leading-7 text-gray-300">{item.decision}</p><p className="mt-3 text-sm leading-7 text-gray-500"><span className="text-[#e8b923]">Trade-off:</span> {item.tradeoff}</p></article>)}</div></section>}
            <section><h2 className="mb-4 text-2xl font-medium">Outcome and lessons</h2><p className="leading-8 text-gray-400">{project.outcomeSummary}</p><p className="mt-4 leading-8 text-gray-400">{project.lessonsLearned}</p></section>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"><div className="mb-5 flex items-center gap-3"><Layers3 className="h-5 w-5 text-[#e8b923]" /><h2 className="font-medium">Project stack</h2></div><div className="flex flex-wrap gap-2">{stack.map((item) => <span key={item} className="rounded-full border border-[#e8b923]/20 bg-[#e8b923]/5 px-3 py-1 font-mono text-xs text-[#e8b923]">{item}</span>)}</div></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"><div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#e8b923]" /><h2 className="font-medium">Measured result</h2></div>{metrics.length ? metrics.map((metric) => <div key={`${metric.label}-${metric.orderIndex}`} className="border-b border-white/10 py-3 last:border-0"><p className="text-xs text-gray-500">{metric.label}</p><p className="mt-1 text-lg text-white">{metric.value}{metric.unit}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">{metric.context}</p>{metric.sourceNote && <a href={metric.sourceNote} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#e8b923]">Evidence <ExternalLink className="h-3 w-3" /></a>}</div>) : <p className="text-sm leading-7 text-gray-500">Evidence will be added when verified. No unverified metrics are displayed.</p>}</div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"><div className="mb-5 flex items-center gap-3"><GitBranch className="h-5 w-5 text-[#e8b923]" /><h2 className="font-medium">Links</h2></div><div className="space-y-3">{links.length ? links.map((link) => <a key={`${link.label}-${link.url}-side`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-gray-300 hover:text-[#e8b923]">{link.label}<ArrowUpRight className="h-4 w-4" /></a>) : <p className="text-sm text-gray-500">No public links added yet.</p>}</div></div>
          </aside>
        </div>

        {media.length > 0 && <section className="border-t border-white/10 py-14"><h2 className="mb-7 text-2xl font-medium">Screenshots and workflow evidence</h2><div className="grid gap-6 md:grid-cols-2">{media.map((item) => <figure key={`${item.url}-${item.orderIndex}`} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"><img src={item.url} alt={item.altText} className="aspect-video w-full object-cover" loading="lazy" /><figcaption className="p-4 text-sm leading-relaxed text-gray-400"><span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#e8b923]">{item.kind}</span>{item.caption}</figcaption></figure>)}</div></section>}
        <footer className="border-t border-white/10 pt-8 text-sm text-gray-500">Evidence-led documentation for {project.title}. Claims and metrics are shown only when supported by stored project records.</footer>
      </div>
    </main>
  );
}
