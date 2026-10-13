// Minimal Firestore REST access for server-side functions (no SDK needed).
// Uses the public web API key; what it may read/write is governed by firestore.rules.
import { firebaseConfig } from '../../src/api/firebaseConfig.js';

const BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const KEY = firebaseConfig.apiKey;

function decodeValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  return undefined;
}

const decodeFields = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));

function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: String(v) };
}

export async function listCollection(name) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${name}?pageSize=300&key=${KEY}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firestore list ${name}: ${res.status} ${await res.text()}`);
    const body = await res.json();
    for (const d of body.documents || []) docs.push({ ...decodeFields(d.fields || {}), id: d.name.split('/').pop() });
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return docs;
}

// Updates only the given fields of one document.
export async function updateFields(name, id, data) {
  const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fetch(`${BASE}/${name}/${id}?${mask}&key=${KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeValue(v)])) }),
  });
  if (!res.ok) throw new Error(`Firestore update ${name}/${id}: ${res.status} ${await res.text()}`);
}
