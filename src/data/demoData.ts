import { SECTION_COLORS } from "../utils/colors";
import type { KnowledgeSnapshot, OrbNode, UserSettings } from "../types/models";

function timestamp() {
  return new Date().toISOString();
}

const settings: UserSettings = {
  bloomIntensity: 0,
  reducedMotion: true,
  autoFocusOnSelect: true,
  showLabels: "minimal",
  libraryLayout: "grid"
};

function createNode(input: Partial<OrbNode> & Pick<OrbNode, "id" | "title" | "description" | "color" | "position" | "type">): OrbNode {
  const createdAt = timestamp();

  return {
    parentId: null,
    childrenIds: [],
    relatedIds: [],
    sectionId: input.id,
    tags: [],
    favorite: false,
    createdAt,
    updatedAt: createdAt,
    documentIds: [],
    noteIds: [],
    status: "empty",
    importance: 3,
    ...input
  };
}

export function createDemoData(): KnowledgeSnapshot {
  const core = createNode({
    id: "curiosity-core",
    title: "Curiosity Core",
    description:
      "A blank personal universe. Add the first orb when a curiosity, project, question, source, or learning path deserves its own place.",
    color: SECTION_COLORS.core,
    position: [0, 0, 0],
    type: "core",
    sectionId: "curiosity-core",
    tags: ["core", "blank", "personal"],
    favorite: true,
    importance: 5,
    status: "active"
  });

  return {
    orbs: {
      [core.id]: core
    },
    connections: [],
    documents: {},
    activities: [],
    settings
  };
}

export const demoData = createDemoData();
