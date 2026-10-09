// Dev: Vite proxies /api → localhost:5000. Prod: VITE_API_BASE points at the deployed backend.
// Accepts either the full API base (…/api/v1) or just the backend origin — the API prefix
// is appended when missing, so a VITE_API_BASE without /api/v1 can't break every request.
const normalizeBase = (raw) => {
  const base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) return '/api/v1';
  return /\/api\/v\d+$/.test(base) ? base : `${base}/api/v1`;
};
export const API_BASE = normalizeBase(import.meta.env.VITE_API_BASE);
const TOKEN_KEY = 'pc_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

/** Build ?query= omitting null/undefined/empty values. */
export const toQuery = (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
  );
  const q = new URLSearchParams(cleaned).toString();
  return q ? `?${q}` : '';
};

const emptyList = { items: [], total: 0, page: 1, pages: 1 };
/** Normalize list payloads so callers always get { items, total, page, pages }. */
const asList = (data) => {
  if (Array.isArray(data)) return { ...emptyList, items: data, total: data.length };
  if (data && Array.isArray(data.items)) return { ...emptyList, ...data };
  return { ...emptyList, ...(data || {}) };
};

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw Object.assign(new Error('Cannot reach the server. Check your connection.'), { status: 0 });
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw Object.assign(new Error(payload?.message || `Request failed (${response.status})`), {
      status: response.status,
      code: payload?.code,
      details: payload?.details,
    });
  }

  // A 2xx that isn't our JSON envelope (e.g. the SPA's index.html from a wrong API base) is an error
  if (text && (payload === null || payload.success === undefined) && !response.headers.get('content-type')?.includes('json')) {
    throw Object.assign(new Error('Unexpected response from server. Please try again later.'), { status: response.status });
  }
  return payload?.data !== undefined ? payload.data : payload;
}

const get = (path, opts) => request(path, opts);
const post = (path, body = {}) => request(path, { method: 'POST', body });
const patch = (path, body = {}) => request(path, { method: 'PATCH', body });
const del = (path) => request(path, { method: 'DELETE' });

export const authApi = {
  login: (body) => post('/auth/login', body),
  register: (body) => post('/auth/register', body),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  updateMe: (body) => patch('/auth/me', body),
  changePassword: (body) => post('/auth/change-password', body),
};

export const productApi = {
  search: (params = {}, opts) => get(`/products/search${toQuery(params)}`, opts).then(asList),
  categories: () => get('/products/categories').then(asList),
  stores: () => get('/products/stores').then(asList),
  similar: (id) => get(`/products/${id}/similar`).then(asList),
  get: (id) => get(`/products/${id}`),
  comparison: (id) => get(`/products/${id}/comparison`),
  priceHistory: (id, params = {}) => get(`/products/${id}/price-history${toQuery(params)}`),
};

export const dealApi = {
  list: (params = {}) => get(`/deals${toQuery(params)}`).then(asList),
};

export const brandApi = {
  top: (params = {}) => get(`/brands/top${toQuery(params)}`).then(asList),
  categories: (params = {}) =>
    get(`/brands/categories${toQuery(params)}`).then((d) => ({ sections: d?.sections || [], totalBrands: d?.totalBrands || 0 })),
};

export const watchlistApi = {
  list: () => get('/watchlist').then(asList),
  add: (productId) => post(`/watchlist/${productId}`),
  remove: (productId) => del(`/watchlist/${productId}`),
};

export const alertApi = {
  list: () => get('/price-alerts').then(asList),
  create: (body) => post('/price-alerts', body),
  update: (id, body) => patch(`/price-alerts/${id}`, body),
  remove: (id) => del(`/price-alerts/${id}`),
};

/** Fired after read-state changes so the header badge can refresh without a page change. */
export const INBOX_EVENT = 'pc:inbox-changed';
export const notifyInboxChanged = () => window.dispatchEvent(new Event(INBOX_EVENT));

export const notificationApi = {
  list: (params = {}) => get(`/notifications${toQuery(params)}`).then(asList),
  unreadCount: () => get('/notifications/unread-count'),
  markRead: (id) => patch(`/notifications/${id}/read`),
  markAllRead: () => patch('/notifications/read-all'),
};

export const adminApi = {
  dashboard: () => get('/admin/dashboard'),
  users: (params) => get(`/admin/users${toQuery(params)}`).then(asList),
  updateUser: (id, body) => patch(`/admin/users/${id}`, body),
  stores: () => get('/admin/stores').then(asList),
  createStore: (body) => post('/admin/stores', body),
  updateStore: (id, body) => patch(`/admin/stores/${id}`, body),
  products: (params) => get(`/admin/products${toQuery(params)}`).then(asList),
  updateProduct: (id, body) => patch(`/admin/products/${id}`, body),
  storeProducts: (params) => get(`/admin/store-products${toQuery(params)}`).then(asList),
  updateStoreProduct: (id, body) => patch(`/admin/store-products/${id}`, body),
  importStoreProduct: (body) => post('/admin/store-products/import', body),
  scrapeByKeyword: (body) => post('/admin/store-products/scrape-keyword', body),
  refreshAll: () => post('/admin/products/refresh', { forceAll: true }),
  refreshProduct: (productId) => post(`/admin/products/${productId}/refresh`),
  refreshListing: (storeProductId) => post('/admin/products/refresh', { storeProductId }),
  monitoringStatus: () => get('/admin/monitoring/status'),
  runMonitor: () => post('/admin/monitoring/run'),
  jobs: () => get('/admin/jobs').then(asList),
  job: (id) => get(`/admin/jobs/${id}`),
  scraperHealth: () => get('/admin/scraper-health'),
  failedChecks: (params) => get(`/admin/monitoring/failed${toQuery(params)}`).then(asList),
  retryFailed: (limit = 50) => post('/admin/scraper-health/retry', { limit }),
  retryOne: (id) => post(`/admin/scraper-health/${id}/retry`),
  priceHistory: (params) => get(`/admin/price-history${toQuery(params)}`).then(asList),
  notifications: (params) => get(`/admin/notifications${toQuery(params)}`).then(asList),
  deals: (params) => get(`/admin/deals${toQuery(params)}`).then(asList),
  createDeal: (body) => post('/admin/deals', body),
  updateDeal: (id, body) => patch(`/admin/deals/${id}`, body),
};
