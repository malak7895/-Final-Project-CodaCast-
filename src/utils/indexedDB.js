// IndexedDB helper for storing product images (frontend‑only, no backend)
// Uses a single object store "velora-images" with key = string identifier
// identifier format: `${productId}|${colorName}|${viewKey}` (e.g. "women-1|Noir Black|front")
// Returns a Blob URL that can be used as the src attribute of an <img>

export const DB_NAME = 'velora-db';
export const DB_VERSION = 1;
export const STORE_NAME = 'velora-images';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImage(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(blob, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getImageUrl(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => {
      const blob = request.result;
      if (!blob) return resolve(null);
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteImage(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
