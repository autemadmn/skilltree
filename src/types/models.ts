export type Vector3Tuple = [number, number, number];

export type AppMode = "skill-tree" | "orb-interior" | "knowledge-chamber";

export type OrbType =
  | "core"
  | "section"
  | "concept"
  | "question"
  | "project"
  | "archive"
  | "person"
  | "practice";

export type OrbStatus = "active" | "exploring" | "favorite" | "empty" | "archived";

export interface OrbNode {
  id: string;
  title: string;
  description: string;
  parentId: string | null;
  childrenIds: string[];
  relatedIds: string[];
  sectionId: string;
  color: string;
  position: Vector3Tuple;
  type: OrbType;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  documentIds: string[];
  noteIds: string[];
  status: OrbStatus;
  importance: number;
}

export type ConnectionType = "parent-child" | "related" | "reference";

export interface OrbConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  strength: number;
  color: string;
  label?: string;
}

export type DocumentType = "pdf" | "note" | "quote" | "source" | "reflection";

export interface KnowledgeDocument {
  id: string;
  orbId: string;
  title: string;
  type: DocumentType;
  subtitle?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  content?: string;
  fileUrl?: string;
  metadata: {
    pages?: number;
    readingTime?: string;
    author?: string;
    source?: string;
    summary?: string;
    originalFileName?: string;
    vaultPath?: string;
    fileSize?: number;
    mimeType?: string;
    savedAt?: string;
  };
  favorite: boolean;
  relatedOrbIds: string[];
  relatedDocumentIds: string[];
}

export interface NoteDocument extends KnowledgeDocument {
  type: "note" | "quote" | "reflection";
  content: string;
}

export interface PDFDocument extends KnowledgeDocument {
  type: "pdf";
  fileUrl?: string;
  metadata: KnowledgeDocument["metadata"] & {
    pages: number;
  };
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface RelatedConcept {
  id: string;
  orbId: string;
  targetOrbId: string;
  relationship: string;
  strength: number;
}

export interface ActivityItem {
  id: string;
  orbId: string;
  documentId?: string;
  action: string;
  createdAt: string;
}

export interface UserSettings {
  bloomIntensity: number;
  reducedMotion: boolean;
  autoFocusOnSelect: boolean;
  showLabels: "minimal" | "sections" | "all";
  libraryLayout: "grid" | "list";
}

export interface KnowledgeSnapshot {
  orbs: Record<string, OrbNode>;
  connections: OrbConnection[];
  documents: Record<string, KnowledgeDocument>;
  activities: ActivityItem[];
  settings: UserSettings;
}

export interface AddOrbInput {
  title: string;
  description: string;
  tags: string[];
  parentId: string;
  createAsSection: boolean;
  color: string;
  inheritParentColor: boolean;
  type: OrbType;
  favorite: boolean;
  importance: number;
  relatedIds: string[];
}
