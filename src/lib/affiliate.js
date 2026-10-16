// Outbound store links → Cuelinks tracking links.
// The Cuelinks page script only wires up <a> tags present when it loads, so links this SPA
// renders later would go out untracked. We build the same tracking URL ourselves instead
// (format as returned by the Cuelinks API for this channel).
// Channel id: set at runtime from Admin → Affiliate settings (/site-config); env/default until then
let CUELINKS_CID = import.meta.env.VITE_CUELINKS_CID || '279120';
export const setCuelinksCid = (cid) => {
  CUELINKS_CID = cid ? String(cid) : '';
};
const ALREADY_TRACKED = /(^|\.)(linksredirect\.com|clnk\.in)$/i;

/**
 * Where a "buy" link should point: an explicit affiliate URL set by an admin wins,
 * otherwise the store URL wrapped in a Cuelinks redirect. `subid` tags the click's origin
 * (e.g. "product_cta") so earnings can be split by placement in the Cuelinks reports.
 */
export function outboundUrl(listing, subid) {
  if (!listing) return null;
  if (listing.affiliateUrl) return listing.affiliateUrl;
  const url = listing.productUrl;
  if (!url) return null;
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return url;
  }
  if (ALREADY_TRACKED.test(host) || !CUELINKS_CID) return url;
  const sub = subid ? `&subid=${encodeURIComponent(subid)}` : '';
  return `https://linksredirect.com/?cid=${CUELINKS_CID}${sub}&source=js&url=${encodeURIComponent(url)}`;
}
