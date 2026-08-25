import { useState } from 'react';
import { History, RotateCcw, ShieldCheck } from 'lucide-react';
import { trpc } from '@/providers/trpc';

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function ChangeLogTab() {
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const history = trpc.changeLogAdmin.list.useQuery({ limit: 100 });
  const restore = trpc.changeLogAdmin.restore.useMutation({
    onSuccess: async () => {
      setSelectedId(null);
      await Promise.all([
        utils.changeLogAdmin.list.invalidate(),
        utils.settings.getAll.invalidate(),
      ]);
    },
  });

  const entries = history.data || [];
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#e8b923]">Admin history</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Change Log</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
          Every saved Site Settings update is stored as a database snapshot. Restore an earlier version with one click; restoring also creates a new history entry.
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-[#e8b923]/20 bg-[#e8b923]/5 p-4 text-sm text-gray-300">
        <ShieldCheck className="h-5 w-5 flex-none text-[#e8b923]" />
        <span>Private admin-only history. AI provider credentials and API keys are never included in snapshots.</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e1a]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-white"><History className="h-4 w-4 text-[#e8b923]" /> Saved changes</div>
          <span className="text-xs text-gray-500">{entries.length} entries</span>
        </div>
        {history.isLoading ? <div className="p-6 text-sm text-gray-500">Loading history…</div> : entries.length === 0 ? <div className="p-6 text-sm text-gray-500">No changes have been recorded yet.</div> : (
          <div className="divide-y divide-white/5">
            {entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{entry.summary}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(entry.createdAt)} · {entry.action}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (entry.entityType !== 'siteSettings') return;
                    if (window.confirm('Restore Site Settings to this saved version? Your current settings will also be saved as a new history entry.')) setSelectedId(entry.id);
                  }}
                  disabled={entry.entityType !== 'siteSettings' || restore.isPending}
                  className="inline-flex flex-none items-center justify-center gap-2 rounded-lg border border-[#e8b923]/30 px-3 py-2 text-xs text-[#e8b923] transition hover:bg-[#e8b923]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedId !== null && (
        <div className="flex items-center justify-between rounded-xl border border-[#e8b923]/30 bg-[#e8b923]/10 px-4 py-3 text-sm text-gray-200">
          <span>Ready to restore change #{selectedId}.</span>
          <button type="button" onClick={() => restore.mutate({ id: selectedId })} disabled={restore.isPending} className="rounded-lg bg-[#e8b923] px-3 py-2 text-xs font-medium text-[#05060f] disabled:opacity-60">
            {restore.isPending ? 'Restoring…' : 'Confirm restore'}
          </button>
        </div>
      )}
      {restore.error && <p className="text-sm text-red-300">{restore.error.message}</p>}
    </section>
  );
}
