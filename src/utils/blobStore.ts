export type StoredBlobKind = "pdf" | "image";

export type StoredBlobRecord = {
  id: string;
  kind: StoredBlobKind;
  blob: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  documentId?: string;
};

const DB_NAME = "neural-skill-tree-blob-store";
const STORE_NAME = "files";

function openBlobDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBlobRecord(record: StoredBlobRecord) {
  const db = await openBlobDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadBlobRecord(id: string) {
  const db = await openBlobDb();
  return new Promise<StoredBlobRecord | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as StoredBlobRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function loadBlobObjectUrl(id: string) {
  const record = await loadBlobRecord(id);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

export async function deleteBlobRecord(id: string) {
  const db = await openBlobDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
