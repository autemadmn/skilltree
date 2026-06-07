import type { KnowledgeDocument, OrbNode } from "../../types/models";
import { EmptyShelfState } from "./EmptyShelfState";
import { ShelfRow } from "./ShelfRow";

export function Bookshelf({
  orb,
  shelves,
  booksPerShelf,
  hasDocuments,
  hasVisibleDocuments,
  openingDocumentId,
  onOpenDocument,
  onToggleFavorite,
  onUploadPdf
}: {
  orb: OrbNode;
  shelves: KnowledgeDocument[][];
  booksPerShelf: number;
  hasDocuments: boolean;
  hasVisibleDocuments: boolean;
  openingDocumentId: string | null;
  onOpenDocument: (document: KnowledgeDocument) => void;
  onToggleFavorite: (document: KnowledgeDocument) => void;
  onUploadPdf: () => void;
}) {
  return (
    <div className="wooden-bookcase">
      {shelves.map((shelf, shelfIndex) => (
        <ShelfRow
          key={shelfIndex}
          shelf={shelf}
          shelfIndex={shelfIndex}
          booksPerShelf={booksPerShelf}
          openingDocumentId={openingDocumentId}
          onOpenDocument={onOpenDocument}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
      {!hasDocuments && <EmptyShelfState orb={orb} mode="empty" onUploadPdf={onUploadPdf} />}
      {hasDocuments && !hasVisibleDocuments && <EmptyShelfState orb={orb} mode="no-results" onUploadPdf={onUploadPdf} />}
    </div>
  );
}
