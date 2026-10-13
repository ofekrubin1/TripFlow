// Data layer: the one place the app talks to the database. Pages call api.entities.Trip.list(),
// api.entities.Expense.create(), etc. (same shape as the Base44 SDK the app was built on), backed by Firestore.
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where,
  writeBatch, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

const now = () => new Date().toISOString();
const toObj = (d) => ({ ...d.data(), id: d.id });

// Base44 sort strings: 'field' ascending, '-field' descending. Sorted client-side to avoid composite indexes.
function sortAndLimit(items, sort, limit) {
  if (sort) {
    const desc = sort.startsWith('-');
    const key = desc ? sort.slice(1) : sort;
    items.sort((a, b) => {
      const x = a[key] ?? '', y = b[key] ?? '';
      return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
    });
  }
  return limit ? items.slice(0, limit) : items;
}

// Firestore batches are capped at 500 writes.
async function inBatches(items, apply) {
  for (let i = 0; i < items.length; i += 450) {
    const batch = writeBatch(db);
    items.slice(i, i + 450).forEach((item) => apply(batch, item));
    await batch.commit();
  }
}

function entity(name) {
  const col = collection(db, name);
  return {
    async list(sort, limit) {
      const snap = await getDocs(col);
      return sortAndLimit(snap.docs.map(toObj), sort, limit);
    },
    async filter(criteria = {}, sort, limit) {
      const clauses = Object.entries(criteria).map(([k, v]) => where(k, '==', v));
      const snap = await getDocs(clauses.length ? query(col, ...clauses) : col);
      return sortAndLimit(snap.docs.map(toObj), sort, limit);
    },
    async get(id) {
      const d = await getDoc(doc(col, id));
      return d.exists() ? toObj(d) : null;
    },
    async create(data) {
      const ts = now();
      const record = { ...data, created_date: ts, updated_date: ts };
      const ref = await addDoc(col, record);
      return { ...record, id: ref.id };
    },
    async bulkCreate(list) {
      const ts = now();
      await inBatches(list, (batch, data) => batch.set(doc(col), { ...data, created_date: ts, updated_date: ts }));
    },
    async update(id, data) {
      await updateDoc(doc(col, id), { ...data, updated_date: now() });
      return { ...data, id };
    },
    async bulkUpdate(changes) {
      const ts = now();
      await inBatches(changes, (batch, { id, data }) => batch.update(doc(col, id), { ...data, updated_date: ts }));
    },
    async delete(id) {
      await deleteDoc(doc(col, id));
    },
    async bulkDelete(ids) {
      await inBatches(ids, (batch, id) => batch.delete(doc(col, id)));
    },
    // Live updates (not in Base44): fires on any change to the collection, including from other devices.
    subscribe(callback) {
      return onSnapshot(col, callback, (err) => console.error(`${name} subscription`, err));
    },
  };
}

// Images are shrunk and stored inline as data URLs (Firebase Storage needs a paid plan; Firestore docs max 1MB).
function compressImage(file, maxSide = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')); };
    img.src = url;
  });
}

export const api = {
  entities: {
    Trip: entity('trips'),
    Expense: entity('expenses'),
    ReminderSettings: entity('reminder_settings'),
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: await compressImage(file) };
      },
    },
  },
};
