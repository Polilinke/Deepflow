const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Per-instance guardrail. For a public launch, add persistent shared rate limiting
// (e.g. a database/Redis/Netlify Blobs) because serverless instances can restart.
const recentRequests = new Map();
const dailyRequests = new Map();
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();

function json(statusCode, body) {
  return { statusCode, headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }, body: JSON.stringify(body) };
}
function pacificDay() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
}
function clientKey(event) {
  return event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}
function decodeHtml(value='') {
  return value.replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'")
    .replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function mapItems(items=[]) {
  return items.map(item => ({
    id: item.id?.videoId || item.id,
    title: decodeHtml(item.snippet?.title || ''),
    artist: decodeHtml(item.snippet?.channelTitle || ''),
    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ''
  }));
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return json(500, { error: 'Search service is not configured.' });
  const params = event.queryStringParameters || {};
  const action = params.action;
  const ip = clientKey(event);
  const now = Date.now();
  const dayKey = `${pacificDay()}:${ip}`;
  const last = recentRequests.get(ip) || 0;
  if (now - last < 5000) return json(429, { error: 'Please wait 5 seconds before another fresh search.' });
  const count = dailyRequests.get(dayKey) || 0;
  if (count >= 30) return json(429, { error: 'Daily search limit reached for this connection. Try again tomorrow.' });

  const cacheKey = action === 'search'
    ? `s:${String(params.q || '').trim().toLowerCase()}`
    : `p:${String(params.region || 'IN').toUpperCase()}`;
  if (cache.has(cacheKey) && now - cache.get(cacheKey).time < CACHE_MS) {
    return json(200, cache.get(cacheKey).body);
  }
  let url;
  if (action === 'search') {
    const q = String(params.q || '').trim().slice(0, 100);
    if (q.length < 3) return json(400, { error: 'Search must be at least 3 characters.' });
    url = new URL(SEARCH_URL);
    Object.entries({ part:'snippet', type:'video', videoCategoryId:'10', maxResults:'20', q, key })
      .forEach(([k,v]) => url.searchParams.set(k,v));
  } else if (action === 'popular') {
    const region = /^[A-Z]{2}$/.test(String(params.region || '').toUpperCase()) ? String(params.region).toUpperCase() : 'IN';
    url = new URL(VIDEOS_URL);
    Object.entries({ part:'snippet', chart:'mostPopular', videoCategoryId:'10', regionCode:region, maxResults:'20', key })
      .forEach(([k,v]) => url.searchParams.set(k,v));
  } else return json(400, { error: 'Unknown search action.' });

  recentRequests.set(ip, now);
  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const reason = data?.error?.errors?.[0]?.reason || '';
      if (upstream.status === 403 && /quota/i.test(reason + (data?.error?.message || ''))) {
        return json(503, { code: 'QUOTA_EXHAUSTED', error: 'DeepFlow search has reached its shared daily YouTube quota.' });
      }
      return json(upstream.status, { error: data?.error?.message || 'YouTube search failed.' });
    }
    const body = { items: mapItems(data.items) };
    cache.set(cacheKey, { time: now, body });
    dailyRequests.set(dayKey, count + (action === 'search' ? 1 : 0));
    return json(200, body);
  } catch {
    return json(502, { error: 'Could not reach the search provider.' });
  }
};
