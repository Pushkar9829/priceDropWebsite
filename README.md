# PriceCompare — Frontend

One React + Vite + Tailwind CSS v4 app for both the **shopper site** and the **admin console**
(replaces the old separate `web/` and `admin/` apps).

| Area | Routes |
|------|--------|
| Public | `/`, `/search`, `/products/:id`, `/deals`, `/login`, `/register` |
| Signed-in | `/watchlist`, `/alerts`, `/notifications`, `/account` |
| Admin (role `ADMIN`) | `/admin`, `/admin/scraper`, `/admin/listings`, `/admin/health`, `/admin/products`, `/admin/stores`, `/admin/price-history`, `/admin/deals`, `/admin/users`, `/admin/notifications` |

The admin console is code-split, so shoppers never download it. Admins land on `/admin` after signing in.

## Develop

```bash
cd backend && npm run dev        # API on :5000
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api → :5000)
```

## Build / deploy

```bash
npm run build   # → dist/
```

Set `VITE_API_BASE` (see `.env.production`) to the deployed API, e.g. `https://pricedropbackend.onrender.com/api/v1`,
and add the site's origin to the backend `CORS_ORIGIN`. SPA fallbacks are included for Netlify (`public/_redirects`)
and Vercel (`vercel.json`).

> `package.json` pins `rollup` to 4.62.3 via `overrides`: on this machine Windows Application Control blocks the
> newer native Rollup binary. Remove the override if your environment allows newer versions.
