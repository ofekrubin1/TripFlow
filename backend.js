/* Provides the claude.use('db' | 'assets' | 'downloads') API the app expects, backed by Firebase.
   db = Firestore (shared by every allowed account), gated behind Google sign-in. Access is enforced by firestore.rules. */
(() => {
  'use strict';
  const firebaseConfig = {
    apiKey: 'AIzaSyBRap8eW9x7jx6bGN4SFlo-AXFdZekz5Lg',
    authDomain: 'tripflow-db.firebaseapp.com',
    projectId: 'tripflow-db',
    storageBucket: 'tripflow-db.firebasestorage.app',
    messagingSenderId: '693961305812',
    appId: '1:693961305812:web:ab8752605baa9e4cef9541',
    measurementId: 'G-J6QY8JBM64'
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth(), fs = firebase.firestore();
  fs.settings({ignoreUndefinedProperties: true});
  fs.enablePersistence({synchronizeTabs: true}).catch(() => {}); // offline cache; fails harmlessly in private mode

  /* ---------- sign-in gate ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn = (g, label) => `<button data-g="${g}" style="width:100%;padding:12px 20px;border-radius:12px;border:1px solid rgba(201,164,91,.3);background:#0A1F44;color:#fff;font:500 14px inherit;cursor:pointer">${label}</button>`;
  let gate;
  const showGate = (msg, action, err) => {
    if (!gate) {
      gate = document.createElement('div');
      gate.dir = 'rtl'; gate.lang = 'he';
      gate.style.cssText = 'position:fixed;inset:0;z-index:3000;background:#F3F3F4;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,-apple-system,Arial,sans-serif';
      gate.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) (b.dataset.g === 'in' ? signIn : signOut)(); });
      document.body.appendChild(gate);
    }
    gate.innerHTML = `<div style="background:#fff;border-radius:18px;padding:32px 24px;max-width:22rem;width:100%;text-align:center;box-shadow:0 8px 24px rgba(10,31,68,.1)"><h1 style="margin:0 0 6px;font-size:22px;font-weight:600;color:#0A1F44">TripFlow</h1><p style="margin:0 0 24px;font-size:14px;color:#50535A;line-height:1.6">${msg}</p>${action}${err ? `<p style="margin:12px 0 0;font-size:12px;color:#c0392b">${esc(err)}</p>` : ''}</div>`;
    gate.hidden = false;
  };
  const askSignIn = err => showGate('התחבר עם חשבון Google כדי לגשת לטיולים שלך.', btn('in', 'התחברות עם Google'), err);

  async function signIn() {
    const p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({prompt: 'select_account'});
    try { await auth.signInWithPopup(p); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-environment'].includes(e.code)) return auth.signInWithRedirect(p);
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) askSignIn('ההתחברות נכשלה: ' + (e.code || e.message));
    }
  }
  const signOut = () => auth.signOut().then(() => location.reload());

  let resolveDb;
  const dbReady = new Promise(r => { resolveDb = r; });
  auth.onAuthStateChanged(async user => {
    if (!user) return askSignIn();
    try { await fs.doc('settings/reminder').get(); }
    catch (e) { if (e.code === 'permission-denied') return showGate(`לחשבון <span dir="ltr">${esc(user.email)}</span> אין הרשאת גישה לנתונים.`, btn('out', 'התחבר עם חשבון אחר')); }
    if (gate) gate.hidden = true;
    resolveDb(fs);
  });

  /* ---------- assets: images are shrunk and stored inline in the expense doc (Firestore docs max 1MB) ---------- */
  const shrink = file => new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1024 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Bad image')); };
    img.src = url;
  });
  const assets = {async upload(file) { return {id: Date.now().toString(36), url: await shrink(file)}; }};

  /* ---------- downloads: plain browser download ---------- */
  const downloads = {
    async save({filename, data: blob}) {
      const a = document.createElement('a'), u = URL.createObjectURL(blob);
      a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    }
  };

  const caps = {assets, downloads};
  window.claude = {use: name => name === 'db' ? dbReady : Promise.resolve(caps[name] || null)};
  window.tripflowAuth = {email: () => auth.currentUser && auth.currentUser.email, signOut};
})();
