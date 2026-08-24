import { useRef, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { Github, Linkedin, BookOpen, Globe2, AtSign, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useReveal } from '@/components/fx/useReveal';
import { useSettings } from '@/hooks/useSettings';
import Magnetic from '@/components/fx/Magnetic';

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: profile } = trpc.profile.get.useQuery();
  const { get, getJson } = useSettings();
  const copy = getJson<{ contact?: Record<string, string> }>('sectionCopy', {});
  const contactCopy = copy.contact ?? {};
  useReveal(sectionRef, [profile]);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
    },
    onError: (err) => setError(err.message || ''),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    sendMutation.mutate({
      name: form.name,
      email: form.email,
      subject: form.subject || undefined,
      message: form.message,
      website: form.website || undefined,
    });
  };

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-[#e8b923]/60 focus:bg-white/[0.05]';

  const socials = [
    { href: profile?.githubUrl, icon: Github, label: 'GitHub' },
    { href: profile?.linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
    { href: profile?.mediumUrl, icon: BookOpen, label: 'Medium' },
    { href: get('xUrl'), icon: AtSign, label: 'X / Twitter' },
    { href: get('bloggerUrl'), icon: Globe2, label: 'Blogger' },
  ].filter((social): social is { href: string; icon: typeof Github; label: string } => Boolean(social.href));

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="film-grain relative w-full px-4 pt-24 pb-10 sm:px-6 lg:px-8 lg:pt-32"
      style={{ background: 'var(--bg-deep)' }}
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <span
            data-reveal="up"
            className="will-reveal mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#e8b923]"
          >
            <span className="inline-block h-px w-8 bg-[#e8b923]/60" />
            {contactCopy.kicker || ''}
            <span className="inline-block h-px w-8 bg-[#e8b923]/60" />
          </span>
          <h2
            data-reveal="up"
            data-reveal-delay="0.08"
            className="will-reveal text-gradient-chrome mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl lg:text-5xl"
          >
            {contactCopy.title || ''}
          </h2>
          <p
            data-reveal="up"
            data-reveal-delay="0.16"
            className="will-reveal mx-auto mt-4 max-w-xl text-sm text-gray-400 sm:text-base"
          >
            {contactCopy.blurb || ''}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Contact form */}
          <div data-reveal="left" className="will-reveal lg:col-span-3">
            {sent ? (
              <div className="glass flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl p-10 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-green-400" />
                <h3 className="mb-2 text-xl font-medium text-white">                  {contactCopy.sentTitle || ''}
</h3>
                <p className="mb-6 text-sm text-gray-400">
                  {contactCopy.sentBlurb || ''}
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="glass rounded-full px-5 py-2 text-sm text-[#e8b923] transition-colors hover:border-[#e8b923]/40"
                >
                  {contactCopy.anotherLabel || ''}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={contactCopy.namePlaceholder || ''}
                    className={inputCls}
                    required
                    maxLength={255}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={contactCopy.emailPlaceholder || ''}
                    className={inputCls}
                    required
                    maxLength={320}
                  />
                </div>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={contactCopy.subjectPlaceholder || ''}
                  className={inputCls}
                  maxLength={500}
                />
                {/* Honeypot — hidden from humans */}
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  aria-hidden="true"
                />
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={contactCopy.messagePlaceholder || ''}
                  className={`${inputCls} h-36 resize-none`}
                  required
                  minLength={5}
                  maxLength={5000}
                />
                {error && (
                  <p className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </p>
                )}
                <Magnetic>
                  <button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="glow-gold inline-flex items-center gap-2 rounded-full bg-[#e8b923] px-7 py-3.5 text-sm font-semibold text-[#05060f] transition-all hover:bg-[#f5cd45] disabled:opacity-60"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {sendMutation.isPending ? contactCopy.sendingLabel || '' : contactCopy.submitLabel || ''}
                  </button>
                </Magnetic>
              </form>
            )}
          </div>

          {/* Direct channels */}
          <div data-reveal="right" className="will-reveal space-y-4 lg:col-span-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="glass card-hover group flex items-center gap-4 rounded-2xl p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <s.icon className="h-5 w-5 text-gray-400 transition-colors group-hover:text-[#e8b923]" />
                </span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[#e8b923]">{s.label}</div>
                  <div className="text-xs text-gray-500">{contactCopy.channelCta || ''}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div data-reveal="fade" className="will-reveal mt-24 border-t border-white/5 pt-8 text-center">
          <div className="mx-auto mb-5 h-px w-10 bg-[#e8b923]" />
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {profile?.name || ''}. {get('footerText')}
          </p>
        </div>
      </div>
    </section>
  );
}
