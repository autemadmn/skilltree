import { useEffect, useRef, useState } from "react";
import { useKnowledgeStore } from "../store/useKnowledgeStore";
import type { KnowledgeSnapshot } from "../types/models";

type VaultPhase = "idle" | "connecting" | "saving" | "saved" | "loading" | "error";

export type LocalVaultStatus = {
  supported: boolean;
  connected: boolean;
  directoryName: string | null;
  phase: VaultPhase;
  lastSavedAt: string | null;
  message: string | null;
};

type DirectoryHandle = {
  name: string;
  queryPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandle>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<DirectoryHandle>;
};

type FileHandle = {
  getFile: () => Promise<File>;
  createWritable: () => Promise<WritableFileStream>;
};

type WritableFileStream = {
  write: (data: string | Blob | BufferSource) => Promise<void>;
  close: () => Promise<void>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandle>;
  }
}

const DB_NAME = "neural-skill-tree-vault";
const STORE_NAME = "handles";
const HANDLE_KEY = "directory";
const VAULT_FILE = "skilltree-vault.json";

export type VaultFileReference = {
  vaultPath: string;
  originalFileName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  savedAt: string;
};

const listeners = new Set<(status: LocalVaultStatus) => void>();
let directoryHandle: DirectoryHandle | null = null;
let currentStatus: LocalVaultStatus = {
  supported: typeof window !== "undefined" && "showDirectoryPicker" in window,
  connected: false,
  directoryName: null,
  phase: "idle",
  lastSavedAt: null,
  message: null
};

function emit(patch: Partial<LocalVaultStatus>) {
  currentStatus = { ...currentStatus, ...patch };
  listeners.forEach((listener) => listener(currentStatus));
}

function openVaultDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredHandle() {
  const db = await openVaultDb();
  return new Promise<DirectoryHandle | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(HANDLE_KEY);
    request.onsuccess = () => resolve((request.result as DirectoryHandle | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeStoredHandle(handle: DirectoryHandle | null) {
  const db = await openVaultDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = handle ? store.put(handle, HANDLE_KEY) : store.delete(HANDLE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function ensurePermission(handle: DirectoryHandle) {
  const descriptor = { mode: "readwrite" as const };
  const current = await handle.queryPermission?.(descriptor);
  if (current === "granted") return true;
  const requested = await handle.requestPermission?.(descriptor);
  return requested === "granted";
}

function parseVaultFile(raw: string): KnowledgeSnapshot | null {
  const parsed = JSON.parse(raw) as KnowledgeSnapshot | { snapshot?: KnowledgeSnapshot };
  return "snapshot" in parsed && parsed.snapshot ? parsed.snapshot : (parsed as KnowledgeSnapshot);
}

function sanitizeVaultFileName(name: string) {
  const cleaned = name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return cleaned || "document.pdf";
}

export function subscribeLocalVault(listener: (status: LocalVaultStatus) => void) {
  listeners.add(listener);
  listener(currentStatus);
  return () => {
    listeners.delete(listener);
  };
}

export async function initializeLocalVault() {
  if (!currentStatus.supported) {
    emit({
      connected: false,
      directoryName: null,
      message: "This browser does not support folder-backed local vaults."
    });
    return currentStatus;
  }

  try {
    const stored = await readStoredHandle();
    if (!stored) return currentStatus;
    directoryHandle = stored;
    emit({
      connected: true,
      directoryName: stored.name,
      phase: "idle",
      message: "Vault folder remembered. Use Load or Save when ready."
    });
  } catch (error) {
    emit({
      connected: false,
      directoryName: null,
      phase: "error",
      message: error instanceof Error ? error.message : "Could not restore the local vault folder."
    });
  }

  return currentStatus;
}

export async function connectLocalVault() {
  if (!window.showDirectoryPicker) {
    emit({
      phase: "error",
      message: "Folder-backed vaults need a Chromium browser on localhost."
    });
    return false;
  }

  emit({ phase: "connecting", message: "Choose a folder for the local vault." });
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    const allowed = await ensurePermission(handle);
    if (!allowed) throw new Error("Folder permission was not granted.");
    directoryHandle = handle;
    await writeStoredHandle(handle);
    emit({
      connected: true,
      directoryName: handle.name,
      phase: "idle",
      message: `Connected to ${handle.name}.`
    });
    return true;
  } catch (error) {
    emit({
      phase: "error",
      message: error instanceof Error ? error.message : "Could not connect the local vault."
    });
    return false;
  }
}

export async function disconnectLocalVault() {
  directoryHandle = null;
  await writeStoredHandle(null);
  emit({
    connected: false,
    directoryName: null,
    phase: "idle",
    message: "Local vault disconnected."
  });
}

export async function saveSnapshotToLocalVault(rawSnapshotJson: string, reason = "manual") {
  if (!directoryHandle) {
    emit({ phase: "error", message: "Choose a local vault folder first." });
    return false;
  }

  try {
    const allowed = await ensurePermission(directoryHandle);
    if (!allowed) throw new Error("Folder permission was not granted.");

    emit({ phase: "saving", message: reason === "auto" ? "Autosaving to local vault..." : "Saving to local vault..." });
    const handle = await directoryHandle.getFileHandle(VAULT_FILE, { create: true });
    const writable = await handle.createWritable();
    const savedAt = new Date().toISOString();
    const snapshot = JSON.parse(rawSnapshotJson) as KnowledgeSnapshot;
    await writable.write(
      JSON.stringify(
        {
          app: "neural-skill-tree",
          version: 1,
          savedAt,
          snapshot
        },
        null,
        2
      )
    );
    await writable.close();
    emit({
      phase: "saved",
      lastSavedAt: savedAt,
      message: reason === "auto" ? "Autosaved to local vault." : `Saved ${VAULT_FILE}.`
    });
    return true;
  } catch (error) {
    emit({
      phase: "error",
      message: error instanceof Error ? error.message : "Could not save to local vault."
    });
    return false;
  }
}

export async function saveFileToLocalVault(file: File, folderName = "documents"): Promise<VaultFileReference | null> {
  if (!directoryHandle) {
    emit({ phase: "error", message: "Choose a local vault folder before uploading files." });
    return null;
  }

  try {
    const allowed = await ensurePermission(directoryHandle);
    if (!allowed) throw new Error("Folder permission was not granted.");

    emit({ phase: "saving", message: `Copying ${file.name} into the local vault...` });
    const folder = await directoryHandle.getDirectoryHandle(folderName, { create: true });
    const savedAt = new Date().toISOString();
    const fileName = `${Date.now()}-${sanitizeVaultFileName(file.name)}`;
    const handle = await folder.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();

    const reference = {
      vaultPath: `${folderName}/${fileName}`,
      originalFileName: file.name,
      fileName,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      savedAt
    };

    emit({
      phase: "saved",
      lastSavedAt: savedAt,
      message: `Copied ${file.name} into the local vault.`
    });
    return reference;
  } catch (error) {
    emit({
      phase: "error",
      message: error instanceof Error ? error.message : "Could not copy the file into the local vault."
    });
    return null;
  }
}

export async function loadSnapshotFromLocalVault() {
  if (!directoryHandle) {
    emit({ phase: "error", message: "Choose a local vault folder first." });
    return null;
  }

  try {
    const allowed = await ensurePermission(directoryHandle);
    if (!allowed) throw new Error("Folder permission was not granted.");

    emit({ phase: "loading", message: "Loading local vault..." });
    const handle = await directoryHandle.getFileHandle(VAULT_FILE);
    const file = await handle.getFile();
    const snapshot = parseVaultFile(await file.text());
    if (!snapshot?.orbs || !snapshot.connections || !snapshot.documents || !snapshot.settings) {
      throw new Error(`${VAULT_FILE} is not a valid skill tree vault.`);
    }
    emit({
      phase: "idle",
      message: `Loaded ${VAULT_FILE}.`
    });
    return snapshot;
  } catch (error) {
    emit({
      phase: "error",
      message: error instanceof Error ? error.message : "Could not load from local vault."
    });
    return null;
  }
}

export function useLocalVaultStatus() {
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    return subscribeLocalVault(setStatus);
  }, []);

  return status;
}

export function useLocalVaultActions() {
  const status = useLocalVaultStatus();

  return {
    status,
    connectAndSave: async () => {
      const connected = await connectLocalVault();
      if (!connected) return false;
      return saveSnapshotToLocalVault(useKnowledgeStore.getState().exportSnapshot());
    },
    saveNow: () => saveSnapshotToLocalVault(useKnowledgeStore.getState().exportSnapshot()),
    loadNow: async () => {
      const snapshot = await loadSnapshotFromLocalVault();
      if (!snapshot) return false;
      return useKnowledgeStore.getState().importSnapshot(JSON.stringify(snapshot));
    },
    disconnect: disconnectLocalVault
  };
}

export function LocalVaultAutosave() {
  const status = useLocalVaultStatus();
  const skippedFirstConnectedSave = useRef(false);
  const dataVersion = useKnowledgeStore((state) =>
    JSON.stringify({
      orbs: state.orbs,
      connections: state.connections,
      documents: state.documents,
      activities: state.activities,
      settings: state.settings
    })
  );

  useEffect(() => {
    initializeLocalVault();
  }, []);

  useEffect(() => {
    if (!status.connected) {
      skippedFirstConnectedSave.current = false;
      return undefined;
    }
    if (!skippedFirstConnectedSave.current) {
      skippedFirstConnectedSave.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      saveSnapshotToLocalVault(dataVersion, "auto");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [dataVersion, status.connected]);

  return null;
}
