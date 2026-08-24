import type { ReactNode } from 'react';
import { X, ChevronUp, ChevronDown, Trash2, Pencil, Inbox } from 'lucide-react';

/* Shared styling constants for the admin panel */
export const inputCls =
  'w-full rounded-lg border border-white/10 bg-[#05060f] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#e8b923]/70';
export const labelCls = 'mb-1 block text-xs text-gray-400';
export const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-[#e8b923] px-4 py-2 text-sm font-medium text-[#05060f] transition-colors hover:bg-[#f5cd45] disabled:opacity-60';
export const btnGhost =
  'px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white';
export const cardCls = 'rounded-xl border border-white/5 bg-[#111527] p-4';

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl border border-white/10 bg-[#111527] shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 transition-colors hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  onUp,
  onDown,
  canUp,
  canDown,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onUp?: () => void;
  onDown?: () => void;
  canUp?: boolean;
  canDown?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {onUp && (
        <button
          onClick={onUp}
          disabled={!canUp}
          className="p-1.5 text-gray-500 transition-colors hover:text-[#e8b923] disabled:opacity-20"
          aria-label="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
      {onDown && (
        <button
          onClick={onDown}
          disabled={!canDown}
          className="p-1.5 text-gray-500 transition-colors hover:text-[#e8b923] disabled:opacity-20"
          aria-label="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
      <button onClick={onEdit} className="p-1.5 text-gray-500 transition-colors hover:text-[#e8b923]" aria-label="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} className="p-1.5 text-gray-500 transition-colors hover:text-red-400" aria-label="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-14 text-center">
      <Inbox className="mb-3 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

/** Strip empty-string values so optional zod fields (e.g. email) don't fail validation. */
export function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === '') delete out[key];
  }
  return out;
}
