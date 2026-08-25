import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { LogOut, Save, ShieldCheck } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { DEFAULT_SETTINGS, type SectionKey } from '@/hooks/useSettings';
import { Field, inputCls, btnPrimary, btnGhost, stripEmpty } from '../adminUi';
import { ImageUploadField } from '../ImageUpload';

/* ============ Profile ============ */

export function ProfileTab() {
  const { data: profile, refetch } = trpc.profile.get.useQuery();
  const update = trpc.profileAdmin.update.useMutation({
    onSuccess: () => { refetch(); toast.success('Profile saved'); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: '', title: '', bio: '', email: '', githubUrl: '', linkedinUrl: '', mediumUrl: '',
    location: '', age: 0, university: '', department: '', semester: '', avatarUrl: '', cvUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '', title: profile.title || '', bio: profile.bio || '',
        email: profile.email || '', githubUrl: profile.githubUrl || '', linkedinUrl: profile.linkedinUrl || '',
        mediumUrl: profile.mediumUrl || '', location: profile.location || '', age: profile.age || 0,
        university: profile.university || '', department: profile.department || '', semester: profile.semester || '',
        avatarUrl: profile.avatarUrl || '', cvUrl: profile.cvUrl || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, title, bio, age, ...optional } = form;
    update.mutate({
      name, title, bio,
      ...(age ? { age: Number(age) } : {}),
      ...stripEmpty(optional),
    });
  };

  return (
    <div className="pt-12 lg:pt-0">
      <h2 className="mb-6 text-xl text-white">Profile</h2>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required /></Field>
          <Field label="Age"><input type="number" value={form.age || ''} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} className={inputCls} /></Field>
        </div>
        <Field label="Title *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required /></Field>
        <Field label="Bio *"><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={`${inputCls} h-28`} required /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
          <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="University"><input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className={inputCls} /></Field>
          <Field label="Department"><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputCls} /></Field>
        </div>
        <Field label="Semester"><input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className={inputCls} /></Field>
        <ImageUploadField label="Profile photo" value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="GitHub"><input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className={inputCls} /></Field>
          <Field label="LinkedIn"><input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className={inputCls} /></Field>
          <Field label="Medium"><input value={form.mediumUrl} onChange={(e) => setForm({ ...form, mediumUrl: e.target.value })} className={inputCls} /></Field>
        </div>
        <ImageUploadField label="CV / Resume (PDF)" value={form.cvUrl} onChange={(url) => setForm({ ...form, cvUrl: url })} accept="application/pdf,image/*" />
        <div className="pt-2">
          <button type="submit" disabled={update.isPending} className={btnPrimary}>
            <Save className="h-4 w-4" /> {update.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============ Site settings ============ */

const SECTION_LABELS: Record<SectionKey, string> = {
  about: 'About',
  projects: 'Projects',
  experience: 'Experience',
  skills: 'Skills',
  awards: 'Awards',
  certificates: 'Certificates',
  blog: 'Blog',
  contact: 'Contact',
};

export function SiteTab() {
  const utils = trpc.useUtils();
  const { data: saved } = trpc.settings.getAll.useQuery();
  const { data: aiConfig, refetch: refetchAi } = trpc.settingsAdmin.getAi.useQuery();
  const setMany = trpc.settingsAdmin.setMany.useMutation({
    onSuccess: () => { utils.settings.getAll.invalidate(); toast.success('Site settings saved'); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [aiForm, setAiForm] = useState({ provider: 'gemini' as 'openai' | 'gemini' | 'groq' | 'xai', apiUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-3.5-flash-lite', apiKey: '' });
  const saveAi = trpc.settingsAdmin.setAi.useMutation({
    onSuccess: () => { refetchAi(); setAiForm((current) => ({ ...current, apiKey: '' })); toast.success('AI configuration saved'); },
    onError: (error) => toast.error(error.message),
  });
  const [visibility, setVisibility] = useState<Record<SectionKey, boolean>>(
    JSON.parse(DEFAULT_SETTINGS.sectionVisibility)
  );

  useEffect(() => {
    if (aiConfig) setAiForm((current) => ({ ...current, provider: aiConfig.provider as 'openai' | 'gemini' | 'groq' | 'xai', apiUrl: aiConfig.apiUrl, model: aiConfig.model }));
  }, [aiConfig]);

  useEffect(() => {
    if (saved) {
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      setForm(merged);
      try {
        setVisibility(JSON.parse(merged.sectionVisibility));
      } catch {
        /* keep defaults */
      }
    }
  }, [saved]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleAiSave = () => {
    saveAi.mutate({ provider: aiForm.provider, apiUrl: aiForm.apiUrl, model: aiForm.model, apiKey: aiForm.apiKey || undefined });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entries = Object.entries({
      ...form,
      sectionVisibility: JSON.stringify(visibility),
    }).map(([key, value]) => ({ key, value }));
    setMany.mutate(entries);
  };

  return (
    <div className="pt-12 lg:pt-0">
      <h2 className="mb-6 text-xl text-white">Site Settings</h2>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        <section className="space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="text-sm font-medium text-[#e8b923]">Hero Section</h3>
          <Field label="Badge text"><input value={form.heroBadge} onChange={(e) => set('heroBadge', e.target.value)} className={inputCls} /></Field>
          <Field label="Headline"><input value={form.heroHeadline} onChange={(e) => set('heroHeadline', e.target.value)} className={inputCls} /></Field>
          <Field label="Rotating taglines (comma separated — typed one at a time)">
            <input value={form.heroTagline} onChange={(e) => set('heroTagline', e.target.value)} className={inputCls} placeholder="ML Engineer, Full Stack Developer" />
          </Field>
          <Field label="Subtext"><textarea value={form.heroSubtext} onChange={(e) => set('heroSubtext', e.target.value)} className={`${inputCls} h-20`} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary CTA label"><input value={form.heroPrimaryCta} onChange={(e) => set('heroPrimaryCta', e.target.value)} className={inputCls} /></Field>
            <Field label="Primary CTA target"><input value={form.heroPrimaryTarget} onChange={(e) => set('heroPrimaryTarget', e.target.value)} className={inputCls} placeholder="projects" /></Field>
            <Field label="Secondary CTA label"><input value={form.heroSecondaryCta} onChange={(e) => set('heroSecondaryCta', e.target.value)} className={inputCls} /></Field>
            <Field label="Secondary CTA target"><input value={form.heroSecondaryTarget} onChange={(e) => set('heroSecondaryTarget', e.target.value)} className={inputCls} placeholder="contact" /></Field>
            <Field label="CV CTA label"><input value={form.heroCvCta} onChange={(e) => set('heroCvCta', e.target.value)} className={inputCls} /></Field>
            <Field label="Scroll target"><input value={form.heroScrollTarget} onChange={(e) => set('heroScrollTarget', e.target.value)} className={inputCls} placeholder="about" /></Field>
          </div>
          <Field label="Scroll label"><input value={form.heroScrollLabel} onChange={(e) => set('heroScrollLabel', e.target.value)} className={inputCls} /></Field>
        </section>

        <section className="space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="text-sm font-medium text-[#e8b923]">Availability</h3>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.availableForWork === 'true'}
              onChange={(e) => set('availableForWork', e.target.checked ? 'true' : 'false')}
              className="rounded"
            />
            Show "available for work" badge
          </label>
          <Field label="Availability text"><input value={form.availabilityText} onChange={(e) => set('availabilityText', e.target.value)} className={inputCls} /></Field>
        </section>

        <section className="space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
          <div>
            <h3 className="text-sm font-medium text-[#e8b923]">Bottom Activity Bar</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">Control the fixed status strip shown at the bottom of the public portfolio.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.bottomBarEnabled === 'true'}
              onChange={(e) => set('bottomBarEnabled', e.target.checked ? 'true' : 'false')}
              className="rounded"
            />
            Show bottom activity bar
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status label"><input value={form.bottomBarStatusText} onChange={(e) => set('bottomBarStatusText', e.target.value)} className={inputCls} placeholder="now automating" /></Field>
            <Field label="Hire Me button label"><input value={form.bottomBarHireLabel} onChange={(e) => set('bottomBarHireLabel', e.target.value)} className={inputCls} placeholder="Hire Me" /></Field>
          </div>
          <Field label="Ticker message"><input value={form.bottomBarMessage} onChange={(e) => set('bottomBarMessage', e.target.value)} className={inputCls} placeholder="Bilingual AI engineering · Available for selected freelance and remote engagements · Open to thoughtful collaborations" /></Field>
          <Field label="Hire Me target">
            <select value={form.bottomBarHireTarget} onChange={(e) => set('bottomBarHireTarget', e.target.value)} className={inputCls}>
              <option value="contact">Contact</option>
              <option value="projects">Projects</option>
              <option value="about">About</option>
              <option value="experience">Experience</option>
              <option value="cv">CV</option>
            </select>
          </Field>
        </section>

        <section className="space-y-3 rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="mb-2 text-sm font-medium text-[#e8b923]">Section Visibility</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={visibility[key] !== false}
                  onChange={(e) => setVisibility((v) => ({ ...v, [key]: e.target.checked }))}
                  className="rounded"
                />
                {SECTION_LABELS[key]}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="text-sm font-medium text-[#e8b923]">Navigation & Search</h3>
          <p className="text-xs leading-relaxed text-gray-500">Keep these JSON arrays in the database so labels, targets, and frequent visitor searches can change without editing frontend code.</p>
          <Field label="Navigation items (JSON)"><textarea value={form.navigationItems} onChange={(e) => set('navigationItems', e.target.value)} className={`${inputCls} h-24 font-mono text-[10px]`} /></Field>
          <Field label="Frequent search suggestions (JSON)"><textarea value={form.searchSuggestions} onChange={(e) => set('searchSuggestions', e.target.value)} className={`${inputCls} h-24 font-mono text-[10px]`} /></Field>
          <Field label="Public section copy (JSON)"><textarea value={form.sectionCopy} onChange={(e) => set('sectionCopy', e.target.value)} className={`${inputCls} h-48 font-mono text-[10px]`} /></Field>
        </section>

        <section className="space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="text-sm font-medium text-[#e8b923]">Social & Publishing</h3>
          <Field label="Blogger profile URL"><input value={form.bloggerUrl} onChange={(e) => set('bloggerUrl', e.target.value)} className={inputCls} placeholder="https://nazmus247.blogspot.com/" /></Field>
          <Field label="X / Twitter profile URL"><input value={form.xUrl} onChange={(e) => set('xUrl', e.target.value)} className={inputCls} placeholder="https://x.com/Nazmussakib0247" /></Field>
        </section>

        <section className="space-y-4 rounded-xl border border-[#e8b923]/20 bg-[#111527] p-6">
          <h3 className="text-sm font-medium text-[#e8b923]">AI Assistant Configuration</h3>
          <p className="text-xs leading-relaxed text-gray-500">Only authenticated admins can change these values. Assistant media is stored as site settings so it can be replaced without editing the frontend.</p>
          <Field label="Xervis avatar URL"><input value={form.assistantAvatarUrl} onChange={(e) => set('assistantAvatarUrl', e.target.value)} className={inputCls} placeholder="/api/files/123 or https://..." /></Field>
          <Field label="Xervis greeting audio URL"><input value={form.assistantGreetingAudioUrl} onChange={(e) => set('assistantGreetingAudioUrl', e.target.value)} className={inputCls} placeholder="/api/files/123 or https://..." /></Field>
          <Field label="Provider"><select value={aiForm.provider} onChange={(e) => { const provider = e.target.value as 'openai' | 'gemini' | 'groq' | 'xai'; const defaults = { gemini: { apiUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-3.5-flash-lite' }, groq: { apiUrl: 'https://api.groq.com/openai', model: 'llama-3.3-70b-versatile' }, xai: { apiUrl: 'https://api.x.ai', model: 'grok-3-mini' }, openai: { apiUrl: 'https://api.openai.com', model: 'gpt-5-mini' } }[provider]; setAiForm({ ...aiForm, provider, apiUrl: defaults.apiUrl, model: defaults.model }); }} className={inputCls}><option value="gemini">Google Gemini</option><option value="groq">Groq</option><option value="xai">xAI Grok</option><option value="openai">OpenAI-compatible</option></select></Field>
          <Field label="AI API URL"><input value={aiForm.apiUrl} onChange={(e) => setAiForm({ ...aiForm, apiUrl: e.target.value })} className={inputCls} /></Field>
          <Field label="Model"><input value={aiForm.model} onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })} className={inputCls} placeholder="gemini-3.5-flash-lite" /></Field>
          <Field label={aiConfig?.maskedKey ? `API key (current: ${aiConfig.maskedKey})` : 'API key'}><input type="password" value={aiForm.apiKey} onChange={(e) => setAiForm({ ...aiForm, apiKey: e.target.value })} className={inputCls} placeholder={aiConfig?.hasKey ? 'Leave blank to keep current key' : 'Paste a new server-side API key'} autoComplete="new-password" /></Field>
          <button type="button" onClick={handleAiSave} disabled={saveAi.isPending || !aiForm.apiUrl || !aiForm.model} className={btnPrimary}>{saveAi.isPending ? 'Saving AI settings…' : 'Save AI Configuration'}</button>
        </section>

        <section className="space-y-4 rounded-xl border border-white/5 bg-[#111527] p-6">
          <div>
            <h3 className="text-sm font-medium text-[#e8b923]">SEO & Footer</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">Profile photo, social preview image, and browser tab icon are managed independently.</p>
          </div>
          <Field label="SEO title"><input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} className={inputCls} /></Field>
          <Field label="SEO description"><textarea value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} className={`${inputCls} h-16`} /></Field>
          <Field label="Canonical site URL"><input type="url" value={form.canonicalSiteUrl} onChange={(e) => set('canonicalSiteUrl', e.target.value)} className={inputCls} placeholder="https://nazmussakib.tech/" /></Field>
          <ImageUploadField label="Social preview image (Open Graph / Twitter)" value={form.socialPreviewImageUrl} onChange={(url) => set('socialPreviewImageUrl', url)} accept="image/*" />
          <Field label="Social preview image alt text"><input value={form.socialPreviewImageAlt} onChange={(e) => set('socialPreviewImageAlt', e.target.value)} className={inputCls} /></Field>
          <ImageUploadField label="Browser tab icon / favicon" value={form.faviconUrl} onChange={(url) => set('faviconUrl', url)} accept="image/*" />
          <Field label="Footer text"><input value={form.footerText} onChange={(e) => set('footerText', e.target.value)} className={inputCls} /></Field>
        </section>

        <button type="submit" disabled={setMany.isPending} className={btnPrimary}>
          <Save className="h-4 w-4" /> {setMany.isPending ? 'Saving…' : 'Save Site Settings'}
        </button>
      </form>
    </div>
  );
}


/* ============ Admin security ============ */

export function SecurityTab() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const { data: status } = trpc.admin.securityStatus.useQuery();
  const changePassword = trpc.admin.changePassword.useMutation({
    onSuccess: async (result) => {
      setForm(emptyForm);
      toast.success(result.message);
      await logout();
      navigate('/admin/login');
    },
    onError: (error) => toast.error(error.message),
  });
  const logoutAll = trpc.admin.logoutAll.useMutation({
    onSuccess: async () => {
      toast.success('All admin sessions have been signed out');
      await logout();
      navigate('/admin/login');
    },
    onError: (error) => toast.error(error.message),
  });

  const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(emptyForm);
  const strongEnough = form.newPassword.length >= 12
    && [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(form.newPassword)).length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (!strongEnough) {
      toast.error('Use at least 12 characters and at least three character types');
      return;
    }
    changePassword.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div className="pt-12 lg:pt-0">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-[#e8b923]" />
        <div>
          <h2 className="text-xl text-white">Security</h2>
          <p className="text-xs text-gray-500">Protect the CMS before deploying it publicly.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-[#e8b923]/20 bg-[#111527] p-6">
          <h3 className="mb-2 text-sm font-medium text-[#e8b923]">Change admin password</h3>
          <p className="mb-5 text-xs leading-relaxed text-gray-500">
            The password is stored as a salted server-side hash. Changing it signs out every active admin session, including this device.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Current password *">
              <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputCls} autoComplete="current-password" required />
            </Field>
            <Field label="New password *">
              <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputCls} autoComplete="new-password" minLength={12} required />
            </Field>
            <Field label="Confirm new password *">
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inputCls} autoComplete="new-password" minLength={12} required />
            </Field>
            <p className={`text-xs ${strongEnough ? 'text-green-400' : 'text-gray-500'}`}>
              Use 12+ characters with at least three of uppercase, lowercase, number, and symbol.
            </p>
            <button type="submit" disabled={changePassword.isPending || !form.currentPassword || !strongEnough || form.newPassword !== form.confirmPassword} className={btnPrimary}>
              <ShieldCheck className="h-4 w-4" /> {changePassword.isPending ? 'Changing password…' : 'Change Password'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="mb-2 text-sm font-medium text-white">Active session protection</h3>
          <p className="mb-4 text-xs leading-relaxed text-gray-500">
            Sessions use an HttpOnly, Secure cookie in production and expire automatically. Login failures are throttled to reduce brute-force attempts.
          </p>
          <div className="mb-5 grid grid-cols-2 gap-3 text-xs text-gray-400 sm:grid-cols-4">
            <div className="rounded-lg border border-white/5 bg-[#05060f] p-3"><span className="block text-gray-600">Session lifetime</span><strong className="mt-1 block text-white">{status?.sessionHours ?? 8} hours</strong></div>
            <div className="rounded-lg border border-white/5 bg-[#05060f] p-3"><span className="block text-gray-600">Failed attempts</span><strong className="mt-1 block text-white">{status?.maxLoginFailures ?? 5}</strong></div>
            <div className="rounded-lg border border-white/5 bg-[#05060f] p-3"><span className="block text-gray-600">Lockout window</span><strong className="mt-1 block text-white">{status?.loginWindowMinutes ?? 15} minutes</strong></div>
            <div className="rounded-lg border border-white/5 bg-[#05060f] p-3"><span className="block text-gray-600">Recovery email</span><strong className={`mt-1 block ${status?.recoveryEmailConfigured ? 'text-green-400' : 'text-red-400'}`}>{status?.recoveryEmailConfigured ? 'Configured' : 'Not configured'}</strong></div>
          </div>
          <button type="button" onClick={() => logoutAll.mutate()} disabled={logoutAll.isPending} className={`${btnGhost} inline-flex items-center gap-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300`}>
            <LogOut className="h-4 w-4" /> {logoutAll.isPending ? 'Signing out…' : 'Sign out all devices'}
          </button>
        </section>
      </div>
    </div>
  );
}
