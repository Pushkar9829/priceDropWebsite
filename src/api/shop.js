import { apiRequest, asList, toQuery } from './client';

export const authApi = {
  register: (body) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
};

export const productApi = {
  search: (q, { page = 1, limit = 20 } = {}) =>
    apiRequest(`/products/search${toQuery({ q, page, limit })}`).then(asList),
  get: (id) => apiRequest(`/products/${id}`),
  comparison: (id) => apiRequest(`/products/${id}/comparison`),
  priceHistory: (id, { storeProductId, days = 90 } = {}) =>
    apiRequest(
      `/products/${id}/price-history${toQuery({ days, storeProductId })}`
    ),
};

export const watchlistApi = {
  list: () => apiRequest('/watchlist').then(asList),
  add: (productId) => apiRequest(`/watchlist/${productId}`, { method: 'POST' }),
  remove: (productId) =>
    apiRequest(`/watchlist/${productId}`, { method: 'DELETE' }),
};

export const alertApi = {
  list: () => apiRequest('/price-alerts').then(asList),
  create: (body) =>
    apiRequest('/price-alerts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    apiRequest(`/price-alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id) => apiRequest(`/price-alerts/${id}`, { method: 'DELETE' }),
};

export const dealApi = {
  list: ({ page = 1, limit = 20 } = {}) =>
    apiRequest(`/deals${toQuery({ page, limit })}`).then(asList),
};

export const brandApi = {
  top: ({ limit = 8, productsPerBrand = 3, minDiscount = 20 } = {}) =>
    apiRequest(
      `/brands/top${toQuery({ limit, productsPerBrand, minDiscount })}`
    ).then(asList),
  categories: ({ limit = 12 } = {}) =>
    apiRequest(`/brands/categories${toQuery({ limit })}`).then((data) => ({
      sections: Array.isArray(data?.sections) ? data.sections : [],
    })),
};

export const notificationApi = {
  list: ({ page = 1, limit = 20 } = {}) =>
    apiRequest(`/notifications${toQuery({ page, limit })}`).then(asList),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
};
