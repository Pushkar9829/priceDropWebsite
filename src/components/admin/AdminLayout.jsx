import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  ExternalLink,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Package,
  Radar,
  Store,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../ui';

const GROUPS = [
  {
    label: 'Overview',
    links: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Data collection',
    links: [
      { to: '/admin/scraper', label: 'Live scraper', icon: Radar },
      { to: '/admin/listings', label: 'Store listings', icon: ListChecks },
      { to: '/admin/health', label: 'Scraper health', icon: Activity },
    ],
  },
  {
    label: 'Catalog',
    links: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/stores', label: 'Stores', icon: Store },
      { to: '/admin/price-history', label: 'Price history', icon: History },
      { to: '/admin/deals', label: 'Deals', icon: Tag },
    ],
  },
  {
    label: 'Audience',
    links: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

const TITLES = Object.fromEntries(GROUPS.flatMap((g) => g.links.map((l) => [l.to, l.label])));

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5" onClick={onNavigate}>
        <span className="grid size-8 place-items-center rounded-xl bg-brand-500 text-white">
          <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
            <path d="M6 21l6-6 4 4 9-9" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          <span className="block text-sm font-bold text-white">PriceCompare</span>
          <span className="block text-[11px] text-slate-400">Admin console</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">{g.label}</p>
            <div className="space-y-0.5">
              {g.links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-200">
            {(user?.name || '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user?.name}</span>
            <span className="block truncate text-xs text-slate-400">{user?.email}</span>
          </span>
          <button type="button" onClick={logout} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const title = TITLES[pathname] || 'Admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-900 lg:block">
        <SidebarContent />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-up bg-slate-900">
            <button type="button" onClick={() => setOpen(false)} className="absolute top-5 right-3 p-1 text-slate-400" aria-label="Close menu">
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <h1 className="text-base font-semibold">{title}</h1>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            View site <ExternalLink className="size-3.5" />
          </Link>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
