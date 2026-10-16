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
import { About, AffiliateDisclosure, Privacy, Terms } from './pages/site/Legal';
import { Offers, StorePage, Stores } from './pages/site/Offers';
import Travel from './pages/site/Travel';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';

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
const AffiliateSettings = lazy(() => import('./pages/admin/Affiliate').then((m) => ({ default: m.AffiliateSettings })));
const PartnerStores = lazy(() => import('./pages/admin/Affiliate').then((m) => ({ default: m.PartnerStores })));
const AffiliateOffers = lazy(() => import('./pages/admin/Affiliate').then((m) => ({ default: m.AffiliateOffers })));

/** A page that exists only while its section is switched on in Admin → Affiliate settings. */
function Section({ name, children }) {
  const { sections } = useSiteConfig();
  return sections[name] === false ? <NotFound /> : children;
}

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
          <SiteConfigProvider>
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
                <Route path="offers" element={<Section name="offers"><Offers /></Section>} />
                <Route path="stores" element={<Section name="stores"><Stores /></Section>} />
                <Route path="stores/:slug" element={<Section name="stores"><StorePage /></Section>} />
                <Route path="travel" element={<Section name="travel"><Travel /></Section>} />
                <Route element={<RequireAuth />}>
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="account" element={<Account />} />
                </Route>
                <Route path="about" element={<About />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="affiliate-disclosure" element={<AffiliateDisclosure />} />
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
                  <Route path="affiliate" element={<AffiliateSettings />} />
                  <Route path="partner-stores" element={<PartnerStores />} />
                  <Route path="offers" element={<AffiliateOffers />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
          </RoutedBoundary>
          </SiteConfigProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
