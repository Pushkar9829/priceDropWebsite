# PriceCompare — shopper website

Public React app for search, store comparison, watchlists, and price alerts.

## Run

```bash
# Terminal A — backend
cd backend
npm run dev

# Terminal B — website
cd web
npm install
npm run dev
```

Open **http://localhost:5174**

Demo user (from seed): `user@pricecompare.local` / `User@12345`

## Pages

| Path | Purpose |
|------|---------|
| `/` | Brand hero + search |
| `/search?q=` | Product search results |
| `/products/:id` | Comparison, watch, alert |
| `/deals` | Active deals |
| `/watchlist` | Saved products (auth) |
| `/alerts` | Price alerts (auth) |
| `/login`, `/register` | Auth |

API calls proxy to `http://localhost:5000` via Vite (`/api`).
