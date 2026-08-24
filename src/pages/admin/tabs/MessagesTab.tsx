import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, MailOpen, Trash2, Reply } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { EmptyState, cardCls } from '../adminUi';

export function MessagesTab() {
  const utils = trpc.useUtils();
  const { data: messages, refetch } = trpc.contactAdmin.list.useQuery();
  const [openId, setOpenId] = useState<number | null>(null);

  const invalidate = () => {
    refetch();
    utils.contactAdmin.unreadCount.invalidate();
  };

  const markRead = trpc.contactAdmin.markRead.useMutation({ onSuccess: invalidate });
  const del = trpc.contactAdmin.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success('Message deleted'); },
  });

  const toggleOpen = (id: number, isRead: boolean | null) => {
    setOpenId(openId === id ? null : id);
    if (!isRead) markRead.mutate({ id, isRead: true });
  };

  return (
    <div className="pt-12 lg:pt-0">
      <h2 className="mb-6 text-xl text-white">Inbox</h2>
      {(messages || []).length === 0 ? (
        <EmptyState text="No messages yet. Messages from your contact form appear here." />
      ) : (
        <div className="space-y-3">
          {messages!.map((m) => {
            const open = openId === m.id;
            return (
              <div key={m.id} className={`${cardCls} transition-colors ${!m.isRead ? 'border-[#e8b923]/30' : ''}`}>
                <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => toggleOpen(m.id, m.isRead)}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={`mt-0.5 ${m.isRead ? 'text-gray-600' : 'text-[#e8b923]'}`}>
                      {m.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm ${m.isRead ? 'text-gray-300' : 'font-medium text-white'}`}>{m.name}</span>
                        <span className="font-mono text-xs text-gray-500">{m.email}</span>
                        {!m.isRead && <span className="rounded-full bg-[#e8b923]/15 px-2 py-0.5 text-[10px] text-[#e8b923]">NEW</span>}
                      </div>
                      <p className={`truncate text-xs text-gray-500 ${open ? 'hidden' : ''}`}>
                        {m.subject ? `${m.subject} — ` : ''}{m.message.slice(0, 80)}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-mono text-[10px] text-gray-600">
                    {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </button>

                {open && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    {m.subject && <p className="mb-2 text-sm font-medium text-white">{m.subject}</p>}
                    <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-300">{m.message}</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8b923]/10 px-3 py-1.5 text-xs text-[#e8b923] transition-colors hover:bg-[#e8b923]/20"
                      >
                        <Reply className="h-3.5 w-3.5" /> Reply via email
                      </a>
                      <button
                        onClick={() => markRead.mutate({ id: m.id, isRead: !m.isRead })}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-white"
                      >
                        Mark as {m.isRead ? 'unread' : 'read'}
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this message?')) del.mutate({ id: m.id }); }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
