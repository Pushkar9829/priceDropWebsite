import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RequireAdmin, RequireAuth } from './components/Guards';
import { Spinner } from './components/ui';
import ErrorBoundary from './components/ErrorBoundary';
import SiteLayout from './components/site/SiteLayout';
import Home from './pages/site/Home';
import Search from './pages/site/Search';
import Product from './pages/site/Product';
import Deals from './pages/site/Deals';
import Brand from './pages/site/Brand';
import Watchlist from './pages/site/Watchlist';
import Alerts from './pages/site/Alerts';
import Notifications from './pages/site/Notifications';
import Account from './pages/site/Account';
import { Login, Register } from './pages/site/Auth';
import NotFound from './pages/site/NotFound';

// Admin console is code-split so shoppers never download it
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Scraper = lazy(() => import('./pages/admin/Scraper'));
const Listings = lazy(() => import('./pages/admin/Listings'));
const Health = lazy(() => import('./pages/admin/Health'));
const AdminProducts = lazy(() => import('./pages/admin/Catalog').then((m) => ({ default: m.Products })));
const AdminStores = lazy(() => import('./pages/admin/Catalog').then((m) => ({ default: m.Stores })));
const AdminHistory = lazy(() => import('./pages/admin/Records').then((m) => ({ default: m.PriceHistory })));
const AdminDeals = lazy(() => import('./pages/admin/Records').then((m) => ({ default: m.Deals })));
const AdminUsers = lazy(() => import('./pages/admin/Records').then((m) => ({ default: m.Users })));
const AdminNotifications = lazy(() => import('./pages/admin/Records').then((m) => ({ default: m.Notifications })));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Links to a section (#alert) scroll themselves once the page has rendered
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** Error boundary that resets when the route changes. */
function RoutedBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

const Loading = (
  <div className="grid min-h-[60vh] place-items-center">
    <Spinner className="size-7" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ScrollToTop />
          <RoutedBoundary>
          <Suspense fallback={Loading}>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />

              <Route element={<SiteLayout />}>
                <Route index element={<Home />} />
                <Route path="search" element={<Search />} />
                <Route path="products/:id" element={<Product />} />
                <Route path="deals" element={<Deals />} />
                <Route path="brands/:name" element={<Brand />} />
                <Route element={<RequireAuth />}>
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="account" element={<Account />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="admin" element={<RequireAdmin />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="scraper" element={<Scraper />} />
                  <Route path="listings" element={<Listings />} />
                  <Route path="health" element={<Health />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="stores" element={<AdminStores />} />
                  <Route path="price-history" element={<AdminHistory />} />
                  <Route path="deals" element={<AdminDeals />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
          </RoutedBoundary>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
