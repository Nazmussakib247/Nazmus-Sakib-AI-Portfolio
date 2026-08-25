import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { trpc } from '@/providers/trpc';
import {
  LayoutDashboard, FolderOpen, Award, BookOpen, Briefcase, FileBadge,
  Settings, ShieldCheck, LogOut, X, Menu, Code2, Sparkles, Inbox, User, ExternalLink, Globe2,
} from 'lucide-react';
import { ProjectsTab, SkillsTab, ExperiencesTab, CertificatesTab, AwardsTab, WritingsTab } from './tabs/ContentTabs';
import { MessagesTab } from './tabs/MessagesTab';
import { ProfileTab, SecurityTab, SiteTab } from './tabs/SettingsTabs';

type TabType =
  | 'overview' | 'profile' | 'projects' | 'skills' | 'experiences'
  | 'certificates' | 'awards' | 'writings' | 'messages' | 'security' | 'site';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'messages', label: 'Messages', icon: Inbox },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'experiences', label: 'Experience', icon: Briefcase },
  { id: 'certificates', label: 'Certificates', icon: FileBadge },
  { id: 'awards', label: 'Awards', icon: Award },
  { id: 'writings', label: 'Writings', icon: BookOpen },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'site', label: 'Site Settings', icon: Settings },
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
      <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab unreadCount={unreadCount} goTo={setActiveTab} />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'skills' && <SkillsTab />}
          {activeTab === 'experiences' && <ExperiencesTab />}
          {activeTab === 'certificates' && <CertificatesTab />}
          {activeTab === 'awards' && <AwardsTab />}
          {activeTab === 'writings' && <WritingsTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'site' && <SiteTab />}
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
  const { data: analytics } = trpc.analyticsAdmin.summary.useQuery();

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

        <div className="rounded-xl border border-white/5 bg-[#111527] p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-white">Visitor overview</h3>
              <p className="mt-1 text-xs text-gray-500">Aggregated visits from the last 30 days; raw IP addresses are never stored.</p>
            </div>
            <Globe2 className="h-5 w-5 text-[#e8b923]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-2xl text-white">{analytics?.totalVisits || 0}</div><div className="text-xs text-gray-500">Total visits</div></div>
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-sm text-gray-300">{analytics?.countries.slice(0, 4).map((country) => `${country.country === 'ZZ' ? 'Unknown' : country.country} (${country.visits})`).join(', ') || 'No country data yet'}</div><div className="mt-1 text-xs text-gray-500">Top countries</div></div>
            <div className="rounded-lg bg-white/[0.03] p-3"><div className="text-sm text-gray-300">{analytics?.topPaths.slice(0, 3).map((path) => `${path.path} (${path.visits})`).join(', ') || 'No path data yet'}</div><div className="mt-1 text-xs text-gray-500">Top paths</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
