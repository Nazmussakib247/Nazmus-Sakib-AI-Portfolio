import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, GripVertical, Plus, RefreshCw } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { Field, Modal, RowActions, EmptyState, inputCls, btnPrimary, btnGhost, cardCls, stripEmpty } from '../adminUi';
import { ImageUploadField, MultiImageUploadField } from '../ImageUpload';

/* ============ Generic helpers ============ */

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function normalizeJsonArrayText(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value, null, 2);
  if (typeof value !== 'string' || !value.trim()) return '[]';
  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return Array.isArray(parsed) ? JSON.stringify(parsed, null, 2) : '[]';
  } catch {
    return '[]';
  }
}

type CaseStudyTextState = {
  architecture: string;
  decisions: string;
  metrics: string;
  media: string;
  links: string;
};

const emptyCaseStudyText: CaseStudyTextState = { architecture: '', decisions: '', metrics: '', media: '', links: '' };

type CaseStudyCollection = keyof CaseStudyTextState;

function parseStoredArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toSimpleText(value: unknown, collection: CaseStudyCollection): string {
  return parseStoredArray(value).map((item) => {
    const row = item as Record<string, unknown>;
    if (collection === 'architecture') return [row.label, row.detail].filter(Boolean).join(' | ');
    if (collection === 'decisions') return [row.title, row.decision, row.tradeoff].filter(Boolean).join(' | ');
    if (collection === 'metrics') return [row.label, row.value, row.context, row.sourceNote, row.isVerified ? 'verified' : 'unverified'].filter(Boolean).join(' | ');
    if (collection === 'media') return [row.url, row.caption, row.altText, row.kind].filter(Boolean).join(' | ');
    return [row.label, row.url, row.kind].filter(Boolean).join(' | ');
  }).join('\n');
}

function fromSimpleText(value: string, collection: CaseStudyCollection): unknown[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line, orderIndex) => {
    const parts = line.split('|').map((part) => part.trim());
    if (collection === 'architecture') return { id: (parts[0] || `node-${orderIndex + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: parts[0] || `Step ${orderIndex + 1}`, detail: parts[1] || undefined, orderIndex };
    if (collection === 'decisions') return { title: parts[0] || `Decision ${orderIndex + 1}`, decision: parts[1] || '', tradeoff: parts[2] || '', orderIndex };
    if (collection === 'metrics') return { label: parts[0] || `Evidence ${orderIndex + 1}`, value: parts[1] || '', context: parts[2] || '', sourceNote: parts[3] || undefined, isVerified: /^(verified|true|yes)$/i.test(parts[4] || ''), orderIndex };
    if (collection === 'media') return { url: parts[0] || '', caption: parts[1] || parts[0] || '', altText: parts[2] || parts[1] || parts[0] || '', kind: (['overview', 'workflow', 'analysis', 'architecture'].includes(parts[3]) ? parts[3] : 'workflow'), orderIndex };
    return { label: parts[0] || `Link ${orderIndex + 1}`, url: parts[1] || '', kind: parts[2] || undefined, orderIndex };
  });
}

function useSwapOrder(
  updateFn: (args: { id: number; orderIndex: number }) => Promise<unknown>,
  refetch: () => void
) {
  return async (list: { id: number; orderIndex: number | null }[], index: number, dir: -1 | 1) => {
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    const aOrder = a.orderIndex ?? index;
    const bOrder = b.orderIndex ?? index + dir;
    // If order indexes collide, normalize by position
    const newA = aOrder === bOrder ? index + dir : bOrder;
    const newB = aOrder === bOrder ? index : aOrder;
    await Promise.all([
      updateFn({ id: a.id, orderIndex: newA }),
      updateFn({ id: b.id, orderIndex: newB }),
    ]);
    refetch();
  };
}

function TabHeader({ title, onAdd, addLabel, extraAction }: { title: string; onAdd: () => void; addLabel: string; extraAction?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <h2 className="text-xl text-white">{title}</h2>
      <div className="flex items-center gap-2">
        {extraAction}
        <button onClick={onAdd} className={btnPrimary}>
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      </div>
    </div>
  );
}

/* ============ Projects ============ */

export function ProjectsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: projects, refetch } = trpc.projectAdmin.list.useQuery();
  const del = trpc.projectAdmin.delete.useMutation({ onSuccess: () => { refetch(); toast.success('Project deleted'); } });
  const create = trpc.projectAdmin.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Project created'); } });
  const update = trpc.projectAdmin.update.useMutation({ onSuccess: () => { refetch(); toast.success('Project updated'); } });
  const reorder = trpc.projectAdmin.reorder.useMutation({ onSuccess: () => { refetch(); toast.success('Project order saved'); }, onError: () => { refetch(); toast.error('Project order could not be saved'); } });
  const swap = useSwapOrder((args) => update.mutateAsync(args), refetch);

  const empty = { title: '', description: '', techStack: '', thumbnailUrl: '', githubUrl: '', liveUrl: '', videoUrl: '', screenshots: [] as string[], isFeatured: true, slug: '', caseStudyEnabled: false, caseStudySummary: '', problemStatement: '', roleDescription: '', architectureSummary: '', outcomeSummary: '', lessonsLearned: '', caseStudyOrder: 0, caseStudyArchitecture: '[]', caseStudyDecisions: '[]', caseStudyMetrics: '[]', caseStudyMedia: '[]', caseStudyLinks: '[]', caseStudyStack: '' };
  const [form, setForm] = useState(empty);
  const [simpleText, setSimpleText] = useState<CaseStudyTextState>(emptyCaseStudyText);
  const [simpleTextMode, setSimpleTextMode] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const sorted = [...(projects || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const openCreate = () => { setForm(empty); setSimpleText(emptyCaseStudyText); setSimpleTextMode(true); setEditingId(null); setShowForm(true); };
  const handleDrop = (targetId: number) => {
    if (draggingId === null || draggingId === targetId || reorder.isPending) return;
    const next = [...sorted];
    const fromIndex = next.findIndex((project) => project.id === draggingId);
    const targetIndex = next.findIndex((project) => project.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    reorder.mutate({ items: next.map((project, index) => ({ id: project.id, orderIndex: index })) });
    setDraggingId(null);
    setDragOverId(null);
  };
  const openEdit = (p: (typeof sorted)[number]) => {
    setForm({
      title: p.title,
      description: p.description,
      techStack: normalizeStringArray(p.techStack).join(', '),
      thumbnailUrl: p.thumbnailUrl || '',
      githubUrl: p.githubUrl || '',
      liveUrl: p.liveUrl || '',
      videoUrl: p.videoUrl || '',
      screenshots: normalizeStringArray(p.screenshots),
      isFeatured: p.isFeatured ?? true,
      slug: p.slug || '',
      caseStudyEnabled: p.caseStudyEnabled ?? false,
      caseStudySummary: p.caseStudySummary || '',
      problemStatement: p.problemStatement || '',
      roleDescription: p.roleDescription || '',
      architectureSummary: p.architectureSummary || '',
      outcomeSummary: p.outcomeSummary || '',
      lessonsLearned: p.lessonsLearned || '',
      caseStudyOrder: p.caseStudyOrder ?? 0,
      caseStudyArchitecture: normalizeJsonArrayText(p.caseStudyArchitecture),
      caseStudyDecisions: normalizeJsonArrayText(p.caseStudyDecisions),
      caseStudyMetrics: normalizeJsonArrayText(p.caseStudyMetrics),
      caseStudyMedia: normalizeJsonArrayText(p.caseStudyMedia),
      caseStudyLinks: normalizeJsonArrayText(p.caseStudyLinks),
      caseStudyStack: normalizeStringArray(p.caseStudyStack).join(', '),
    });
    setSimpleText({
      architecture: toSimpleText(p.caseStudyArchitecture, 'architecture'),
      decisions: toSimpleText(p.caseStudyDecisions, 'decisions'),
      metrics: toSimpleText(p.caseStudyMetrics, 'metrics'),
      media: toSimpleText(p.caseStudyMedia, 'media'),
      links: toSimpleText(p.caseStudyLinks, 'links'),
    });
    setSimpleTextMode(true);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parseJson = (value: string, label: string) => {
      try {
        let parsed: unknown = JSON.parse(value || '[]');
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        if (!Array.isArray(parsed)) throw new Error(`${label} must be an array`);
        return parsed;
      } catch (error) {
        throw new Error(`${label} must be valid JSON array: ${error instanceof Error ? error.message : 'invalid JSON'}`);
      }
    };
    let structured;
    try {
      structured = simpleTextMode
        ? {
            caseStudyArchitecture: fromSimpleText(simpleText.architecture, 'architecture'),
            caseStudyDecisions: fromSimpleText(simpleText.decisions, 'decisions'),
            caseStudyMetrics: fromSimpleText(simpleText.metrics, 'metrics'),
            caseStudyMedia: fromSimpleText(simpleText.media, 'media'),
            caseStudyLinks: fromSimpleText(simpleText.links, 'links'),
          }
        : {
            caseStudyArchitecture: parseJson(form.caseStudyArchitecture, 'Architecture'),
            caseStudyDecisions: parseJson(form.caseStudyDecisions, 'Decisions'),
            caseStudyMetrics: parseJson(form.caseStudyMetrics, 'Metrics'),
            caseStudyMedia: parseJson(form.caseStudyMedia, 'Media'),
            caseStudyLinks: parseJson(form.caseStudyLinks, 'Links'),
          };
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Invalid case-study JSON'); return; }
    const data = {
      title: form.title,
      description: form.description,
      techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      githubUrl: form.githubUrl.trim() || null,
      liveUrl: form.liveUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      screenshots: form.screenshots,
      isFeatured: form.isFeatured,
      slug: form.slug || undefined,
      caseStudyEnabled: form.caseStudyEnabled,
      caseStudySummary: form.caseStudySummary || undefined,
      problemStatement: form.problemStatement || undefined,
      roleDescription: form.roleDescription || undefined,
      architectureSummary: form.architectureSummary || undefined,
      outcomeSummary: form.outcomeSummary || undefined,
      lessonsLearned: form.lessonsLearned || undefined,
      caseStudyOrder: Number(form.caseStudyOrder) || 0,
      caseStudyStack: form.caseStudyStack.split(',').map((s) => s.trim()).filter(Boolean),
      ...structured,
    };
    if (editingId) {
      update.mutate({ id: editingId, ...data });
      setShowForm(false);
    } else {
      create.mutate({ ...data, orderIndex: sorted.length });
    }
  };

  return (
    <div className="pt-12 lg:pt-0">
                <TabHeader
            title="Projects"
            onAdd={openCreate}
            addLabel="Add Project"
            extraAction={<span className="hidden text-xs text-gray-500 lg:inline">Drag the handle to reorder</span>}
          />

      {sorted.length === 0 ? (
        <EmptyState text="No projects yet. Add your first project." />
      ) : (
        <div className="space-y-3">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              onDragOver={(event) => { event.preventDefault(); setDragOverId(p.id); }}
              onDrop={(event) => { event.preventDefault(); handleDrop(p.id); }}
              className={`${cardCls} flex items-center justify-between gap-3 transition-colors ${dragOverId === p.id && draggingId !== p.id ? 'border-[#e8b923]/70 bg-[#e8b923]/[0.06]' : ''} ${draggingId === p.id ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                draggable
                onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; setDraggingId(p.id); }}
                onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                className="shrink-0 cursor-grab touch-none rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-[#e8b923] active:cursor-grabbing"
                aria-label={`Drag to reorder ${p.title}`}
                title="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </button>
              <div className="mr-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-sm text-white">{p.title}</h4>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${p.isFeatured !== false ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/10 text-gray-500'}`}>
                    {p.isFeatured !== false ? <><Eye className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Unpublished</>}
                  </span>
                </div>
                <p className="truncate text-xs text-gray-500">{p.description?.slice(0, 90)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {normalizeStringArray(p.techStack).slice(0, 5).map((t) => (
                    <span key={t} className="rounded bg-[#e8b923]/10 px-1.5 py-0.5 text-[10px] text-[#e8b923]">{t}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => update.mutate({ id: p.id, isFeatured: p.isFeatured === false })}
                disabled={update.isPending}
                className={`hidden shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors sm:inline-flex ${p.isFeatured !== false ? 'border-emerald-400/25 text-emerald-300 hover:border-rose-300/40 hover:text-rose-200' : 'border-white/15 text-gray-400 hover:border-emerald-300/40 hover:text-emerald-200'}`}
              >
                {p.isFeatured !== false ? 'Unpublish' : 'Publish'}
              </button>
              <RowActions
                onEdit={() => openEdit(p)}
                onDelete={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate({ id: p.id }); }}
                onUp={() => swap(sorted, i, -1)}
                onDown={() => swap(sorted, i, 1)}
                canUp={i > 0}
                canDown={i < sorted.length - 1}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Project' : 'Add Project'} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required /></Field>
            <Field label="Description *"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} h-24`} required /></Field>
            <Field label="Tech Stack (comma separated)"><input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} className={inputCls} placeholder="React, Node.js, Python" /></Field>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="GitHub URL"><input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className={inputCls} /></Field>
              <Field label="Live URL"><input value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} className={inputCls} /></Field>
              <Field label="Video URL (optional)"><input type="url" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputCls} placeholder="YouTube, Vimeo, or direct video URL" /></Field>
            </div>
            <ImageUploadField label="Thumbnail image" value={form.thumbnailUrl} onChange={(url) => setForm({ ...form, thumbnailUrl: url })} />
            <MultiImageUploadField label="Screenshots" values={form.screenshots} onChange={(urls) => setForm({ ...form, screenshots: urls })} />
            <div className="mt-8 border-t border-white/10 pt-5"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8b923]">Flagship Case Study · Optional Advanced Fields</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="hirelay-ai-recruitment-platform" /></Field><Field label="Case-study order"><input type="number" min="0" value={form.caseStudyOrder} onChange={(e) => setForm({ ...form, caseStudyOrder: Number(e.target.value) })} className={inputCls} /></Field></div>
              <label className="mt-3 flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={form.caseStudyEnabled} onChange={(e) => setForm({ ...form, caseStudyEnabled: e.target.checked })} className="rounded" /> Publish case study</label>
              <Field label="Summary"><textarea value={form.caseStudySummary} onChange={(e) => setForm({ ...form, caseStudySummary: e.target.value })} className={`${inputCls} h-20`} /></Field><Field label="What problem this solves"><textarea value={form.problemStatement} onChange={(e) => setForm({ ...form, problemStatement: e.target.value })} className={`${inputCls} h-20`} /></Field><Field label="My contribution"><textarea value={form.roleDescription} onChange={(e) => setForm({ ...form, roleDescription: e.target.value })} className={`${inputCls} h-20`} /></Field><Field label="Architecture summary"><textarea value={form.architectureSummary} onChange={(e) => setForm({ ...form, architectureSummary: e.target.value })} className={`${inputCls} h-20`} /></Field><Field label="Outcome"><textarea value={form.outcomeSummary} onChange={(e) => setForm({ ...form, outcomeSummary: e.target.value })} className={`${inputCls} h-20`} /></Field><Field label="Lessons learned"><textarea value={form.lessonsLearned} onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })} className={`${inputCls} h-20`} /></Field><Field label="Case-study stack (comma separated)"><input value={form.caseStudyStack} onChange={(e) => setForm({ ...form, caseStudyStack: e.target.value })} className={inputCls} /></Field>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 p-3">
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e8b923]">Case-study content input</p><p className="mt-1 text-xs text-gray-500">Write readable text by default. The portfolio presentation stays unchanged.</p></div>
                <div className="flex rounded-lg border border-white/10 p-1">
                  <button type="button" onClick={() => setSimpleTextMode(true)} className={`rounded-md px-3 py-1.5 text-xs ${simpleTextMode ? 'bg-[#e8b923] text-[#05060f]' : 'text-gray-400 hover:text-white'}`}>Simple Text</button>
                  <button type="button" onClick={() => setSimpleTextMode(false)} className={`rounded-md px-3 py-1.5 text-xs ${!simpleTextMode ? 'bg-[#e8b923] text-[#05060f]' : 'text-gray-400 hover:text-white'}`}>Advanced JSON</button>
                </div>
              </div>
              {simpleTextMode ? (
                <>
                  <p className="text-xs leading-6 text-gray-500">One item per line. Separate parts with <code>|</code>. Architecture: label | detail. Decisions: title | decision | trade-off. Metrics: label | value | context | source note | verified. Links: label | URL | kind. Media: URL | caption | alt text | kind.</p>
                  <Field label="Architecture"><textarea value={simpleText.architecture} onChange={(e) => setSimpleText({ ...simpleText, architecture: e.target.value })} className={`${inputCls} h-28`} placeholder="CVs + job posts | Recruitment inputs" /></Field>
                  <Field label="Technical decisions"><textarea value={simpleText.decisions} onChange={(e) => setSimpleText({ ...simpleText, decisions: e.target.value })} className={`${inputCls} h-28`} placeholder="Workflow-first AI | Connect matching to review | More product surface" /></Field>
                  <Field label="Evidence metrics"><textarea value={simpleText.metrics} onChange={(e) => setSimpleText({ ...simpleText, metrics: e.target.value })} className={`${inputCls} h-24`} placeholder="Candidate matching | 92% | Verified project result | Source note | verified" /></Field>
                  <Field label="Case-study media"><textarea value={simpleText.media} onChange={(e) => setSimpleText({ ...simpleText, media: e.target.value })} className={`${inputCls} h-24`} placeholder="/images/project.png | Candidate workflow | Workflow screenshot | workflow" /></Field>
                  <Field label="Case-study links"><textarea value={simpleText.links} onChange={(e) => setSimpleText({ ...simpleText, links: e.target.value })} className={`${inputCls} h-24`} placeholder="Repository | https://github.com/example | repository" /></Field>
                </>
              ) : (
                <>
                  <p className="text-xs leading-6 text-gray-500">Advanced mode stores the same structured data directly. Metrics are public only when <code>isVerified</code> is true. Media URLs should use the existing uploader.</p>
                  <Field label="Architecture JSON"><textarea value={form.caseStudyArchitecture} onChange={(e) => setForm({ ...form, caseStudyArchitecture: e.target.value })} className={`${inputCls} h-28 font-mono text-xs`} /></Field>
                  <Field label="Technical decisions JSON"><textarea value={form.caseStudyDecisions} onChange={(e) => setForm({ ...form, caseStudyDecisions: e.target.value })} className={`${inputCls} h-28 font-mono text-xs`} /></Field>
                  <Field label="Evidence metrics JSON"><textarea value={form.caseStudyMetrics} onChange={(e) => setForm({ ...form, caseStudyMetrics: e.target.value })} className={`${inputCls} h-28 font-mono text-xs`} /></Field>
                  <Field label="Case-study media JSON"><textarea value={form.caseStudyMedia} onChange={(e) => setForm({ ...form, caseStudyMedia: e.target.value })} className={`${inputCls} h-28 font-mono text-xs`} /></Field>
                  <Field label="Case-study links JSON"><textarea value={form.caseStudyLinks} onChange={(e) => setForm({ ...form, caseStudyLinks: e.target.value })} className={`${inputCls} h-28 font-mono text-xs`} /></Field>
                </>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
              Published on public portfolio
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============ Skills ============ */

export function SkillsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: skills, refetch } = trpc.skill.list.useQuery();
  const del = trpc.skillAdmin.delete.useMutation({ onSuccess: () => { refetch(); toast.success('Skill deleted'); } });
  const create = trpc.skillAdmin.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Skill added'); } });
  const update = trpc.skillAdmin.update.useMutation({ onSuccess: () => { refetch(); toast.success('Skill updated'); } });
  const swap = useSwapOrder((args) => update.mutateAsync(args), refetch);

  const empty = { category: '', name: '', iconName: 'code', iconUrl: '', level: 80 };
  const [form, setForm] = useState(empty);

  const sorted = [...(skills || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const categories = Array.from(new Set(sorted.map((s) => s.category)));

  const openCreate = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (s: (typeof sorted)[number]) => {
    setForm({ category: s.category, name: s.name, iconName: s.iconName || 'code', iconUrl: s.iconUrl || '', level: s.level ?? 80 });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, level: Number(form.level) };
    if (editingId) {
      update.mutate({ id: editingId, ...data });
      setShowForm(false);
    } else {
      create.mutate({ ...data, orderIndex: sorted.length });
    }
  };

  return (
    <div className="pt-12 lg:pt-0">
      <TabHeader title="Skills" onAdd={openCreate} addLabel="Add Skill" />
      <p className="mb-6 -mt-4 text-xs text-gray-500">
        Skills are grouped by category on the site. Icon options: brain, code, code2, server, workflow, wrench, cpu, database, cloud, terminal, palette, globe, shield, zap.
      </p>
      {sorted.length === 0 ? (
        <EmptyState text="No skills yet. Add skills to replace the built-in defaults on your site." />
      ) : (
        <div className="space-y-3">
          {sorted.map((s, i) => (
            <div key={s.id} className={`${cardCls} flex items-center justify-between`}>
              <div className="mr-4 flex min-w-0 flex-1 items-center gap-3">
                <span className="rounded bg-[#7c5cff]/15 px-2 py-1 font-mono text-[10px] text-[#a78bfa]">{s.category}</span>
                <span className="truncate text-sm text-white">{s.name}</span>
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/5 sm:block">
                  <div className="h-full rounded-full bg-[#e8b923]" style={{ width: `${s.level ?? 80}%` }} />
                </div>
                <span className="font-mono text-xs text-gray-500">{s.level ?? 80}%</span>
              </div>
              <RowActions
                onEdit={() => openEdit(s)}
                onDelete={() => { if (confirm(`Delete "${s.name}"?`)) del.mutate({ id: s.id }); }}
                onUp={() => swap(sorted, i, -1)}
                onDown={() => swap(sorted, i, 1)}
                canUp={i > 0}
                canDown={i < sorted.length - 1}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Skill' : 'Add Skill'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Category *">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} list="skill-categories" placeholder="Machine Learning" required />
              <datalist id="skill-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Skill name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Python / TensorFlow" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category icon"><input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} className={inputCls} placeholder="brain" /></Field>
              <Field label="Skill logo URL"><input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} className={inputCls} placeholder="/api/files/123 or https://..." /></Field>
              <Field label={`Proficiency: ${form.level}%`}>
                <input type="range" min={0} max={100} step={5} value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} className="w-full accent-[#e8b923]" />
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============ Experience ============ */

export function ExperiencesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: experiences, refetch } = trpc.experience.list.useQuery();
  const del = trpc.experienceAdmin.delete.useMutation({ onSuccess: () => { refetch(); toast.success('Experience deleted'); } });
  const create = trpc.experienceAdmin.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Experience created'); } });
  const update = trpc.experienceAdmin.update.useMutation({ onSuccess: () => { refetch(); toast.success('Experience updated'); } });
  const swap = useSwapOrder((args) => update.mutateAsync(args), refetch);

  const empty = { type: 'work' as 'work' | 'education' | 'internship', title: '', organization: '', location: '', startDate: '', endDate: '', description: '' };
  const [form, setForm] = useState(empty);

  const sorted = [...(experiences || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const openCreate = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (x: (typeof sorted)[number]) => {
    setForm({ type: x.type, title: x.title, organization: x.organization, location: x.location || '', startDate: x.startDate || '', endDate: x.endDate || '', description: x.description || '' });
    setEditingId(x.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      update.mutate({ id: editingId, ...form });
      setShowForm(false);
    } else {
      create.mutate({ ...form, orderIndex: sorted.length });
    }
  };

  const typeColors: Record<string, string> = {
    education: 'bg-blue-500/20 text-blue-400',
    work: 'bg-green-500/20 text-green-400',
    internship: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="pt-12 lg:pt-0">
      <TabHeader title="Experience" onAdd={openCreate} addLabel="Add Experience" />
      {sorted.length === 0 ? (
        <EmptyState text="No experiences yet." />
      ) : (
        <div className="space-y-3">
          {sorted.map((x, i) => (
            <div key={x.id} className={`${cardCls} flex items-center justify-between`}>
              <div className="mr-4 min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="truncate text-sm text-white">{x.title}</h4>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${typeColors[x.type] || 'bg-gray-500/20 text-gray-400'}`}>{x.type}</span>
                </div>
                <p className="truncate text-xs text-gray-500">{x.organization} · {x.startDate} — {x.endDate || 'Present'}</p>
              </div>
              <RowActions
                onEdit={() => openEdit(x)}
                onDelete={() => { if (confirm(`Delete "${x.title}"?`)) del.mutate({ id: x.id }); }}
                onUp={() => swap(sorted, i, -1)}
                onDown={() => swap(sorted, i, 1)}
                canUp={i > 0}
                canDown={i < sorted.length - 1}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Experience' : 'Add Experience'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className={inputCls}>
                <option value="work">Work</option>
                <option value="education">Education</option>
                <option value="internship">Internship</option>
              </select>
            </Field>
            <Field label="Title *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required /></Field>
            <Field label="Organization *"><input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className={inputCls} required /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} /></Field>
              <Field label="Start"><input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} placeholder="Jan 2024" /></Field>
              <Field label="End"><input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} placeholder="Present" /></Field>
            </div>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} h-20`} /></Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============ Certificates ============ */

export function CertificatesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: certs, refetch } = trpc.certificate.list.useQuery();
  const del = trpc.certificateAdmin.delete.useMutation({ onSuccess: () => { refetch(); toast.success('Certificate deleted'); } });
  const create = trpc.certificateAdmin.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Certificate created'); } });
  const update = trpc.certificateAdmin.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Certificate updated'); } });
  const reorder = trpc.certificateAdmin.reorder.useMutation({ onSuccess: () => { refetch(); } });

  const empty = { title: '', issuer: '', category: 'General', credentialUrl: '', thumbnailUrl: '', skillsGained: '', description: '', issueDate: '' };
  const [form, setForm] = useState(empty);
  const sorted = [...(certs || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const categories = Array.from(new Set(sorted.map((certificate) => certificate.category?.trim()).filter((category): category is string => Boolean(category))));
  const swap = useSwapOrder(reorder.mutateAsync, () => { void refetch(); });

  const openCreate = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (c: NonNullable<typeof certs>[number]) => {
    setForm({
      title: c.title,
      issuer: c.issuer,
      category: c.category || 'General',
      credentialUrl: c.credentialUrl || '',
      thumbnailUrl: c.thumbnailUrl || '',
      skillsGained: normalizeStringArray(c.skillsGained).join(', '),
      description: c.description || '',
      issueDate: c.issueDate ? new Date(c.issueDate).toISOString().split('T')[0] : '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = stripEmpty({
      title: form.title,
      issuer: form.issuer,
      category: form.category.trim() || 'General',
      credentialUrl: form.credentialUrl,
      thumbnailUrl: form.thumbnailUrl,
      description: form.description,
      issueDate: form.issueDate,
    });
    const payload = { ...data, skillsGained: form.skillsGained.split(',').map((s) => s.trim()).filter(Boolean) };
    if (editingId) update.mutate({ id: editingId, ...payload });
    else create.mutate({ ...payload, orderIndex: sorted.length } as Parameters<typeof create.mutate>[0]);
  };

  return (
    <div className="pt-12 lg:pt-0">
      <TabHeader title="Certificates" onAdd={openCreate} addLabel="Add Certificate" />
      {sorted.length === 0 ? (
        <EmptyState text="No certificates yet." />
      ) : (
        <div className="space-y-3">
          {sorted.map((c, i) => (
            <div key={c.id} className={`${cardCls} flex items-center justify-between`}>
              <div className="mr-4 min-w-0 flex-1">
                <h4 className="truncate text-sm text-white">{c.title}</h4>
                <p className="truncate text-xs text-gray-500">
                  {c.category || 'General'} · {c.issuer} {c.issueDate ? `· ${new Date(c.issueDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <RowActions
                onUp={() => swap(sorted, i, -1)}
                onDown={() => swap(sorted, i, 1)}
                canUp={i > 0}
                canDown={i < sorted.length - 1}
                onEdit={() => openEdit(c)}
                onDelete={() => { if (confirm(`Delete "${c.title}"?`)) del.mutate({ id: c.id }); }}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Certificate' : 'Add Certificate'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required /></Field>
            <Field label="Issuer *"><input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} className={inputCls} required /></Field>
            <Field label="Category (select existing or type a new one)">
              <input list="certificate-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="Artificial Intelligence" />
              <datalist id="certificate-categories">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Credential URL"><input value={form.credentialUrl} onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })} className={inputCls} /></Field>
              <Field label="Issue Date"><input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className={inputCls} /></Field>
            </div>
            <ImageUploadField label="Certificate image" value={form.thumbnailUrl} onChange={(url) => setForm({ ...form, thumbnailUrl: url })} />
            <Field label="Skills gained (comma separated)"><input value={form.skillsGained} onChange={(e) => setForm({ ...form, skillsGained: e.target.value })} className={inputCls} /></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} h-16`} /></Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============ Awards ============ */

export function AwardsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: awards, refetch } = trpc.award.list.useQuery();
  const del = trpc.awardAdmin.delete.useMutation({ onSuccess: () => { refetch(); toast.success('Award deleted'); } });
  const create = trpc.awardAdmin.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Award created'); } });
  const update = trpc.awardAdmin.update.useMutation({ onSuccess: () => { refetch(); toast.success('Award updated'); } });
  const swap = useSwapOrder((args) => update.mutateAsync(args), refetch);

  const empty = { title: '', description: '', eyebrow: '', image: '', imageAlt: '', sourceUrl: '', sourceLabel: '', iconName: 'award' };
  const [form, setForm] = useState(empty);

  const sorted = [...(awards || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const openCreate = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (a: (typeof sorted)[number]) => {
    setForm({ title: a.title, description: a.description || '', eyebrow: a.eyebrow || '', image: a.image || '', imageAlt: a.imageAlt || '', sourceUrl: a.sourceUrl || '', sourceLabel: a.sourceLabel || '', iconName: a.iconName || 'award' });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      update.mutate({ id: editingId, ...form });
      setShowForm(false);
    } else {
      create.mutate({ ...form, orderIndex: sorted.length });
    }
  };

  return (
    <div className="pt-12 lg:pt-0">
      <TabHeader title="Awards" onAdd={openCreate} addLabel="Add Award" />
      {sorted.length === 0 ? (
        <EmptyState text="No awards yet." />
      ) : (
        <div className="space-y-3">
          {sorted.map((a, i) => (
            <div key={a.id} className={`${cardCls} flex items-center justify-between`}>
              <div className="mr-4 min-w-0 flex-1">
                <h4 className="truncate text-sm text-white">{a.title}</h4>
                <p className="truncate text-xs text-gray-500">{a.description?.slice(0, 70)}</p>
              </div>
              <RowActions
                onEdit={() => openEdit(a)}
                onDelete={() => { if (confirm(`Delete "${a.title}"?`)) del.mutate({ id: a.id }); }}
                onUp={() => swap(sorted, i, -1)}
                onDown={() => swap(sorted, i, 1)}
                canUp={i > 0}
                canDown={i < sorted.length - 1}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Award' : 'Add Award'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required /></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} h-16`} /></Field>
            <Field label="Eyebrow / Result"><input value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} className={inputCls} placeholder="First Prize · 2025" /></Field>
            <Field label="Image URL"><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputCls} placeholder="/api/files/123 or /images/awards/example.jpg" /></Field>
            <Field label="Image Alt Text"><input value={form.imageAlt} onChange={(e) => setForm({ ...form, imageAlt: e.target.value })} className={inputCls} placeholder="Descriptive text for the award image" /></Field>
            <Field label="Source URL"><input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className={inputCls} placeholder="https://www.linkedin.com/posts/..." /></Field>
            <Field label="Source Link Label"><input value={form.sourceLabel} onChange={(e) => setForm({ ...form, sourceLabel: e.target.value })} className={inputCls} placeholder="View recognition post" /></Field>
            <Field label="Icon (trophy, award, star, medal)"><input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} className={inputCls} /></Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============ Writings ============ */

export function WritingsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: writings, refetch } = trpc.writing.listAll.useQuery();
  const syncMedium = trpc.writingAdmin.syncMedium.useMutation({ onSuccess: (result) => { refetch(); toast.success(`Medium synced: ${result.created} new, ${result.updated} updated${result.imageEnriched ? `, ${result.imageEnriched} images enriched` : ''}${result.deduplicated ? `, ${result.deduplicated} duplicates removed` : ''}`); }, onError: (error) => toast.error(`Medium sync failed: ${error.message}`) });
  const del = trpc.writingAdmin.delete.useMutation({ onSuccess: () => { refetch(); toast.success('Writing deleted'); } });
  const create = trpc.writingAdmin.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Writing created'); } });
  const update = trpc.writingAdmin.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success('Writing updated'); } });
  const reorder = trpc.writingAdmin.reorder.useMutation({ onSuccess: () => { refetch(); } });

  const empty = { title: '', excerpt: '', category: '', coverImageUrl: '', externalUrl: '', platform: 'medium' as 'medium' | 'pdf' | 'blogspot', isPublished: false, isFeatured: false };
  const [form, setForm] = useState(empty);
  const sorted = [...(writings || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const swap = useSwapOrder(reorder.mutateAsync, () => { void refetch(); });

  const openCreate = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (w: NonNullable<typeof writings>[number]) => {
    setForm({
      title: w.title,
      excerpt: w.excerpt || '',
      category: w.category || '',
      coverImageUrl: w.coverImageUrl || '',
      externalUrl: w.externalUrl || '',
      platform: w.platform || 'medium',
      isPublished: w.isPublished ?? true,
      isFeatured: w.isFeatured ?? false,
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) update.mutate({ id: editingId, ...form });
    else create.mutate({ ...form, orderIndex: sorted.length });
  };

  return (
    <div className="pt-12 lg:pt-0">
      <TabHeader
        title="Writings"
        onAdd={openCreate}
        addLabel="Add Writing"
        extraAction={<button type="button" onClick={() => syncMedium.mutate({})} disabled={syncMedium.isPending} className={btnGhost}><RefreshCw className={`h-4 w-4 ${syncMedium.isPending ? 'animate-spin' : ''}`} /> {syncMedium.isPending ? 'Syncing…' : 'Sync Medium'}</button>}
      />
      {sorted.length === 0 ? (
        <EmptyState text="No writings yet." />
      ) : (
        <div className="space-y-3">
          {sorted.map((w, i) => (
            <div key={w.id} className={`${cardCls} flex items-center justify-between`}>
              <div className="mr-4 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm text-white">{w.title}</h4>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${w.isPublished && w.coverImageUrl ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {w.isPublished && w.coverImageUrl ? (w.isFeatured ? 'Featured' : 'More') : w.coverImageUrl ? 'Hidden' : 'Needs image'}
                  </span>
                </div>
                <p className="truncate text-xs text-gray-500">{w.category || 'Uncategorized'} · {w.platform} · {w.coverImageUrl ? 'image ready' : 'not shown publicly'}</p>
              </div>
              <RowActions
                onUp={() => swap(sorted, i, -1)}
                onDown={() => swap(sorted, i, 1)}
                canUp={i > 0}
                canDown={i < sorted.length - 1}
                onEdit={() => openEdit(w)}
                onDelete={() => { if (confirm(`Delete "${w.title}"?`)) del.mutate({ id: w.id }); }}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Writing' : 'Add Writing'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required /></Field>
            <Field label="Excerpt"><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className={`${inputCls} h-16`} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="Machine Learning" /></Field>
              <Field label="Platform">
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as typeof form.platform })} className={inputCls}>
                  <option value="medium">Medium</option>
                  <option value="pdf">PDF</option>
                  <option value="blogspot">Blogspot</option>
                </select>
              </Field>
            </div>
            <Field label="External URL"><input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} className={inputCls} /></Field>
            <ImageUploadField label="Cover image" value={form.coverImageUrl} onChange={(url) => setForm({ ...form, coverImageUrl: url })} />
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded" />
              Approve for portfolio (requires a cover image)
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
              Feature directly on portfolio (otherwise appears under Read More)
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
