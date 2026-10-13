import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Web config is public by design; access is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBrH0gWu3Tj7_b_zVbubUYc6gWJ8Nrllpk',
  authDomain: 'tripflow-2026.firebaseapp.com',
  projectId: 'tripflow-2026',
  storageBucket: 'tripflow-2026.firebasestorage.app',
  messagingSenderId: '415618161771',
  appId: '1:415618161771:web:f074a5198421d72e3f652e',
};

export const app = initializeApp(firebaseConfig);

// Offline cache so the app opens and shows data without signal (e.g. on a plane).
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
