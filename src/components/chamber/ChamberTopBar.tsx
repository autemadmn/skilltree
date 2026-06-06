import { FilePlus2, Grid2X2, LayoutList, NotebookPen, Search, Upload } from "lucide-react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";

export function ChamberTopBar({ orb }: { orb: OrbNode }) {
  const chamberSearch = useKnowledgeStore((state) => state.chamberSearch);
  const setChamberSearch = useKnowledgeStore((state) => state.setChamberSearch);
  const createDocumentPlaceholder = useKnowledgeStore((state) => state.createDocumentPlaceholder);
  const createNote = useKnowledgeStore((state) => state.createNote);
  const setChamberView = useKnowledgeStore((state) => state.setChamberView);
  const updateSettings = useKnowledgeStore((state) => state.updateSettings);
  const libraryLayout = useKnowledgeStore((state) => state.settings.libraryLayout);

  return (
    <header className="chamber-topbar glass-panel">
      <div className="chamber-title-block">
        <p className="eyebrow">Archive</p>
        <h2>{orb.title}</h2>
        <span>{orb.description}</span>
      </div>

      <div className="chamber-search">
        <Search size={16} />
        <input value={chamberSearch} onChange={(event) => setChamberSearch(event.target.value)} placeholder="Search chamber" />
      </div>

      <div className="chamber-actions">
        <button className="toolbar-button" onClick={() => createDocumentPlaceholder(orb.id, "pdf")}>
          <Upload size={16} />
          Upload PDF
        </button>
        <button className="toolbar-button primary" onClick={() => createNote(orb.id)}>
          <NotebookPen size={16} />
          New Note
        </button>
        <button className="toolbar-button" onClick={() => createDocumentPlaceholder(orb.id, "source")}>
          <FilePlus2 size={16} />
          Add Source
        </button>
        <div className="segmented-control">
          <button
            className={libraryLayout === "grid" ? "active" : ""}
            onClick={() => {
              updateSettings({ libraryLayout: "grid" });
              setChamberView("library");
            }}
          >
            <Grid2X2 size={15} />
          </button>
          <button
            className={libraryLayout === "list" ? "active" : ""}
            onClick={() => {
              updateSettings({ libraryLayout: "list" });
              setChamberView("library");
            }}
          >
            <LayoutList size={15} />
          </button>
          <button onClick={() => setChamberView("canvas")}>
            <Grid2X2 size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
