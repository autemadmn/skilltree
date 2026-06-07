import { motion } from "framer-motion";
import { BookOpen, FileText, Heart, Image, Link2, NotebookText, Star } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useMemo, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument, OrbNode } from "../../types/models";
import { EmptyChamberState } from "./EmptyChamberState";

const bookPalette = ["#6c3927", "#8b4d2d", "#a45f2c", "#4f2d31", "#7b3f25", "#935d31", "#5d3428", "#b26d2c"];

function TypeIcon({ document }: { document: KnowledgeDocument }) {
  if (document.type === "pdf") return <FileText size={15} />;
  if (document.type === "source") return <Link2 size={15} />;
  if (document.visualAttachments?.length) return <Image size={15} />;
  return <NotebookText size={15} />;
}

function getBookColor(document: KnowledgeDocument, index: number) {
  if (document.favorite) return "#c17b2d";
  if (document.type === "pdf") return bookPalette[index % bookPalette.length];
  if (document.type === "note" || document.type === "reflection") return "#6b4532";
  if (document.type === "source") return "#7f4b2b";
  return bookPalette[(index + 3) % bookPalette.length];
}

export function BookshelfLibrary({
  orb,
  documents,
  favoritesOnly,
  onOpenDocument
}: {
  orb: OrbNode;
  documents: KnowledgeDocument[];
  favoritesOnly: boolean;
  onOpenDocument: (document: KnowledgeDocument) => void;
}) {
  const chamberSearch = useKnowledgeStore((state) => state.chamberSearch);
  const updateDocument = useKnowledgeStore((state) => state.updateDocument);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = chamberSearch.trim().toLowerCase();
    return documents.filter((document) => {
      if (favoritesOnly && !document.favorite) return false;
      if (!query) return true;
      return [document.title, document.subtitle ?? "", document.metadata.originalFileName ?? "", ...document.tags].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [chamberSearch, documents, favoritesOnly]);

  const shelves = useMemo(() => {
    const perShelf = 10;
    const shelfCount = Math.max(3, Math.ceil(filtered.length / perShelf));
    return Array.from({ length: shelfCount }, (_, index) => filtered.slice(index * perShelf, (index + 1) * perShelf));
  }, [filtered]);

  const openBook = (document: KnowledgeDocument) => {
    setOpeningId(document.id);
    window.setTimeout(() => {
      onOpenDocument(document);
      setOpeningId(null);
    }, 980);
  };

  if (!documents.length) return <EmptyChamberState orb={orb} />;

  return (
    <section className="bookshelf-library" aria-label={`${orb.title} library bookshelf`}>
      <div className="bookshelf-haze" />
      <div className="bookshelf-header">
        <div>
          <p className="eyebrow">{favoritesOnly ? "Favorite shelf" : "Living archive"}</p>
          <h2>{filtered.length ? `${filtered.length} libros en la estanteria` : "No hay libros visibles"}</h2>
        </div>
        <span>
          <BookOpen size={16} />
          Scroll vertical
        </span>
      </div>

      <div className="wooden-bookcase">
        {shelves.map((shelf, shelfIndex) => (
          <div className="wooden-shelf" key={shelfIndex}>
            <div className="book-row">
              {shelf.map((document, index) => {
                const globalIndex = shelfIndex * 10 + index;
                const opening = openingId === document.id;
                return (
                  <motion.article
                    key={document.id}
                    role="button"
                    tabIndex={0}
                    className={`shelf-book ${opening ? "opening" : ""}`}
                    style={
                      {
                        "--book-color": getBookColor(document, globalIndex),
                        "--book-width": `${42 + (globalIndex % 4) * 7}px`,
                        "--book-height": `${132 + (globalIndex % 5) * 10}px`
                      } as CSSProperties
                    }
                    whileHover={{ y: -12, zIndex: 5 }}
                    animate={
                      opening
                        ? {
                            rotateY: 86,
                            y: -28,
                            scale: 1.34,
                            zIndex: 10
                          }
                        : { rotateY: 0, scale: 1 }
                    }
                    transition={{ type: "spring", stiffness: 190, damping: 19 }}
                    onClick={() => openBook(document)}
                    onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                      if (event.key === "Enter" || event.key === " ") openBook(document);
                    }}
                    title={document.title}
                  >
                    <span className="book-shine" />
                    <span className="book-title">{document.title}</span>
                    <span className="book-type-mark">
                      <TypeIcon document={document} />
                    </span>
                    <span className="book-ridges" />
                    <button
                      className={`book-favorite ${document.favorite ? "active" : ""}`}
                      title={document.favorite ? "Quitar de favoritos" : "Marcar favorito"}
                      onClick={(event) => {
                        event.stopPropagation();
                        updateDocument(document.id, { favorite: !document.favorite });
                      }}
                    >
                      {document.favorite ? <Star size={13} fill="currentColor" /> : <Heart size={13} />}
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!filtered.length && (
        <div className="bookshelf-empty-filter">
          <strong>No hay coincidencias</strong>
          <span>Prueba otra busqueda o desactiva favoritos.</span>
        </div>
      )}

      {openingId && <motion.div className="book-entry-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />}
    </section>
  );
}
