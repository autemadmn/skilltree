import { FileText, Link2, NotebookText, Quote, Star } from "lucide-react";
import type { KnowledgeDocument } from "../../types/models";
import { formatDate } from "../../utils/geometry";

type DocumentCardProps = {
  document: KnowledgeDocument;
  selected: boolean;
  layout: "grid" | "list";
  onSelect: () => void;
};

function TypeIcon({ type }: { type: KnowledgeDocument["type"] }) {
  if (type === "pdf") return <FileText size={15} />;
  if (type === "source") return <Link2 size={15} />;
  if (type === "quote") return <Quote size={15} />;
  return <NotebookText size={15} />;
}

export function DocumentCard({ document, selected, layout, onSelect }: DocumentCardProps) {
  return (
    <button className={`document-card ${selected ? "selected" : ""} ${layout}`} onClick={onSelect}>
      <div className="document-thumb">
        <span>{document.thumbnail ?? document.type}</span>
        {document.favorite && <Star size={14} />}
      </div>
      <div className="document-card-body">
        <div className="document-card-title">
          <TypeIcon type={document.type} />
          <h3>{document.title}</h3>
        </div>
        <p>{document.subtitle ?? document.metadata.summary ?? "Archive document"}</p>
        <div className="tag-row compact">
          {document.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="document-meta-row">
          <span>{formatDate(document.createdAt)}</span>
          <span>{document.metadata.pages ? `${document.metadata.pages} pages` : document.metadata.readingTime ?? "Document"}</span>
        </div>
      </div>
    </button>
  );
}
