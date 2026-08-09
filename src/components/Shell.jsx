import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { notificationApi } from '../api/shop';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/search', label: 'All', end: false },
  { to: '/search?q=food', label: 'Food' },
  { to: '/search?q=travel', label: 'Travel' },
  { to: '/deals', label: 'Deals' },
  { to: '/search?q=laptop', label: 'Tech' },
];

export default function Shell() {
  const { isAuthenticated, user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    notificationApi
      .list({ limit: 50 })
      .then((data) => {
        if (cancelled) return;
        const count = (data.items || []).filter((n) => n.status !== 'READ').length;
        setUnread(count);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const onSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="site-atmosphere flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-black/85 backdrop-blur-xl">
        <div className="container flex min-h-16 min-w-0 flex-wrap items-center gap-3 py-2 sm:gap-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight"
            aria-label="PriceCompare home"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-teal text-black">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 8l4 4 4-6 4 8 4-4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              price<span className="text-teal">compare</span>
            </span>
          </Link>

          <nav
            className="order-3 flex w-full min-w-0 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain sm:order-none sm:mx-auto sm:w-auto sm:max-w-none sm:flex-wrap sm:justify-center"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `dn-pill shrink-0 ${isActive ? 'dn-pill--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <>
                <NavLink
                  to="/watchlist"
                  className={({ isActive }) =>
                    `dn-pill shrink-0 ${isActive ? 'dn-pill--active' : ''}`
                  }
                >
                  Watchlist
                </NavLink>
                <NavLink
                  to="/alerts"
                  className={({ isActive }) =>
                    `dn-pill shrink-0 ${isActive ? 'dn-pill--active' : ''}`
                  }
                >
                  Alerts
                </NavLink>
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    `dn-pill shrink-0 ${isActive ? 'dn-pill--active' : ''}`
                  }
                >
                  Inbox
                  {unread > 0 ? (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[0.65rem] font-bold text-black">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </NavLink>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form className="dn-search hidden max-w-[200px] md:flex" onSubmit={onSearch} role="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-muted" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                className="dn-search__input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search deals..."
                aria-label="Search deals"
              />
            </form>
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-ink-muted lg:inline">
                  {user?.name?.split(' ')[0]}
                </span>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.main>

      <footer className="mt-auto border-t border-line py-10">
        <div className="container flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <strong className="font-display text-lg font-bold tracking-tight">
              price<span className="text-teal">compare</span>
            </strong>
            <p className="muted mt-1 max-w-sm text-sm">
              Compare once across stores. Grab the drop when it hits.
            </p>
          </div>
          <span className="text-sm text-ink-faint">Live price drops · India</span>
        </div>
      </footer>
    </div>
  );
}
