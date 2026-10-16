import { createContext, useContext, useEffect, useState } from 'react';
import { siteApi } from '../lib/api';
import { setCuelinksCid } from '../lib/affiliate';

/**
 * Admin-controlled site settings, loaded once per visit: which sections are on (coupons,
 * stores, travel), the Cuelinks channel for buy links, and the travel search widgets.
 * Until the request returns (or if it fails) everything stays on, so links keep earning.
 */
const DEFAULT = {
  loaded: false,
  sections: { offers: true, stores: true, travel: true },
  cuelinksCid: '',
  travel: { marker: '', flightsWidgetSrc: '', hotelsWidgetSrc: '', originCities: [], fares: false },
};

const SiteConfigContext = createContext(DEFAULT);

export function SiteConfigProvider({ children }) {
  const [cfg, setCfg] = useState(DEFAULT);
  useEffect(() => {
    let cancelled = false;
    siteApi
      .config()
      .then((d) => {
        if (cancelled || !d) return;
        if (d.cuelinksCid !== undefined) setCuelinksCid(d.cuelinksCid);
        setCfg({ ...DEFAULT, ...d, sections: { ...DEFAULT.sections, ...(d.sections || {}) }, travel: { ...DEFAULT.travel, ...(d.travel || {}) }, loaded: true });
      })
      .catch(() => !cancelled && setCfg((c) => ({ ...c, loaded: true })));
    return () => {
      cancelled = true;
    };
  }, []);
  return <SiteConfigContext.Provider value={cfg}>{children}</SiteConfigContext.Provider>;
}

export const useSiteConfig = () => useContext(SiteConfigContext);
