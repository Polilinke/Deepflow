// DeepFlow browser features: local insights, recommendations, sleep timer and theme studio.
// These features use local data and do not call the YouTube Data API.
(() => {
  const $ = (id) => document.getElementById(id);
  let sleepTimeout = null;

  function history() { return Store.getHistory(); }
  function fmtMinutes(ms) { return Math.max(0, Math.round(ms / 60000)); }
  function makeCard(label, value, note) {
    const el = document.createElement('div'); el.className = 'insight-card';
    const small = document.createElement('div'); small.className = 'hint'; small.textContent = label;
    const strong = document.createElement('strong'); strong.textContent = value;
    const p = document.createElement('p'); p.className = 'hint'; p.textContent = note;
    el.append(small, strong, p); return el;
  }
  function trackItem(track, action) {
    const row = document.createElement('div'); row.className = 'feature-track';
    const img = document.createElement('img'); img.src = track.thumbnail || ''; img.alt = '';
    const info = document.createElement('div'); info.className = 'feature-track-info';
    const title = document.createElement('strong'); title.textContent = track.title || 'Unknown track';
    const artist = document.createElement('span'); artist.textContent = track.artist || 'Unknown artist';
    info.append(title, artist);
    const btn = document.createElement('button'); btn.className = 'btn small'; btn.textContent = 'Queue'; btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('deepflow:queue-track', { detail: track })));
    row.append(img, info, btn); return row;
  }
  function renderInsights() {
    const list = history();
    const counts = new Map();
    list.forEach(t => { const key = t.id; const old = counts.get(key) || { track: t, count: 0, last: t.playedAt || 0 }; old.count++; old.last = Math.max(old.last, t.playedAt || 0); counts.set(key, old); });
    const ranked = [...counts.values()].sort((a,b) => b.count-a.count);
    const artists = new Set(list.map(t => t.artist).filter(Boolean));
    const recent = list.filter(t => Date.now() - (t.playedAt || 0) < 7*86400000);
    const stats = $('insightsStats'); stats.replaceChildren(
      makeCard('Tracks played', String(list.length), 'Recorded play starts'),
      makeCard('Different tracks', String(counts.size), 'Unique video IDs'),
      makeCard('Artists explored', String(artists.size), 'Based on available track metadata'),
      makeCard('Last 7 days', String(recent.length), 'Play starts in the past week')
    );
    const top = $('topTracks'); top.replaceChildren();
    if (!ranked.length) top.textContent = 'Play some music and your insights will appear here.';
    ranked.slice(0,8).forEach(x => { const item = trackItem(x.track); item.querySelector('button').textContent = `${x.count} plays`; item.querySelector('button').disabled = true; top.append(item); });
    renderRecommendations();
  }
  function renderRecommendations() {
    const box = $('recommendations'); box.replaceChildren();
    const seed = history()[0] || Store.getLibrary()[0];
    const pool = [...Store.getLibrary(), ...history()].filter(t => t && t.id !== (seed && seed.id));
    const seen = new Set();
    const ranked = pool.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; }).map(t => ({t, score: (seed && t.artist && seed.artist && t.artist.toLowerCase() === seed.artist.toLowerCase() ? 3 : 0) + (seed && t.title && seed.title && t.title.toLowerCase().split(' ').some(w => w.length > 4 && seed.title.toLowerCase().includes(w)) ? 1 : 0)})).sort((a,b)=>b.score-a.score);
    if (!ranked.length) { box.textContent = 'Save or play a few tracks first. Recommendations are generated from your local library and history.'; return; }
    ranked.slice(0,8).forEach(x => box.append(trackItem(x.t)));
  }
  function buildSmartQueue() {
    const seed = history()[0] || Store.getLibrary()[0];
    if (!seed) { alert('Play or save a few songs first.'); return; }
    const pool = [...Store.getLibrary(), ...history()].filter(t => t.id !== seed.id);
    const seen = new Set();
    const candidates = pool.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
    candidates.sort((a,b) => Number((b.artist||'').toLowerCase() === (seed.artist||'').toLowerCase()) - Number((a.artist||'').toLowerCase() === (seed.artist||'').toLowerCase()));
    candidates.slice(0,10).forEach(track => window.dispatchEvent(new CustomEvent('deepflow:queue-track', { detail: track })));
    alert(`Added ${Math.min(10,candidates.length)} locally matched tracks. No YouTube searches were made.`);
  }
  function wrapped() {
    const list = history(); const counts = new Map();
    list.forEach(t => counts.set(t.title, (counts.get(t.title)||0)+1));
    const top = [...counts.entries()].sort((a,b)=>b[1]-a[1])[0];
    const panel = $('wrappedPanel'); panel.classList.remove('hidden'); panel.replaceChildren();
    const h = document.createElement('h3'); h.textContent = 'Your DeepFlow Wrapped';
    const p = document.createElement('p'); p.textContent = list.length ? `You've started ${list.length} plays across ${counts.size} different tracks. Your most-played track is ${top[0]} (${top[1]} plays).` : 'Your story starts when you play your first track.';
    const note = document.createElement('p'); note.className = 'hint'; note.textContent = 'This is based on play starts recorded by this browser, not verified listening duration.';
    panel.append(h,p,note);
  }
  function setAccent(hex) {
    const root = document.documentElement;
    root.style.setProperty('--accent', hex);
    const n = parseInt(hex.slice(1),16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    Store.saveSettings({ customAccent: hex });
  }
  function startSleepTimer() {
    const raw = prompt('Stop playback in how many minutes? Enter 5–240.');
    if (raw === null) return;
    const mins = Number(raw);
    if (!Number.isFinite(mins) || mins < 5 || mins > 240) { alert('Please enter a number between 5 and 240.'); return; }
    clearTimeout(sleepTimeout);
    sleepTimeout = setTimeout(() => window.dispatchEvent(new Event('deepflow:sleep-stop')), mins*60000);
    $('sleepTimerBtn').textContent = `${mins}m left`;
  }
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => btn.addEventListener('click', () => { if (btn.dataset.view === 'insights') renderInsights(); }));
  $('smartQueueBtn').addEventListener('click', buildSmartQueue);
  $('wrappedBtn').addEventListener('click', wrapped);
  $('sleepTimerBtn').addEventListener('click', startSleepTimer);
  $('customAccent').addEventListener('input', e => setAccent(e.target.value));
  $('glassIntensity').addEventListener('input', e => document.documentElement.style.setProperty('--glass-blur', `${Number(e.target.value)}px`));
  window.addEventListener('deepflow:sleep-ended', () => { clearTimeout(sleepTimeout); $('sleepTimerBtn').textContent = 'Sleep'; });
  window.addEventListener('deepflow:sleep-stop', () => { $('sleepTimerBtn').textContent = 'Sleep'; });
  const saved = Store.getSettings().customAccent; if (saved) { $('customAccent').value = saved; setAccent(saved); }
  const intensity = Store.getSettings().glassIntensity || 12; $('glassIntensity').value = intensity;
})();
