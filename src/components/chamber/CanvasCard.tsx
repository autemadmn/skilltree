import { motion, type PanInfo } from "framer-motion";
import { FileText, Link2, NotebookText, Quote, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { KnowledgeDocument } from "../../types/models";

function TypeIcon({ type }: { type: KnowledgeDocument["type"] }) {
  if (type === "pdf") return <FileText size={15} />;
  if (type === "source") return <Link2 size={15} />;
  if (type === "quote") return <Quote size={15} />;
  return <NotebookText size={15} />;
}

export function CanvasCard({
  document,
  position,
  onMove,
  onSelect,
  onDelete,
  selected
}: {
  document: KnowledgeDocument;
  position: { x: number; y: number };
  onMove: (id: string, info: PanInfo) => void;
  onSelect: () => void;
  onDelete: () => void;
  selected: boolean;
}) {
  return (
    <motion.article
      role="button"
      tabIndex={0}
      className={`canvas-card ${selected ? "selected" : ""}`}
      style={{ x: position.x, y: position.y }}
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => onMove(document.id, info)}
      onClick={onSelect}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
    >
      <button
        className="canvas-card-delete"
        title="Eliminar documento"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 size={14} />
      </button>
      <div className="canvas-card-title">
        <TypeIcon type={document.type} />
        <strong>{document.title}</strong>
      </div>
      <p>{document.subtitle ?? document.metadata.summary ?? "Archive object"}</p>
      <div className="tag-row compact">
        {document.tags.slice(0, 2).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </motion.article>
  );
}
