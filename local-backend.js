/* Stand-in for the Claude artifact runtime (db, assets, downloads) so the app runs on any static host.
   Data lives in this browser's localStorage, so it is per-device. Skipped when the real runtime exists. */
(() => {
  'use strict';
  if (window.claude && window.claude.use) return;

  const KEY = 'tripflow:db';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let data = load();
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => fn());
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { data = load(); const e = new Error('Storage full'); e.code = 'resource_exhausted'; throw e; }
    queueMicrotask(notify);
  };
  window.addEventListener('storage', e => { if (e.key === KEY) { data = load(); notify(); } });

  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const newId = () => crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2);
  const watch = (fn, err) => { const run = () => { try { fn(); } catch (e) { err && err(e); } }; listeners.add(run); queueMicrotask(run); return () => listeners.delete(run); };
  const snap = (col, id) => { const v = data[col] && data[col][id]; return {id, exists: !!v, data: () => clone(v)}; };

  /* ---------- db: the Firestore-like subset the app uses ---------- */
  const docRef = (col, id) => ({
    id,
    async set(v) { (data[col] ||= {})[id] = clone(v); persist(); },
    async update(v) { const c = data[col] || {}; if (!c[id]) { const e = new Error('Not found'); e.code = 'not_found'; throw e; } c[id] = {...c[id], ...clone(v)}; persist(); },
    async delete() { if (data[col]) delete data[col][id]; persist(); },
    async get() { return snap(col, id); },
    onSnapshot(fn, err) { return watch(() => fn(snap(col, id)), err); }
  });
  const collection = (col, n = Infinity) => ({
    doc: id => docRef(col, id || newId()),
    limit: k => collection(col, k),
    onSnapshot(fn, err) { return watch(() => fn({docs: Object.keys(data[col] || {}).slice(0, n).map(id => snap(col, id))}), err); }
  });
  const db = {collection, doc: path => { const [col, id] = path.split('/'); return docRef(col, id); }};

  /* ---------- assets: images are shrunk and kept inline as data URLs ---------- */
  const shrink = file => new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Bad image')); };
    img.src = url;
  });
  const assets = {async upload(file) { return {id: newId(), url: await shrink(file)}; }};

  /* ---------- downloads: plain browser download ---------- */
  const downloads = {
    async save({filename, data: blob}) {
      const a = document.createElement('a'), u = URL.createObjectURL(blob);
      a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    }
  };

  const caps = {db, assets, downloads};
  window.claude = {use: async name => caps[name] || null};
})();
