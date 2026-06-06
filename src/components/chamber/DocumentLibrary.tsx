import { useMemo } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument, OrbNode } from "../../types/models";
import { DocumentCard } from "./DocumentCard";
import { EmptyChamberState } from "./EmptyChamberState";

function matchesView(document: KnowledgeDocument, view: string) {
  if (view === "pdfs") return document.type === "pdf";
  if (view === "notes") return document.type === "note" || document.type === "reflection" || document.type === "quote";
  if (view === "favorites") return document.favorite;
  return true;
}

export function DocumentLibrary({ orb }: { orb: OrbNode }) {
  const documents = useKnowledgeStore((state) => state.documents);
  const selectedDocumentId = useKnowledgeStore((state) => state.selectedDocumentId);
  const setSelectedDocument = useKnowledgeStore((state) => state.setSelectedDocument);
  const chamberView = useKnowledgeStore((state) => state.chamberView);
  const chamberSearch = useKnowledgeStore((state) => state.chamberSearch);
  const layout = useKnowledgeStore((state) => state.settings.libraryLayout);

  const filtered = useMemo(() => {
    const query = chamberSearch.trim().toLowerCase();
    return orb.documentIds
      .map((id) => documents[id])
      .filter(Boolean)
      .filter((document) => matchesView(document, chamberView))
      .filter((document) => {
        if (!query) return true;
        return [document.title, document.subtitle ?? "", document.content ?? "", ...document.tags].some((value) =>
          value.toLowerCase().includes(query)
        );
      });
  }, [chamberSearch, chamberView, documents, orb.documentIds]);

  if (filtered.length === 0) return <EmptyChamberState orb={orb} compact />;

  return (
    <section className={`document-library glass-panel ${layout}`}>
      <div className="library-header">
        <div>
          <p className="eyebrow">Library</p>
          <h2>{filtered.length} archive objects</h2>
        </div>
      </div>
      <div className="document-list">
        {filtered.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            selected={selectedDocumentId === document.id}
            layout={layout}
            onSelect={() => setSelectedDocument(document.id)}
          />
        ))}
      </div>
    </section>
  );
}
