/* Provides the claude.use('db' | 'assets' | 'downloads') API the app expects, backed by Firebase Firestore.
   No login, like the original Base44 app: everyone with the link shares the same data. Access is set in firestore.rules. */
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
  const fs = firebase.firestore();
  fs.settings({ignoreUndefinedProperties: true, merge: true});
  fs.enablePersistence({synchronizeTabs: true}).catch(() => {}); // offline cache; fails harmlessly in private mode

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

  const caps = {db: fs, assets, downloads};
  window.claude = {use: async name => caps[name] || null};
})();
