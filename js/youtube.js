// All YouTube Data API requests go through the Netlify Function.
// The API key is never sent to the browser or desktop client.
const YouTubeAPI = (() => {
  class QuotaExhaustedError extends Error {}
  async function request(action, params = {}) {
    const url = new URL('/.netlify/functions/youtube', window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error(body.error || 'Please wait before searching again.');
    if (res.status === 503 && body.code === 'QUOTA_EXHAUSTED') throw new QuotaExhaustedError(body.error);
    if (!res.ok) throw new Error(body.error || `Search service failed (${res.status}).`);
    return body;
  }
  async function search(query) {
    const body = await request('search', { q: query });
    return body.items || [];
  }
  async function fetchPopular(regionCode = 'IN') {
    const body = await request('popular', { region: regionCode });
    return body.items || [];
  }
  return { search, fetchPopular, QuotaExhaustedError };
})();
