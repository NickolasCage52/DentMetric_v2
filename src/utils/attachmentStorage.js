/**
 * IndexedDB-адаптер для хранения вложений (фото) к записям истории.
 * Ключи: dm_attach_{recordId}_dent{dentIndex}_{timestamp}
 */
const DB_NAME = 'dm_attachments';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Сохранить вложение (Blob/File).
 * @param {string} key - ключ (например dm_attach_xxx_dent0_1234567890)
 * @param {Blob|File} blob - данные
 * @returns {Promise<string>} ключ
 */
export async function saveAttachment(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => resolve(key);
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Получить вложение по ключу.
 * @param {string} key
 * @returns {Promise<Blob|null>}
 */
export async function getAttachment(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Удалить вложение.
 * @param {string} key
 */
export async function deleteAttachment(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Сгенерировать ключ вложения.
 * @param {string} recordId
 * @param {number} dentIndex
 * @returns {string}
 */
export function generateAttachmentKey(recordId, dentIndex) {
  return `dm_attach_${recordId}_dent${dentIndex}_${Date.now()}`;
}
