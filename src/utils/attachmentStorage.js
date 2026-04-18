/**
 * IndexedDB-адаптер для хранения вложений (фото) к записям истории.
 * AUDIT: OK — saveAttachment, getAttachment, deleteAttachment; ключи dm_attach_{recordId}_dent{dentIndex}_{timestamp}
 */
const DB_NAME = 'dm_attachments';
const STORE_NAME = 'files';
const ANNOTATED_STORE = 'annotated_photos';
const DB_VERSION = 2;

/** Один открытый коннект на вкладку — не открываем IDB заново на каждое вложение. */
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        const oldVersion = e.oldVersion;
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(ANNOTATED_STORE)) {
            db.createObjectStore(ANNOTATED_STORE, { keyPath: 'recordId' });
          }
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => {
        dbPromise = null;
        reject(e.target.error);
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });
  return dbPromise;
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

/**
 * Ключ для скриншота матрицы (размещение вмятин).
 * @param {string} recordId
 * @returns {string}
 */
export function generateMatrixAttachmentKey(recordId) {
  return `dm_matrix_${recordId || 'draft'}_${Date.now()}`;
}

/**
 * Save annotated photo (base64 dataUrl) to IDB.
 * @param {string} recordId
 * @param {string} dataUrl
 * @returns {Promise<string>} recordId
 */
export function saveAnnotatedPhoto(recordId, dataUrl) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(ANNOTATED_STORE, 'readwrite');
        const store = tx.objectStore(ANNOTATED_STORE);
        let blob;
        try {
          const parts = String(dataUrl).split(',');
          const header = parts[0] || '';
          const base64 = parts[1] || '';
          const mimeMatch = header.match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: mime });
        } catch (_convErr) {
          blob = dataUrl;
        }
        const req = store.put({ recordId, blob, savedAt: Date.now() });
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => resolve(recordId);
        tx.onerror = () => reject(tx.error);
      })
      .catch(reject);
  });
}

/**
 * Get annotated photo from IDB as data URL string.
 * @param {string} recordId
 * @returns {Promise<string|null>}
 */
export function getAnnotatedPhoto(recordId) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(ANNOTATED_STORE, 'readonly');
        const store = tx.objectStore(ANNOTATED_STORE);
        const req = store.get(recordId);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const entry = req.result;
          if (!entry) {
            resolve(null);
            return;
          }
          if (entry.blob instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(entry.blob);
          } else {
            resolve(entry.blob || null);
          }
        };
      })
      .catch(() => resolve(null));
  });
}

/**
 * Delete annotated photo from IDB.
 * @param {string} recordId
 * @returns {Promise<void>}
 */
export function deleteAnnotatedPhoto(recordId) {
  return new Promise((resolve) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(ANNOTATED_STORE, 'readwrite');
        const store = tx.objectStore(ANNOTATED_STORE);
        const req = store.delete(recordId);
        req.onerror = () => resolve();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      })
      .catch(() => resolve());
  });
}
