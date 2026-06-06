import { FilePlus2, NotebookPen, Upload } from "lucide-react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";

export function EmptyChamberState({ orb, compact = false }: { orb: OrbNode; compact?: boolean }) {
  const createDocumentPlaceholder = useKnowledgeStore((state) => state.createDocumentPlaceholder);
  const createNote = useKnowledgeStore((state) => state.createNote);

  return (
    <section className={`empty-chamber-state glass-panel ${compact ? "compact" : ""}`}>
      <div className="empty-orb-outline" style={{ borderColor: orb.color, boxShadow: `0 0 42px ${orb.color}55` }}>
        <span style={{ background: orb.color }} />
      </div>
      <p className="eyebrow">{orb.title}</p>
      <h2>This Knowledge Chamber is empty.</h2>
      <p>Begin by adding your first document, note, or source.</p>
      <div className="empty-actions">
        <button className="toolbar-button" onClick={() => createDocumentPlaceholder(orb.id, "pdf")}>
          <Upload size={16} />
          Upload PDF
        </button>
        <button className="toolbar-button primary" onClick={() => createNote(orb.id)}>
          <NotebookPen size={16} />
          Write Note
        </button>
        <button className="toolbar-button" onClick={() => createDocumentPlaceholder(orb.id, "source")}>
          <FilePlus2 size={16} />
          Add Source
        </button>
      </div>
    </section>
  );
}
