import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Web config is public by design; access is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBRap8eW9x7jx6bGN4SFlo-AXFdZekz5Lg',
  authDomain: 'tripflow-db.firebaseapp.com',
  projectId: 'tripflow-db',
  storageBucket: 'tripflow-db.firebasestorage.app',
  messagingSenderId: '693961305812',
  appId: '1:693961305812:web:ab8752605baa9e4cef9541',
  measurementId: 'G-J6QY8JBM64',
};

export const app = initializeApp(firebaseConfig);

// Offline cache so the app opens and shows data without signal (e.g. on a plane).
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
