import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export const app = initializeApp(firebaseConfig);

// Offline cache so the app opens and shows data without signal (e.g. on a plane).
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
