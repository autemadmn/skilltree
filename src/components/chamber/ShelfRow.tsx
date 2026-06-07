import type { KnowledgeDocument } from "../../types/models";
import { ShelfBook } from "./ShelfBook";

export function ShelfRow({
  shelf,
  shelfIndex,
  booksPerShelf,
  openingDocumentId,
  onOpenDocument,
  onToggleFavorite
}: {
  shelf: KnowledgeDocument[];
  shelfIndex: number;
  booksPerShelf: number;
  openingDocumentId: string | null;
  onOpenDocument: (document: KnowledgeDocument) => void;
  onToggleFavorite: (document: KnowledgeDocument) => void;
}) {
  return (
    <div className="wooden-shelf">
      <div className="book-row">
        {shelf.map((document, index) => {
          const globalIndex = shelfIndex * booksPerShelf + index;
          return (
            <ShelfBook
              key={document.id}
              document={document}
              index={globalIndex}
              opening={openingDocumentId === document.id}
              onOpen={onOpenDocument}
              onToggleFavorite={onToggleFavorite}
            />
          );
        })}
      </div>
    </div>
  );
}
