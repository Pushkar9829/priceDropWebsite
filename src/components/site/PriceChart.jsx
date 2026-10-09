import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatInr } from '../../lib/format';

// Tuned for the dark shopper theme
const COLORS = ['#2fc97f', '#60a5fa', '#f5b041', '#f472b6', '#a78bfa', '#22d3ee'];

/**
 * Step-style price history: one line per store, carrying each store's last known price forward.
 */
export default function PriceChart({ history = [] }) {
  const { rows, stores } = useMemo(() => {
    const storeNames = [];
    const sorted = [...history].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
    const last = {};
    const out = [];
    for (const h of sorted) {
      const name = h.storeId?.name || 'Store';
      if (!storeNames.includes(name)) storeNames.push(name);
      if (!(h.newPrice > 0)) continue;
      last[name] = h.newPrice;
      out.push({ t: new Date(h.recordedAt).getTime(), ...last });
    }
    // Extend lines to "now" so the latest price is visible as a flat segment
    if (out.length) out.push({ ...out[out.length - 1], t: Date.now() });
    return { rows: out, stores: storeNames };
  }, [history]);

  if (rows.length < 2) return null;

  const fmtDate = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtDate}
            tick={{ fontSize: 12, fill: '#9b9da2' }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            // Keep one decimal on narrow ranges so ticks don't repeat (₹64.5k vs ₹65k)
            tickFormatter={(v) =>
              v >= 1000 ? `₹${Number((v / 1000).toFixed(v % 1000 ? 1 : 0)).toLocaleString('en-IN')}k` : `₹${v}`
            }
            tick={{ fontSize: 12, fill: '#9b9da2' }}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={['auto', 'auto']}
          />
          <Tooltip
            labelFormatter={(t) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            formatter={(v, name) => [formatInr(v), name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #35373b', background: '#232526', color: '#fafafa', fontSize: 13 }}
            labelStyle={{ color: '#b8babe' }}
            cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
          />
          {stores.length > 1 ? <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} /> : null}
          {stores.map((s, i) => (
            <Line
              key={s}
              type="stepAfter"
              dataKey={s}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
