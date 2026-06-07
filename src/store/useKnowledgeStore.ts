import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createDemoData } from "../data/demoData";
import { generateChildPosition, generateMainSectionPosition, slugify } from "../utils/geometry";
import { DEFAULT_NAVIGATION_SENSITIVITY } from "../utils/navigationSensitivity";
import type {
  ActivityItem,
  AddOrbInput,
  AppMode,
  DocumentType,
  KnowledgeDocument,
  KnowledgeSnapshot,
  OrbConnection,
  OrbNode,
  UserSettings,
  VisualAttachment
} from "../types/models";

export type ChamberView = "library" | "canvas";

type UploadedPdfInput = {
  originalFileName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  savedAt: string;
  blobId?: string;
  vaultPath?: string;
};

interface KnowledgeState extends KnowledgeSnapshot {
  appMode: AppMode;
  selectedOrbId: string;
  hoveredOrbId: string | null;
  focusedOrbId: string | null;
  cameraRequestVersion: number;
  highlightedOrbIds: string[];
  recentOrbId: string | null;
  addOrbOpen: boolean;
  addOrbParentId: string | null;
  settingsOpen: boolean;
  searchTerm: string;
  chamberView: ChamberView;
  chamberSearch: string;
  selectedDocumentId: string | null;
  fullScreenReader: boolean;
  setMode: (mode: AppMode) => void;
  selectOrb: (id: string) => void;
  hoverOrb: (id: string | null) => void;
  focusOrb: (id: string | null) => void;
  resetCamera: () => void;
  openInterior: (id?: string) => void;
  openKnowledgeChamber: (id?: string) => void;
  returnToSkillTree: () => void;
  setAddOrbOpen: (open: boolean, parentId?: string | null) => void;
  addOrb: (input: AddOrbInput) => string;
  updateOrb: (id: string, patch: Partial<OrbNode>) => void;
  addRelatedConnection: (sourceId: string, targetId: string, label?: string) => void;
  deleteOrb: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setSettingsOpen: (open: boolean) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setChamberView: (view: ChamberView) => void;
  setChamberSearch: (term: string) => void;
  setSelectedDocument: (id: string | null) => void;
  setFullScreenReader: (enabled: boolean) => void;
  createDocumentPlaceholder: (orbId: string, type: Exclude<DocumentType, "note" | "reflection" | "quote">) => string;
  createUploadedPdf: (orbId: string, file: UploadedPdfInput) => string;
  createNote: (orbId: string) => string;
  updateDocument: (id: string, patch: Partial<KnowledgeDocument>) => void;
  deleteDocument: (id: string) => void;
  addDocumentVisualAttachment: (documentId: string, attachment: Omit<VisualAttachment, "documentId" | "createdAt">) => void;
  updateDocumentVisualAttachment: (documentId: string, attachmentId: string, patch: Partial<Pick<VisualAttachment, "title" | "description">>) => void;
  deleteDocumentVisualAttachment: (documentId: string, attachmentId: string) => void;
  resetDemoData: () => void;
  exportSnapshot: () => string;
  importSnapshot: (rawJson: string) => boolean;
}

function now() {
  return new Date().toISOString();
}

function uniqueId(baseTitle: string, existing: Record<string, unknown>) {
  const base = slugify(baseTitle) || "untitled";
  let id = base;
  let index = 2;
  while (existing[id]) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function createConnection(source: OrbNode, target: OrbNode, type: OrbConnection["type"], label?: string): OrbConnection {
  return {
    id: `${type}-${source.id}-${target.id}-${Date.now()}`,
    sourceId: source.id,
    targetId: target.id,
    type,
    strength: type === "parent-child" ? 1 : 0.44,
    color: target.color || source.color,
    label
  };
}

function normalizeSettings(settings: Partial<UserSettings> | undefined): UserSettings {
  return {
    bloomIntensity: settings?.bloomIntensity ?? 0,
    reducedMotion: settings?.reducedMotion ?? true,
    autoFocusOnSelect: settings?.autoFocusOnSelect ?? true,
    showLabels: settings?.showLabels ?? "minimal",
    libraryLayout: settings?.libraryLayout ?? "grid",
    navigationMoveSensitivity: settings?.navigationMoveSensitivity ?? DEFAULT_NAVIGATION_SENSITIVITY,
    navigationRotateSensitivity: settings?.navigationRotateSensitivity ?? DEFAULT_NAVIGATION_SENSITIVITY,
    navigationZoomSensitivity: settings?.navigationZoomSensitivity ?? DEFAULT_NAVIGATION_SENSITIVITY
  };
}

function getRecursiveOrbIds(orbs: Record<string, OrbNode>, rootId: string) {
  const ids = new Set<string>();
  const walk = (id: string) => {
    const node = orbs[id];
    if (!node || ids.has(id)) return;
    ids.add(id);
    node.childrenIds.forEach(walk);
  };
  walk(rootId);
  return ids;
}

function withBaseUi(snapshot: KnowledgeSnapshot): Omit<KnowledgeState, keyof KnowledgeSnapshot | "setMode" | "selectOrb" | "hoverOrb" | "focusOrb" | "resetCamera" | "openInterior" | "openKnowledgeChamber" | "returnToSkillTree" | "setAddOrbOpen" | "addOrb" | "updateOrb" | "addRelatedConnection" | "deleteOrb" | "setSearchTerm" | "setSettingsOpen" | "updateSettings" | "setChamberView" | "setChamberSearch" | "setSelectedDocument" | "setFullScreenReader" | "createDocumentPlaceholder" | "createUploadedPdf" | "createNote" | "updateDocument" | "deleteDocument" | "addDocumentVisualAttachment" | "updateDocumentVisualAttachment" | "deleteDocumentVisualAttachment" | "resetDemoData" | "exportSnapshot" | "importSnapshot"> {
  return {
    appMode: "skill-tree",
    selectedOrbId: "curiosity-core",
    hoveredOrbId: null,
    focusedOrbId: null,
    cameraRequestVersion: 0,
    highlightedOrbIds: [],
    recentOrbId: null,
    addOrbOpen: false,
    addOrbParentId: null,
    settingsOpen: false,
    searchTerm: "",
    chamberView: "library",
    chamberSearch: "",
    selectedDocumentId: Object.values(snapshot.documents)[0]?.id ?? null,
    fullScreenReader: false
  };
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => {
      const initial = createDemoData();

      return {
        ...initial,
        ...withBaseUi(initial),
        setMode: (mode) => set({ appMode: mode }),
        selectOrb: (id) =>
          set((state) => ({
            selectedOrbId: id,
            focusedOrbId: state.settings.autoFocusOnSelect ? id : state.focusedOrbId,
            cameraRequestVersion: state.settings.autoFocusOnSelect ? state.cameraRequestVersion + 1 : state.cameraRequestVersion
          })),
        hoverOrb: (id) => set({ hoveredOrbId: id }),
        focusOrb: (id) =>
          set((state) => ({
            selectedOrbId: id ?? state.selectedOrbId,
            focusedOrbId: id,
            cameraRequestVersion: state.cameraRequestVersion + 1
          })),
        resetCamera: () =>
          set((state) => ({
            focusedOrbId: null,
            cameraRequestVersion: state.cameraRequestVersion + 1,
            highlightedOrbIds: []
          })),
        openInterior: (id) =>
          set((state) => ({
            selectedOrbId: id ?? state.selectedOrbId,
            appMode: "orb-interior"
          })),
        openKnowledgeChamber: (id) =>
          set((state) => {
            const selectedOrbId = id ?? state.selectedOrbId;
            const firstDoc = state.orbs[selectedOrbId]?.documentIds[0] ?? null;
            return {
              selectedOrbId,
              selectedDocumentId: firstDoc,
              appMode: "knowledge-chamber",
              chamberView: "library",
              fullScreenReader: false
            };
          }),
        returnToSkillTree: () =>
          set((state) => ({
            appMode: "skill-tree",
            fullScreenReader: false,
            focusedOrbId: state.selectedOrbId,
            cameraRequestVersion: state.cameraRequestVersion + 1
          })),
        setAddOrbOpen: (open, parentId = null) =>
          set((state) => ({
            addOrbOpen: open,
            addOrbParentId: parentId ?? (open ? state.selectedOrbId : null)
          })),
        addOrb: (input) => {
          const state = get();
          const orbs = { ...state.orbs };
          const connections = [...state.connections];
          const parentId = input.createAsSection ? "curiosity-core" : input.parentId;
          const parent = orbs[parentId] ?? orbs["curiosity-core"];
          const id = uniqueId(input.title, orbs);
          const siblingCount = parent.childrenIds.length + 1;
          const mainSectionCount = Object.values(orbs).filter((orb) => orb.type === "section").length + 1;
          const color = input.inheritParentColor && !input.createAsSection ? parent.color : input.color || parent.color;
          const isSection = input.createAsSection || parent.id === "curiosity-core";
          const node: OrbNode = {
            id,
            title: input.title.trim() || "Untitled Orb",
            description: input.description.trim() || "A new chamber waiting for documents, notes, sources, quotes, and links.",
            parentId: parent.id,
            childrenIds: [],
            relatedIds: [...new Set(input.relatedIds.filter(Boolean))],
            sectionId: isSection ? id : parent.sectionId,
            color,
            position: isSection
              ? generateMainSectionPosition(mainSectionCount - 1, mainSectionCount)
              : generateChildPosition(parent, siblingCount - 1, siblingCount, parent.type !== "section"),
            type: isSection ? "section" : input.type,
            tags: input.tags,
            favorite: input.favorite,
            createdAt: now(),
            updatedAt: now(),
            documentIds: [],
            noteIds: [],
            status: "empty",
            importance: input.importance
          };

          orbs[id] = node;
          orbs[parent.id] = {
            ...parent,
            childrenIds: [...new Set([...parent.childrenIds, id])],
            updatedAt: now()
          };
          connections.push(createConnection(orbs[parent.id], node, "parent-child"));

          node.relatedIds.forEach((relatedId) => {
            const related = orbs[relatedId];
            if (!related) return;
            orbs[relatedId] = {
              ...related,
              relatedIds: [...new Set([...related.relatedIds, id])],
              updatedAt: now()
            };
            connections.push(createConnection(node, related, "related", "related"));
          });

          const activity: ActivityItem = {
            id: `activity-${Date.now()}`,
            orbId: id,
            action: "Created orb",
            createdAt: now()
          };

          set({
            orbs,
            connections,
            activities: [activity, ...state.activities],
            selectedOrbId: id,
            focusedOrbId: id,
            cameraRequestVersion: state.cameraRequestVersion + 1,
            addOrbOpen: false,
            addOrbParentId: null,
            recentOrbId: id
          });

          window.setTimeout(() => {
            if (get().recentOrbId === id) set({ recentOrbId: null });
          }, 2600);

          return id;
        },
        updateOrb: (id, patch) =>
          set((state) => {
            const orb = state.orbs[id];
            if (!orb) return state;
            const updated = { ...orb, ...patch, updatedAt: now() };
            return {
              orbs: { ...state.orbs, [id]: updated },
              connections: state.connections.map((connection) =>
                connection.sourceId === id || connection.targetId === id
                  ? { ...connection, color: connection.targetId === id ? updated.color : connection.color }
                  : connection
              )
            };
          }),
        addRelatedConnection: (sourceId, targetId, label = "related") =>
          set((state) => {
            if (sourceId === targetId) return state;
            const source = state.orbs[sourceId];
            const target = state.orbs[targetId];
            if (!source || !target) return state;
            const exists = state.connections.some(
              (connection) =>
                connection.type === "related" &&
                ((connection.sourceId === sourceId && connection.targetId === targetId) ||
                  (connection.sourceId === targetId && connection.targetId === sourceId))
            );
            if (exists) return state;

            return {
              orbs: {
                ...state.orbs,
                [sourceId]: {
                  ...source,
                  relatedIds: [...new Set([...source.relatedIds, targetId])],
                  updatedAt: now()
                },
                [targetId]: {
                  ...target,
                  relatedIds: [...new Set([...target.relatedIds, sourceId])],
                  updatedAt: now()
                }
              },
              connections: [...state.connections, createConnection(source, target, "related", label)]
            };
          }),
        deleteOrb: (id) =>
          set((state) => {
            if (id === "curiosity-core" || !state.orbs[id]) return state;
            const deleteIds = getRecursiveOrbIds(state.orbs, id);
            const orbs = { ...state.orbs };
            deleteIds.forEach((deleteId) => delete orbs[deleteId]);
            Object.values(orbs).forEach((orb) => {
              orb.childrenIds = orb.childrenIds.filter((childId) => !deleteIds.has(childId));
              orb.relatedIds = orb.relatedIds.filter((relatedId) => !deleteIds.has(relatedId));
            });
            const documents = { ...state.documents };
            Object.values(documents).forEach((document) => {
              if (deleteIds.has(document.orbId)) delete documents[document.id];
            });

            return {
              orbs,
              documents,
              connections: state.connections.filter(
                (connection) => !deleteIds.has(connection.sourceId) && !deleteIds.has(connection.targetId)
              ),
              selectedOrbId: "curiosity-core",
              focusedOrbId: "curiosity-core",
              cameraRequestVersion: state.cameraRequestVersion + 1
            };
          }),
        setSearchTerm: (term) =>
          set((state) => {
            const normalized = term.trim().toLowerCase();
            const highlightedOrbIds =
              normalized.length < 2
                ? []
                : Object.values(state.orbs)
                    .filter((orb) =>
                      [orb.title, orb.description, ...orb.tags].some((value) => value.toLowerCase().includes(normalized))
                    )
                    .map((orb) => orb.id);
            return { searchTerm: term, highlightedOrbIds };
          }),
        setSettingsOpen: (open) => set({ settingsOpen: open }),
        updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
        setChamberView: (view) => set({ chamberView: view, fullScreenReader: false }),
        setChamberSearch: (term) => set({ chamberSearch: term }),
        setSelectedDocument: (id) => set({ selectedDocumentId: id }),
        setFullScreenReader: (enabled) => set({ fullScreenReader: enabled }),
        createDocumentPlaceholder: (orbId, type) => {
          const state = get();
          const orbs = { ...state.orbs };
          const documents = { ...state.documents };
          const orb = orbs[orbId];
          if (!orb) return "";
          const id = uniqueId(`${orb.title}-${type}-${Date.now()}`, documents);
          const document: KnowledgeDocument = {
            id,
            orbId,
            title: type === "pdf" ? `${orb.title} Source.pdf` : `${orb.title} Source Card`,
            type,
            subtitle: type === "pdf" ? "PDF placeholder ready for a real file" : "Source notes and citation trail",
            tags: [orb.title.toLowerCase(), type],
            createdAt: now(),
            updatedAt: now(),
            thumbnail: type.toUpperCase(),
            content: type === "source" ? "Source reference, summary, useful excerpts, and reliability notes." : undefined,
            fileUrl: "",
            metadata: type === "pdf" ? { pages: 1, readingTime: "5 min" } : { source: "New source", readingTime: "3 min" },
            favorite: false,
            relatedOrbIds: [orbId],
            relatedDocumentIds: []
          };
          documents[id] = document;
          orbs[orbId] = {
            ...orb,
            documentIds: [...orb.documentIds, id],
            updatedAt: now(),
            status: "active"
          };
          set({
            orbs,
            documents,
            selectedDocumentId: id,
            chamberView: "library",
            activities: [
              { id: `activity-${Date.now()}`, orbId, documentId: id, action: `Created ${type}`, createdAt: now() },
              ...state.activities
            ]
          });
          return id;
        },
        createUploadedPdf: (orbId, file) => {
          const state = get();
          const orbs = { ...state.orbs };
          const documents = { ...state.documents };
          const orb = orbs[orbId];
          if (!orb) return "";
          const title = file.originalFileName.replace(/\.[^.]+$/, "") || `${orb.title} PDF`;
          const id = uniqueId(`${title}-${Date.now()}`, documents);
          const document: KnowledgeDocument = {
            id,
            orbId,
            title,
            type: "pdf",
            subtitle: file.vaultPath ? "Stored in the portable local vault" : "Stored locally in this browser",
            tags: [orb.title.toLowerCase(), "pdf"],
            createdAt: now(),
            updatedAt: now(),
            thumbnail: "PDF",
            fileUrl: file.vaultPath ? `vault://${file.vaultPath}` : file.blobId ? `indexeddb://${file.blobId}` : "",
            metadata: {
              pages: 1,
              readingTime: "Ready to read",
              summary: file.vaultPath
                ? "This PDF has been copied into the selected local vault folder."
                : "This PDF is stored in the app's local browser file store.",
              originalFileName: file.originalFileName,
              blobId: file.blobId,
              vaultPath: file.vaultPath,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
              savedAt: file.savedAt
            },
            favorite: false,
            relatedOrbIds: [orbId],
            relatedDocumentIds: []
          };
          documents[id] = document;
          orbs[orbId] = {
            ...orb,
            documentIds: [...orb.documentIds, id],
            updatedAt: now(),
            status: "active"
          };
          set({
            orbs,
            documents,
            selectedDocumentId: id,
            chamberView: "library",
            activities: [
              { id: `activity-${Date.now()}`, orbId, documentId: id, action: "Uploaded PDF to vault", createdAt: now() },
              ...state.activities
            ]
          });
          return id;
        },
        createNote: (orbId) => {
          const state = get();
          const orbs = { ...state.orbs };
          const documents = { ...state.documents };
          const orb = orbs[orbId];
          if (!orb) return "";
          const id = uniqueId(`${orb.title}-note-${Date.now()}`, documents);
          const document: KnowledgeDocument = {
            id,
            orbId,
            title: `New ${orb.title} Note`,
            type: "note",
            subtitle: "Untitled thought sequence",
            tags: [orb.title.toLowerCase()],
            createdAt: now(),
            updatedAt: now(),
            thumbnail: "Note",
            content:
              "Start writing here.\n\nAdd quotes, definitions, questions, personal reflections, source references, and conceptual links as this chamber grows.",
            metadata: { readingTime: "1 min", summary: "New note" },
            favorite: false,
            relatedOrbIds: [orbId],
            relatedDocumentIds: []
          };
          documents[id] = document;
          orbs[orbId] = {
            ...orb,
            documentIds: [...orb.documentIds, id],
            noteIds: [...orb.noteIds, id],
            updatedAt: now(),
            status: "active"
          };
          set({
            orbs,
            documents,
            selectedDocumentId: id,
            chamberView: "library",
            activities: [
              { id: `activity-${Date.now()}`, orbId, documentId: id, action: "Created note", createdAt: now() },
              ...state.activities
            ]
          });
          return id;
        },
        updateDocument: (id, patch) =>
          set((state) => {
            const document = state.documents[id];
            if (!document) return state;
            return {
              documents: {
                ...state.documents,
                [id]: { ...document, ...patch, updatedAt: now() }
              }
            };
          }),
        deleteDocument: (id) =>
          set((state) => {
            const document = state.documents[id];
            if (!document) return state;
            const documents = { ...state.documents };
            delete documents[id];
            Object.keys(documents).forEach((documentId) => {
              const current = documents[documentId];
              documents[documentId] = {
                ...current,
                relatedDocumentIds: current.relatedDocumentIds.filter((relatedId) => relatedId !== id),
                updatedAt: current.relatedDocumentIds.includes(id) ? now() : current.updatedAt
              };
            });

            const orb = state.orbs[document.orbId];
            const orbs = orb
              ? {
                  ...state.orbs,
                  [document.orbId]: {
                    ...orb,
                    documentIds: orb.documentIds.filter((documentId) => documentId !== id),
                    noteIds: orb.noteIds.filter((documentId) => documentId !== id),
                    updatedAt: now(),
                    status: orb.documentIds.length <= 1 ? "empty" : orb.status
                  }
                }
              : state.orbs;
            const nextSelected = state.selectedDocumentId === id ? orbs[document.orbId]?.documentIds.find((documentId) => documentId !== id) ?? null : state.selectedDocumentId;

            return {
              documents,
              orbs,
              selectedDocumentId: nextSelected,
              activities: [
                { id: `activity-${Date.now()}`, orbId: document.orbId, documentId: id, action: "Deleted document", createdAt: now() },
                ...state.activities
              ]
            };
          }),
        addDocumentVisualAttachment: (documentId, attachment) =>
          set((state) => {
            const document = state.documents[documentId];
            if (!document) return state;
            const visualAttachments = [
              ...(document.visualAttachments ?? []),
              {
                ...attachment,
                documentId,
                createdAt: now()
              }
            ];
            return {
              documents: {
                ...state.documents,
                [documentId]: {
                  ...document,
                  visualAttachments,
                  updatedAt: now()
                }
              }
            };
          }),
        updateDocumentVisualAttachment: (documentId, attachmentId, patch) =>
          set((state) => {
            const document = state.documents[documentId];
            if (!document) return state;
            return {
              documents: {
                ...state.documents,
                [documentId]: {
                  ...document,
                  visualAttachments: (document.visualAttachments ?? []).map((attachment) =>
                    attachment.id === attachmentId ? { ...attachment, ...patch } : attachment
                  ),
                  updatedAt: now()
                }
              }
            };
          }),
        deleteDocumentVisualAttachment: (documentId, attachmentId) =>
          set((state) => {
            const document = state.documents[documentId];
            if (!document) return state;
            return {
              documents: {
                ...state.documents,
                [documentId]: {
                  ...document,
                  visualAttachments: (document.visualAttachments ?? []).filter((attachment) => attachment.id !== attachmentId),
                  updatedAt: now()
                }
              }
            };
          }),
        resetDemoData: () => {
          const initial = createDemoData();
          set({ ...initial, ...withBaseUi(initial) });
        },
        exportSnapshot: () => {
          const state = get();
          return JSON.stringify(
            {
              orbs: state.orbs,
              connections: state.connections,
              documents: state.documents,
              activities: state.activities,
              settings: normalizeSettings(state.settings)
            },
            null,
            2
          );
        },
        importSnapshot: (rawJson) => {
          try {
            const parsed = JSON.parse(rawJson) as Partial<KnowledgeSnapshot>;
            if (!parsed.orbs || !parsed.connections || !parsed.documents || !parsed.settings) return false;
            set({
              orbs: parsed.orbs,
              connections: parsed.connections,
              documents: parsed.documents,
              activities: parsed.activities ?? [],
              settings: normalizeSettings(parsed.settings),
              selectedOrbId: "curiosity-core",
              focusedOrbId: null,
              cameraRequestVersion: get().cameraRequestVersion + 1,
              appMode: "skill-tree"
            });
            return true;
          } catch {
            return false;
          }
        }
      };
    },
    {
      name: "neural-skill-tree-state-empty-v2",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<KnowledgeState> | undefined;
        return {
          ...current,
          ...persistedState,
          chamberView: persistedState?.chamberView === "canvas" ? "canvas" : "library",
          settings: normalizeSettings(persistedState?.settings)
        };
      },
      partialize: (state) => ({
        orbs: state.orbs,
        connections: state.connections,
        documents: state.documents,
        activities: state.activities,
        settings: state.settings
      })
    }
  )
);
