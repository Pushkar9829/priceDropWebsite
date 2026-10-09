import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Laptop,
  LogOut,
  Menu,
  Shirt,
  Sofa,
  Sparkle,
  Tag,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INBOX_EVENT, notificationApi } from '../../lib/api';
import { Button, cx } from '../ui';
import SearchBox from './SearchBox';

export function Logo({ className }) {
  return (
    <Link to="/" className={cx('inline-flex items-center gap-2 text-lg font-bold tracking-tight', className)} aria-label="PriceCompare home">
      <span className="grid size-8 place-items-center rounded-full bg-[#2fda76] text-[#0f1a14]">
        <svg viewBox="0 0 32 32" className="size-4.5" aria-hidden>
          <path d="M6 11l7 7 4-4 9 9" stroke="currentColor" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-slate-900">
        price<span className="text-[#2fda76]">compare</span>
      </span>
    </Link>
  );
}

/** Centre pills — "All" plus the main shopping verticals (category filters on search). */
const NAV = [
  { to: '/search', label: 'All', icon: Sparkle, match: (l) => l.pathname === '/search' && !l.search.includes('category=') },
  { to: '/deals', label: 'Deals', icon: Tag, match: (l) => l.pathname === '/deals' },
  { to: '/search?category=Electronics', label: 'Tech', icon: Laptop, match: (l) => l.search.includes('category=Electronics') },
  { to: '/search?category=Fashion', label: 'Fashion', icon: Shirt, match: (l) => l.search.includes('category=Fashion') },
  { to: '/search?category=Home', label: 'Home', icon: Sofa, match: (l) => l.search.includes('category=Home') },
];
const USER_NAV = [
  { to: '/watchlist', label: 'Watchlist', icon: Heart },
  { to: '/alerts', label: 'Price alerts', icon: BellRing },
];

function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100';
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full py-1 pr-2 pl-1 transition hover:bg-slate-100"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {(user?.name || '?').slice(0, 1).toUpperCase()}
        </span>
        <ChevronDown className="size-4 text-slate-500" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 animate-fade-up rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-slate-200" />
          {isAdmin ? (
            <Link to="/admin" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" /> Admin console
            </Link>
          ) : null}
          {USER_NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={item} onClick={() => setOpen(false)}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
          <Link to="/account" className={item} onClick={() => setOpen(false)}>
            <User className="size-4" /> Account
          </Link>
          <div className="my-1 h-px bg-slate-200" />
          <button
            type="button"
            className={cx(item, 'text-rose-600 hover:bg-rose-50')}
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/');
            }}
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function SiteLayout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return undefined;
    }
    let cancelled = false;
    const load = () =>
      notificationApi
        .unreadCount()
        .then((d) => !cancelled && setUnread(d?.count || 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    window.addEventListener(INBOX_EVENT, load);
    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener(INBOX_EVENT, load);
    };
  }, [isAuthenticated, location.pathname]);

  const isHome = location.pathname === '/';
  const iconBtn = 'relative grid size-10 place-items-center rounded-full text-[#fafafa]/60 transition-colors hover:bg-[#fafafa]/5 hover:text-[#fafafa]';

  return (
    <div className="theme-dark flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#181a1b]/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-3">
          <Logo />

          <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon, match }) => {
              const active = match(location);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={() => cx('dn-chip', active && 'active')}
                >
                  <Icon className="size-3.5" />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {!isHome ? (
              <div className="hidden w-64 lg:block">
                <SearchBox />
              </div>
            ) : null}
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className={iconBtn} aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
                  <Bell className="size-5" />
                  {unread ? (
                    <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-[#fff]">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </Link>
                <Link to="/watchlist" className={cx(iconBtn, 'hidden sm:grid')} aria-label="Watchlist">
                  <Heart className="size-5" />
                </Link>
                <div className="hidden md:block">
                  <UserMenu />
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Button variant="ghost" to="/login" className="rounded-full">
                  Sign in
                </Button>
                <Button to="/register" className="rounded-full">
                  Join free
                </Button>
              </div>
            )}
            <button
              type="button"
              className={cx(iconBtn, 'md:hidden')}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {!isHome ? (
          <div className="container-page pb-3 lg:hidden">
            <SearchBox />
          </div>
        ) : null}
        {mobileOpen ? (
          <div className="border-t border-white/5 md:hidden">
            <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dn-row">
                  <Icon className="size-4" /> {label}
                </NavLink>
              ))}
              <div className="my-1 h-px bg-slate-200" />
              {isAuthenticated ? (
                <>
                  {USER_NAV.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dn-row">
                      <Icon className="size-4" /> {label}
                    </NavLink>
                  ))}
                  <NavLink to="/account" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dn-row">
                    <User className="size-4" /> Account
                  </NavLink>
                  {isAdmin ? (
                    <NavLink to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dn-row">
                      <LayoutDashboard className="size-4" /> Admin console
                    </NavLink>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </>
              ) : (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Button variant="secondary" to="/login">
                    Sign in
                  </Button>
                  <Button to="/register">Join free</Button>
                </div>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <div key={location.pathname} className="dn-page">
          <Outlet />
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Real price drops across Amazon, Flipkart, Croma and more — compared side by side so you never overpay.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/deals" className="dn-link">Price drops</Link></li>
              <li><Link to="/search?sort=newest" className="dn-link">New arrivals</Link></li>
              <li><Link to="/search" className="dn-link">All products</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Categories</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {['Electronics', 'Fashion', 'Beauty', 'Home'].map((c) => (
                <li key={c}>
                  <Link to={`/search?category=${encodeURIComponent(c)}`} className="dn-link">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Your account</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/watchlist" className="dn-link">Watchlist</Link></li>
              <li><Link to="/alerts" className="dn-link">Price alerts</Link></li>
              <li><Link to="/account" className="dn-link">Settings</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5">
          <p className="container-page py-5 text-xs text-slate-500">
            © {new Date().getFullYear()} PriceCompare. Prices are collected periodically and may differ from the store.
          </p>
        </div>
      </footer>
    </div>
  );
}
