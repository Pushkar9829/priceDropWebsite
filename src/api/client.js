const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
const TOKEN_KEY = 'pc_web_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Build ?query= omitting null/undefined/empty values. */
export const toQuery = (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const q = new URLSearchParams(cleaned).toString();
  return q ? `?${q}` : '';
};

/** Normalize list payloads so callers always get { items, ... }. */
export const asList = (data) => {
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pages: 1 };
  if (data && Array.isArray(data.items)) return data;
  return { items: [], total: 0, page: 1, pages: 1, ...(data || {}) };
};

export const apiRequest = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = payload?.code;
    error.details = payload?.details;
    throw error;
  }

  return payload?.data !== undefined ? payload.data : payload;
};

export { API_BASE, TOKEN_KEY };
