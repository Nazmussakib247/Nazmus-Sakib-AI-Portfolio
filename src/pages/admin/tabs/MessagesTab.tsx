import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Mail, MailOpen, Trash2, Reply, ShieldAlert, Smartphone, Ban, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { EmptyState, cardCls, inputCls } from '../adminUi';

type MessageFilter = 'all' | 'unread' | 'spam' | 'clean';

export function MessagesTab() {
  const utils = trpc.useUtils();
  const { data: messages, refetch } = trpc.contactAdmin.list.useQuery();
  const { data: blockedIps, refetch: refetchBlocked } = trpc.contactAdmin.listBlockedIps.useQuery();
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');

  const invalidate = () => {
    refetch();
    utils.contactAdmin.unreadCount.invalidate();
  };

  const markRead = trpc.contactAdmin.markRead.useMutation({ onSuccess: invalidate });
  const toggleSpam = trpc.contactAdmin.toggleSpam.useMutation({ onSuccess: () => { invalidate(); toast.success('Spam status updated'); } });
  const blockIp = trpc.contactAdmin.blockIp.useMutation({ onSuccess: () => { refetchBlocked(); toast.success('IP blocked'); } });
  const unblockIp = trpc.contactAdmin.unblockIp.useMutation({ onSuccess: () => { refetchBlocked(); toast.success('IP unblocked'); } });
  const del = trpc.contactAdmin.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success('Message deleted'); },
  });

  const ipCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const message of messages || []) {
      if (message.ipAddress) counts.set(message.ipAddress, (counts.get(message.ipAddress) || 0) + 1);
    }
    return counts;
  }, [messages]);
  const emailCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const message of messages || []) counts.set(message.email.toLowerCase(), (counts.get(message.email.toLowerCase()) || 0) + 1);
    return counts;
  }, [messages]);
  const blockedSet = useMemo(() => new Set((blockedIps || []).map((item) => item.ipAddress)), [blockedIps]);
  const visibleMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (messages || []).filter((message) => {
      const matchesFilter = filter === 'all' || (filter === 'unread' && !message.isRead) || (filter === 'spam' && message.isSpam) || (filter === 'clean' && !message.isSpam);
      const haystack = [message.name, message.email, message.ipAddress, message.subject, message.message].filter(Boolean).join(' ').toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [messages, filter, search]);

  const toggleOpen = (id: number, isRead: boolean | null) => {
    setOpenId(openId === id ? null : id);
    if (!isRead) markRead.mutate({ id, isRead: true });
  };

  return (
    <div className="pt-12 lg:pt-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl text-white">Inbox</h2>
          <p className="mt-1 text-xs text-gray-500">Review messages, identify repeat senders, and control abusive IPs.</p>
        </div>
        <span className="font-mono text-xs text-gray-500">{visibleMessages.length} of {(messages || []).length}</span>
      </div>
      {(messages || []).length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputCls} placeholder="Search name, email, IP, subject, or message…" aria-label="Search messages" />
          <div className="flex flex-wrap gap-2">
            {(['all', 'unread', 'spam', 'clean'] as MessageFilter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923] ${filter === value ? 'bg-[#e8b923] text-[#05060f]' : 'bg-white/5 text-gray-400 hover:text-white'}`}>{value}</button>)}
          </div>
        </div>
      )}
      {(messages || []).length === 0 ? (
        <EmptyState text="No messages yet. Messages from your contact form appear here." />
      ) : visibleMessages.length === 0 ? (
        <EmptyState text="No messages match the current filter." />
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((m) => {
            const open = openId === m.id;
            const ip = m.ipAddress || '';
            const isBlocked = Boolean(ip && blockedSet.has(ip));
            const repeatCount = Math.max(ipCounts.get(ip) || 0, emailCounts.get(m.email.toLowerCase()) || 0);
            return (
              <div key={m.id} className={`${cardCls} transition-colors ${!m.isRead ? 'border-[#e8b923]/30' : ''} ${m.isSpam ? 'border-red-400/30' : ''}`}>
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8b923]" onClick={() => toggleOpen(m.id, m.isRead)}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={`mt-0.5 ${m.isRead ? 'text-gray-600' : 'text-[#e8b923]'}`}>{m.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm ${m.isRead ? 'text-gray-300' : 'font-medium text-white'}`}>{m.name}</span>
                        <span className="font-mono text-xs text-gray-500">{m.email}</span>
                        {!m.isRead && <span className="rounded-full bg-[#e8b923]/15 px-2 py-0.5 text-[10px] text-[#e8b923]">NEW</span>}
                        {m.isSpam && <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] text-red-300">SPAM</span>}
                        {repeatCount > 1 && <span className="rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] text-orange-300">REPEAT ×{repeatCount}</span>}
                        {isBlocked && <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] text-red-300">IP BLOCKED</span>}
                      </div>
                      <p className={`truncate text-xs text-gray-500 ${open ? 'hidden' : ''}`}>{m.subject ? `${m.subject} — ` : ''}{m.message.slice(0, 80)}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-mono text-[10px] text-gray-600">{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </button>

                {open && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    {m.subject && <p className="mb-2 text-sm font-medium text-white">{m.subject}</p>}
                    <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-300">{m.message}</p>
                    <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#e8b923]"><ShieldAlert className="h-3.5 w-3.5" /> Abuse-monitoring details</div>
                      <div className="grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
                        <div className="flex min-w-0 items-center gap-2"><span className="text-gray-600">IP</span><code className="truncate text-gray-300">{m.ipAddress || 'Unavailable'}</code></div>
                        <div className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-gray-600" /><span>{[m.deviceType, m.browser, m.operatingSystem].filter(Boolean).join(' · ') || 'Unknown device'}</span></div>
                        <div className="text-gray-500">IP messages: <strong className="text-gray-300">{ipCounts.get(ip) || 0}</strong></div>
                        <div className="text-gray-500">Email messages: <strong className="text-gray-300">{emailCounts.get(m.email.toLowerCase()) || 0}</strong></div>
                      </div>
                      {m.userAgent && <p className="mt-2 break-words font-mono text-[10px] leading-relaxed text-gray-600" title={m.userAgent}>{m.userAgent}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#e8b923]/10 px-3 py-1.5 text-xs text-[#e8b923] transition-colors hover:bg-[#e8b923]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"><Reply className="h-3.5 w-3.5" /> Reply via email</a>
                      <button type="button" onClick={() => markRead.mutate({ id: m.id, isRead: !m.isRead })} className="min-h-11 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]">Mark as {m.isRead ? 'unread' : 'read'}</button>
                      <button type="button" onClick={() => toggleSpam.mutate({ id: m.id, isSpam: !m.isSpam })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-orange-400/10 px-3 py-1.5 text-xs text-orange-300 transition-colors hover:bg-orange-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">{m.isSpam ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />} Mark as {m.isSpam ? 'clean' : 'spam'}</button>
                      {ip && <button type="button" onClick={() => isBlocked ? unblockIp.mutate({ ipAddress: ip }) : blockIp.mutate({ ipAddress: ip, note: `Blocked from message by ${m.name}` })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"><Ban className="h-3.5 w-3.5" /> {isBlocked ? 'Unblock IP' : 'Block IP'}</button>}
                      <button type="button" onClick={() => { if (confirm('Delete this message?')) del.mutate({ id: m.id }); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
