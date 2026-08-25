import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { trpc } from '@/providers/trpc';
import {
  LayoutDashboard, FolderOpen, Award, BookOpen, Briefcase, FileBadge, GraduationCap,
  Settings, ShieldCheck, LogOut, X, Menu, Code2, Sparkles, Inbox, User, ExternalLink, Globe2, ShieldAlert, Search, Trash2, ChevronLeft, ChevronRight, History,
} from 'lucide-react';
import { ProjectsTab, SkillsTab, ExperiencesTab, CertificatesTab, AwardsTab, WritingsTab } from './tabs/ContentTabs';
import { MessagesTab } from './tabs/MessagesTab';
import { ProfileTab, SecurityTab, SiteTab } from './tabs/SettingsTabs';
import { ChangeLogTab } from './tabs/ChangeLogTab';
import { AcademicFoundationTab } from './tabs/AcademicFoundationTab';

type TabType =
  | 'overview' | 'profile' | 'projects' | 'skills' | 'experiences' | 'academicFoundation'
  | 'certificates' | 'awards' | 'writings' | 'messages' | 'security' | 'site' | 'changeLog';

const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });

function formatCountry(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() || 'ZZ';
  if (code === 'ZZ') return 'Unknown';
  return countryDisplayNames.of(code) || code;
}

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'messages', label: 'Messages', icon: Inbox },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'experiences', label: 'Experience', icon: Briefcase },
  { id: 'academicFoundation', label: 'Academic Foundation', icon: GraduationCap },
  { id: 'certificates', label: 'Certificates', icon: FileBadge },
  { id: 'awards', label: 'Awards', icon: Award },
  { id: 'writings', label: 'Writings', icon: BookOpen },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'site', label: 'Site Settings', icon: Settings },
  { id: 'changeLog', label: 'Change Log', icon: History },
];

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const { data: unread } = trpc.contactAdmin.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/admin/login');
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#05060f' }}>
        <div className="text-sm text-[#e8b923]">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const unreadCount = unread?.count || 0;

  const NavButtons = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => { setActiveTab(tab.id); onNavigate?.(); }}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
            activeTab === tab.id
              ? 'bg-[#e8b923]/10 text-[#e8b923]'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          <span className="flex-1 text-left">{tab.label}</span>
          {tab.id === 'messages' && unreadCount > 0 && (
            <span className="rounded-full bg-[#e8b923] px-1.5 py-0.5 text-[10px] font-semibold text-[#05060f]">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden" style={{ background: '#05060f' }}>
      {/* Sidebar */}
      <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-white/5 bg-[#0b0e1a] lg:flex">
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8b923]/25 bg-[#e8b923]/10">
              <Code2 className="h-4 w-4 text-[#e8b923]" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-white">Admin Panel</h1>
              <p className="text-[10px] text-gray-500">Portfolio CMS</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          <NavButtons />
        </nav>

        <div className="space-y-1 border-t border-white/5 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View Site
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-red-400/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <MobileNav unreadCount={unreadCount} logout={logout}>
        {(close) => <NavButtons onNavigate={close} />}
      </MobileNav>

      {/* Main */}
      <main ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1600px] p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab unreadCount={unreadCount} goTo={setActiveTab} />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'skills' && <SkillsTab />}
          {activeTab === 'experiences' && <ExperiencesTab />}
          {activeTab === 'academicFoundation' && <AcademicFoundationTab />}
          {activeTab === 'certificates' && <CertificatesTab />}
          {activeTab === 'awards' && <AwardsTab />}
          {activeTab === 'writings' && <WritingsTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'site' && <SiteTab />}
          {activeTab === 'changeLog' && <ChangeLogTab />}
        </div>
      </main>
    </div>
  );
}

/* Mobile Navigation */
function MobileNav({
  children,
  unreadCount,
  logout,
}: {
  children: (close: () => void) => React.ReactNode;
  unreadCount: number;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#0b0e1a] px-4 py-3 lg:hidden">
        <span className="text-sm font-medium text-white">Admin Panel</span>
        <button
          onClick={() => setOpen(!open)}
          className="relative text-gray-400"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          {!open && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#e8b923]" />
          )}
        </button>
      </div>
      {open && (
        <div
          className="fixed inset-x-0 top-14 bottom-0 z-[60] overflow-y-auto border-t border-white/5 bg-[#05060f] lg:hidden"
          role="dialog"
          aria-label="Admin navigation"
          aria-modal="true"
        >
          <nav className="grid grid-cols-2 gap-2 p-4 pb-8">
            {children(() => setOpen(false))}
            <button
              onClick={logout}
              className="col-span-2 flex h-11 items-center gap-3 rounded-lg border-t border-white/5 px-3 pt-3 text-sm text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </div>
      )}
    </>
  );
}

/* Overview */
function OverviewTab({ unreadCount, goTo }: { unreadCount: number; goTo: (t: TabType) => void }) {
  const { data: projects } = trpc.project.list.useQuery();
  const { data: certs } = trpc.certificate.list.useQuery();
  const { data: experiences } = trpc.experience.list.useQuery();
  const { data: awards } = trpc.award.list.useQuery();
  const { data: writings } = trpc.writing.listAll.useQuery();
  const { data: skills } = trpc.skill.list.useQuery();
  const { data: messages } = trpc.contactAdmin.list.useQuery();
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsCountry, setAnalyticsCountry] = useState('');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsTimePreset, setAnalyticsTimePreset] = useState('default');
  const [analyticsStart, setAnalyticsStart] = useState('');
  const [analyticsEnd, setAnalyticsEnd] = useState('');
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const analyticsRange = useMemo(() => {
    if (analyticsTimePreset === 'custom') {
      return {
        startDate: analyticsStart ? new Date(analyticsStart).toISOString() : undefined,
        endDate: analyticsEnd ? new Date(analyticsEnd).toISOString() : undefined,
      };
    }
    if (analyticsTimePreset === 'default') return { startDate: undefined, endDate: undefined };
    const now = Date.now();
    const start = analyticsTimePreset === 'today'
      ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      : new Date(now - Number(analyticsTimePreset) * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: undefined };
  }, [analyticsTimePreset, analyticsStart, analyticsEnd]);
  const analyticsFilter = {
    days: analyticsDays,
    country: analyticsCountry || undefined,
    search: analyticsSearch.trim() || undefined,
    ...analyticsRange,
  };
  const { data: analytics } = trpc.analyticsAdmin.summary.useQuery({ days: analyticsDays });
  const { data: analyticsEvents, refetch: refetchAnalyticsEvents } = trpc.analyticsAdmin.events.useQuery({
    ...analyticsFilter,
    page: analyticsPage,
    pageSize: 25,
  });
  const deleteFiltered = trpc.analyticsAdmin.deleteFiltered.useMutation();
  const { data: recycleBin, refetch: refetchRecycleBin } = trpc.analyticsAdmin.recycleBin.useQuery();
  const restoreEvent = trpc.analyticsAdmin.restore.useMutation();
  const permanentlyDeleteEvent = trpc.analyticsAdmin.permanentlyDelete.useMutation();
  const chartDaily = analyticsEvents?.daily || [];
  const maxChartVisits = Math.max(1, ...chartDaily.map((day) => day.visits));
  const handleDeleteFiltered = async () => {
    const total = analyticsEvents?.total || 0;
    if (!total || !window.confirm(`Delete ${total} visitor event${total === 1 ? '' : 's'} matching the current filters? This cannot be undone.`)) return;
    const result = await deleteFiltered.mutateAsync(analyticsFilter);
    setAnalyticsPage(1);
    await refetchAnalyticsEvents();
    await refetchRecycleBin();
    window.alert(`${result.deletedCount} visitor event${result.deletedCount === 1 ? '' : 's'} moved to the recycle bin.`);
  };
  const handleRestoreEvent = async (id: number) => {
    await restoreEvent.mutateAsync({ id });
    await refetchRecycleBin();
    await refetchAnalyticsEvents();
  };
  const handlePermanentDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this visitor event? This cannot be undone.')) return;
    await permanentlyDeleteEvent.mutateAsync({ id });
    await refetchRecycleBin();
  };

  const stats: { label: string; value: number; icon: React.ElementType; tab: TabType; highlight?: boolean }[] = [
    { label: 'Messages', value: messages?.length || 0, icon: Inbox, tab: 'messages', highlight: unreadCount > 0 },
    { label: 'Projects', value: projects?.length || 0, icon: FolderOpen, tab: 'projects' },
    { label: 'Skills', value: skills?.length || 0, icon: Sparkles, tab: 'skills' },
    { label: 'Experiences', value: experiences?.length || 0, icon: Briefcase, tab: 'experiences' },
    { label: 'Certificates', value: certs?.length || 0, icon: FileBadge, tab: 'certificates' },
    { label: 'Awards', value: awards?.length || 0, icon: Award, tab: 'awards' },
    { label: 'Writings', value: writings?.length || 0, icon: BookOpen, tab: 'writings' },
  ];

  const recent = (messages || []).slice(0, 5);

  return (
    <div className="pt-12 lg:pt-0">
      <h2 className="mb-6 text-xl text-white">Dashboard Overview</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => goTo(stat.tab)}
            className={`rounded-xl border p-4 text-left transition-all hover:border-[#e8b923]/40 ${
              stat.highlight ? 'border-[#e8b923]/40 bg-[#e8b923]/5' : 'border-white/5 bg-[#111527]'
            }`}
          >
            <stat.icon className="mb-2 h-5 w-5 text-[#e8b923]" />
            <div className="text-2xl font-medium text-white">
              {stat.value}
              {stat.label === 'Messages' && unreadCount > 0 && (
                <span className="ml-2 align-middle text-xs text-[#e8b923]">({unreadCount} new)</span>
              )}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="mb-4 text-sm font-medium text-white">Recent Messages</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {recent.map((m) => (
                <button
                  key={m.id}
                  onClick={() => goTo('messages')}
                  className="flex w-full items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <span className={`text-sm ${m.isRead ? 'text-gray-400' : 'font-medium text-white'}`}>{m.name}</span>
                    <p className="truncate text-xs text-gray-500">{m.message.slice(0, 60)}</p>
                  </div>
                  {!m.isRead && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#e8b923]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-[#111527] p-6">
          <h3 className="mb-4 text-sm font-medium text-white">Quick Guide</h3>
          <ul className="space-y-2.5 text-sm leading-relaxed text-gray-400">
            <li>• <span className="text-gray-300">Every section of the site</span> is editable from the sidebar — changes go live instantly.</li>
            <li>• Use the <span className="text-[#e8b923]">↑ ↓ arrows</span> on projects, skills, experience, awards, and writings to reorder them.</li>
            <li>• Writings appear publicly only when they have an image and are marked <span className="text-gray-300">Visible</span>.</li>
            <li>• <span className="text-gray-300">Site Settings</span> controls the hero text, section visibility, SEO, and footer.</li>
            <li>• Contact form submissions land in <span className="text-gray-300">Messages</span> with unread badges.</li>
          </ul>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-white/5 bg-[#111527] p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-white">Visitor analytics</h3>
              <p className="mt-1 text-xs text-gray-500">Raw IP visibility is restricted to this admin view. Events are automatically retained for up to one year.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="analytics-range" className="sr-only">Analytics date range</label>
              <select id="analytics-range" value={analyticsDays} onChange={(event) => { setAnalyticsDays(Number(event.target.value)); setAnalyticsPage(1); }} className="rounded-lg border border-white/10 bg-[#0a0d19] px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-[#e8b923]">
                <option value="1">Today</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">3 months</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
              </select>
              <label htmlFor="analytics-time-preset" className="sr-only">Visitor time filter</label>
              <select id="analytics-time-preset" value={analyticsTimePreset} onChange={(event) => { setAnalyticsTimePreset(event.target.value); setAnalyticsPage(1); }} className="rounded-lg border border-white/10 bg-[#0a0d19] px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-[#e8b923]">
                <option value="default">Range: {analyticsDays}d</option>
                <option value="1">Last hour</option>
                <option value="6">Last 6 hours</option>
                <option value="24">Last 24 hours</option>
                <option value="today">Today</option>
                <option value="custom">Custom time</option>
              </select>
              {analyticsTimePreset === 'custom' && <>
                <label htmlFor="analytics-start" className="sr-only">Custom start date and time</label>
                <input id="analytics-start" type="datetime-local" value={analyticsStart} onChange={(event) => { setAnalyticsStart(event.target.value); setAnalyticsPage(1); }} className="rounded-lg border border-white/10 bg-[#0a0d19] px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-[#e8b923]" />
                <label htmlFor="analytics-end" className="sr-only">Custom end date and time</label>
                <input id="analytics-end" type="datetime-local" value={analyticsEnd} onChange={(event) => { setAnalyticsEnd(event.target.value); setAnalyticsPage(1); }} className="rounded-lg border border-white/10 bg-[#0a0d19] px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-[#e8b923]" />
              </>}
              <label htmlFor="analytics-country" className="sr-only">Filter visitor events by country</label>
              <select id="analytics-country" value={analyticsCountry} onChange={(event) => { setAnalyticsCountry(event.target.value); setAnalyticsPage(1); }} className="max-w-36 rounded-lg border border-white/10 bg-[#0a0d19] px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-[#e8b923]">
                <option value="">All countries</option>
                {(analytics?.countries || []).map((country) => <option key={country.country} value={country.country}>{formatCountry(country.country)} ({country.visits})</option>)}
              </select>
              <label htmlFor="analytics-search" className="sr-only">Search visitor events</label>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input id="analytics-search" value={analyticsSearch} onChange={(event) => { setAnalyticsSearch(event.target.value); setAnalyticsPage(1); }} placeholder="Search IP, path, device…" className="w-full rounded-lg border border-white/10 bg-[#0a0d19] py-1.5 pl-8 pr-8 text-xs text-gray-300 outline-none placeholder:text-gray-600 focus:border-[#e8b923]" />
                {analyticsSearch && <button type="button" aria-label="Clear visitor search" onClick={() => { setAnalyticsSearch(''); setAnalyticsPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">×</button>}
              </div>
              <button type="button" onClick={handleDeleteFiltered} disabled={!analyticsEvents?.total || deleteFiltered.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:border-red-400/50 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40" title="Delete events matching the active filters"><Trash2 className="h-3.5 w-3.5" />{deleteFiltered.isPending ? 'Deleting…' : 'Delete filtered'}</button>
              <Globe2 className="h-5 w-5 text-[#e8b923]" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-2xl text-white">{analytics?.totalVisits || 0}</div><div className="text-xs text-gray-500">Visits · {analyticsDays}d</div></div>
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-2xl text-white">{analytics?.uniqueIps || 0}</div><div className="text-xs text-gray-500">Distinct IPs</div></div>
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-2xl text-white">{analytics?.suspiciousEvents || 0}</div><div className="flex items-center gap-1 text-xs text-gray-500"><ShieldAlert className="h-3 w-3 text-orange-300" /> Traffic alerts</div></div>
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-sm text-gray-300">{analytics?.countries.slice(0, 4).map((country) => `${formatCountry(country.country)} (${country.visits})`).join(', ') || 'No country data yet'}</div><div className="mt-1 text-xs text-gray-500">Top countries</div></div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="min-w-0"><h4 className="mb-2 text-xs uppercase tracking-[0.16em] text-gray-500">Top paths</h4><div className="space-y-1.5">{analytics?.topPaths.slice(0, 8).map((path) => <div key={path.path} className="flex justify-between gap-3 text-xs"><span className="truncate text-gray-300">{path.path}</span><span className="shrink-0 text-gray-500">{path.visits}</span></div>) || <p className="text-xs text-gray-600">No path data yet</p>}</div></div>
            <div className="min-w-0"><h4 className="mb-2 text-xs uppercase tracking-[0.16em] text-gray-500">All IPs · {analytics?.uniqueIps || 0}</h4><div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">{analytics?.topIps.map((ip) => <div key={ip.ipAddress} className="rounded-md bg-white/[0.02] px-2 py-1.5 text-xs"><div className="flex items-center justify-between gap-3"><span className={`truncate font-mono ${ip.ipAddress === 'unknown' ? 'text-gray-500' : 'text-gray-300'}`}>{ip.ipAddress}</span><span className={`shrink-0 ${ip.suspicious > 0 ? 'text-orange-300' : 'text-gray-500'}`}>{ip.visits} visits{ip.suspicious > 0 ? ' · alert' : ''}</span></div><div className="mt-0.5 flex justify-between gap-3 text-[10px] text-gray-600"><span>{ip.country === 'ZZ' ? 'Unknown country' : formatCountry(ip.country)}</span>
<span>{ip.lastSeen ? new Date(ip.lastSeen).toLocaleString() : 'No time data'}</span></div></div>) || <p className="text-xs text-gray-600">No IP data yet</p>}</div></div>
            <div className="min-w-0"><h4 className="mb-2 text-xs uppercase tracking-[0.16em] text-gray-500">Daily activity</h4><div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">{analytics?.daily.slice(-8).map((day) => <div key={day.day} className="flex justify-between gap-3 text-xs"><span className="text-gray-300">{day.day}</span><span className="text-gray-500">{day.visits}</span></div>) || <p className="text-xs text-gray-600">No daily data yet</p>}</div></div>
          </div>
          <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs uppercase tracking-[0.16em] text-gray-500">Activity chart · active filters</h4>
              <span className="text-[10px] text-gray-600">{chartDaily.length ? `${chartDaily.length} day${chartDaily.length === 1 ? '' : 's'} · ${analyticsEvents?.total || 0} matching events` : 'No matching activity'}</span>
            </div>
            {chartDaily.length ? <div className="flex h-40 items-end gap-1 overflow-x-auto pb-5">
              {chartDaily.map((day) => <div key={day.day} className="group flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-1" title={`${day.day}: ${day.visits} visits`}>
                <span className="text-[9px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">{day.visits}</span>
                <div className="w-full rounded-t bg-[#e8b923]/70 transition-all group-hover:bg-[#e8b923]" style={{ height: `${Math.max(6, (day.visits / maxChartVisits) * 100)}%` }} />
                <span className="whitespace-nowrap text-[9px] text-gray-600">{day.day.slice(5)}</span>
              </div>)}
            </div> : <p className="py-10 text-center text-xs text-gray-600">No activity matches the current filters.</p>}
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="min-w-0">
              <h4 className="mb-2 text-xs uppercase tracking-[0.16em] text-gray-500">All countries · {analytics?.countries.length || 0}</h4>
              <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                {(analytics?.countries || []).map((country) => (
                  <button key={country.country} type="button" onClick={() => { setAnalyticsCountry(country.country); setAnalyticsPage(1); }} className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/[0.05] ${analyticsCountry === country.country ? 'bg-[#e8b923]/10 text-[#e8b923]' : 'text-gray-300'}`}>
                    <span>{formatCountry(country.country)}</span>
                    <span className="text-gray-500">{country.visits}</span>
                  </button>
                ))}
                {!analytics?.countries.length && <p className="text-xs text-gray-600">No country data yet</p>}
              </div>
              {analyticsCountry && <button type="button" onClick={() => { setAnalyticsCountry(''); setAnalyticsPage(1); }} className="mt-2 text-xs text-[#e8b923] hover:underline">Show all countries</button>}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs uppercase tracking-[0.16em] text-gray-500">All visitor events{analyticsCountry ? ` · ${formatCountry(analyticsCountry)}` : ''}{analyticsSearch.trim() ? ` · Search: ${analyticsSearch.trim()}` : ''}</h4>
                <span className="text-xs text-gray-600">{analyticsEvents?.total || 0} recorded</span>
              </div>
              <div className="max-h-[30rem] overflow-auto rounded-lg border border-white/5">
                <table className="min-w-[760px] w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-gray-500"><tr><th className="px-3 py-2 font-medium">Time</th><th className="px-3 py-2 font-medium">IP</th><th className="px-3 py-2 font-medium">Country</th><th className="px-3 py-2 font-medium">Path</th><th className="px-3 py-2 font-medium">Referrer</th><th className="px-3 py-2 font-medium">Device</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {(analyticsEvents?.events || []).map((event) => (
                      <tr key={event.id} className={event.suspicious ? 'bg-orange-400/[0.06]' : ''}>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-400">{new Date(event.visitedAt).toLocaleString()}</td>
                        <td className={`whitespace-nowrap px-3 py-2 font-mono ${event.ipAddress === 'unknown' ? 'text-gray-500' : 'text-gray-200'}`}>{event.ipAddress || 'unknown'}{event.suspicious ? <span className="ml-1 text-orange-300">!</span> : null}</td>
                        <td className="px-3 py-2 text-gray-300">{formatCountry(event.country)}</td>
                        <td className="max-w-40 truncate px-3 py-2 text-gray-400" title={event.path}>{event.path}</td>
                        <td className="max-w-32 truncate px-3 py-2 text-gray-500" title={event.referrerHost || undefined}>{event.referrerHost || 'Direct'}</td>
                        <td className="max-w-52 truncate px-3 py-2 text-gray-500" title={event.userAgent || undefined}>{event.userAgent || 'Unknown'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!analyticsEvents?.events.length && <p className="px-3 py-5 text-xs text-gray-600">No visitor events in this range.</p>}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">Page {analyticsEvents?.page || analyticsPage} of {analyticsEvents?.totalPages || 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Previous visitor events page" disabled={analyticsPage <= 1} onClick={() => setAnalyticsPage((page) => Math.max(1, page - 1))} className="rounded-md border border-white/10 p-1.5 text-gray-400 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923] disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" aria-label="Next visitor events page" disabled={analyticsPage >= (analyticsEvents?.totalPages || 1)} onClick={() => setAnalyticsPage((page) => page + 1)} className="rounded-md border border-white/10 p-1.5 text-gray-400 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923] disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-white/5 bg-[#0d1120] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs uppercase tracking-[0.16em] text-gray-500">Recycle bin</h4>
                <p className="mt-1 text-xs text-gray-600">Soft-deleted visitor events remain recoverable until permanently removed.</p>
              </div>
              <span className="text-xs text-gray-500">{recycleBin?.length || 0} recent items</span>
            </div>
            {recycleBin?.length ? <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {recycleBin.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-2 text-xs">
                <div className="min-w-0"><div className="flex flex-wrap gap-x-3 gap-y-1"><span className="font-mono text-gray-300">{event.ipAddress}</span><span className="text-gray-500">{formatCountry(event.country)}</span><span className="text-gray-500">{event.path}</span></div><div className="mt-1 text-[10px] text-gray-600">Deleted {event.deletedAt ? new Date(event.deletedAt).toLocaleString() : 'recently'} · visited {new Date(event.visitedAt).toLocaleString()}</div></div>
                <div className="flex items-center gap-2"><button type="button" onClick={() => handleRestoreEvent(event.id)} className="rounded border border-[#e8b923]/25 px-2 py-1 text-[#e8b923] hover:bg-[#e8b923]/10">Restore</button><button type="button" onClick={() => handlePermanentDelete(event.id)} className="rounded border border-red-400/20 px-2 py-1 text-red-300 hover:bg-red-400/10">Delete permanently</button></div>
              </div>)}
            </div> : <p className="text-xs text-gray-600">Recycle bin is empty.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
