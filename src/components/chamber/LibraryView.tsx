import { BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument, OrbNode } from "../../types/models";
import { BookOpenTransition } from "./BookOpenTransition";
import { Bookshelf } from "./Bookshelf";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesSearch(document: KnowledgeDocument, query: string) {
  if (!query) return true;
  return [document.title, document.subtitle ?? "", document.metadata.originalFileName ?? "", ...document.tags]
    .map(normalizeSearch)
    .some((value) => value.includes(query));
}

function getBooksPerShelf() {
  if (typeof window === "undefined") return 10;
  if (window.innerWidth >= 1320) return 10;
  if (window.innerWidth >= 1080) return 8;
  if (window.innerWidth >= 760) return 6;
  return 4;
}

function chunkDocumentsIntoShelves(documents: KnowledgeDocument[], booksPerShelf: number) {
  const minimumShelves = Math.max(3, Math.ceil(documents.length / booksPerShelf));
  return Array.from({ length: minimumShelves }, (_, index) => documents.slice(index * booksPerShelf, (index + 1) * booksPerShelf));
}

export function LibraryView({
  orb,
  documents,
  searchQuery,
  favoritesOnly,
  onOpenDocument,
  onUploadPdf
}: {
  orb: OrbNode;
  documents: KnowledgeDocument[];
  searchQuery: string;
  favoritesOnly: boolean;
  onOpenDocument: (document: KnowledgeDocument) => void;
  onUploadPdf: () => void;
}) {
  const updateDocument = useKnowledgeStore((state) => state.updateDocument);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [booksPerShelf, setBooksPerShelf] = useState(getBooksPerShelf);

  useEffect(() => {
    const handleResize = () => setBooksPerShelf(getBooksPerShelf());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    return documents.filter((document) => matchesSearch(document, query)).filter((document) => !favoritesOnly || document.favorite);
  }, [documents, favoritesOnly, searchQuery]);

  const shelves = useMemo(() => chunkDocumentsIntoShelves(filteredDocuments, booksPerShelf), [booksPerShelf, filteredDocuments]);

  const openBook = (document: KnowledgeDocument) => {
    if (openingDocumentId) return;
    setOpeningDocumentId(document.id);
    window.setTimeout(() => {
      onOpenDocument(document);
      setOpeningDocumentId(null);
    }, 980);
  };

  return (
    <section className="bookshelf-library" aria-label={`${orb.title} library bookshelf`}>
      <div className="bookshelf-haze" />
      <div className="bookshelf-header">
        <div>
          <p className="eyebrow">{favoritesOnly ? "Favorite shelf" : "Living archive"}</p>
          <h2>
            {filteredDocuments.length
              ? `${filteredDocuments.length} libros en la estantería`
              : documents.length
                ? "No hay libros visibles"
                : "Biblioteca física de esta cámara"}
          </h2>
        </div>
        <span>
          <BookOpen size={16} />
          Scroll vertical
        </span>
      </div>

      <Bookshelf
        orb={orb}
        shelves={shelves}
        booksPerShelf={booksPerShelf}
        hasDocuments={documents.length > 0}
        hasVisibleDocuments={filteredDocuments.length > 0}
        openingDocumentId={openingDocumentId}
        onOpenDocument={openBook}
        onToggleFavorite={(document) => updateDocument(document.id, { favorite: !document.favorite })}
        onUploadPdf={onUploadPdf}
      />

      <BookOpenTransition active={Boolean(openingDocumentId)} />
    </section>
  );
}
