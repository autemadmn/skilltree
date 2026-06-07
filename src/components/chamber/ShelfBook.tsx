import { motion } from "framer-motion";
import { FileText, Heart, Image, Link2, NotebookText, Star } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { KnowledgeDocument } from "../../types/models";

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

export function ShelfBook({
  document,
  index,
  opening,
  onOpen,
  onToggleFavorite
}: {
  document: KnowledgeDocument;
  index: number;
  opening: boolean;
  onOpen: (document: KnowledgeDocument) => void;
  onToggleFavorite: (document: KnowledgeDocument) => void;
}) {
  const open = () => onOpen(document);

  return (
    <motion.article
      role="button"
      tabIndex={0}
      className={`shelf-book ${opening ? "opening" : ""}`}
      style={
        {
          "--book-color": getBookColor(document, index),
          "--book-width": `${42 + (index % 4) * 7}px`,
          "--book-height": `${132 + (index % 5) * 10}px`
        } as CSSProperties
      }
      whileHover={{ y: -12, zIndex: 5 }}
      animate={opening ? { rotateY: 86, y: -28, scale: 1.34, zIndex: 10 } : { rotateY: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 190, damping: 19 }}
      onClick={open}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") open();
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
          onToggleFavorite(document);
        }}
      >
        {document.favorite ? <Star size={13} fill="currentColor" /> : <Heart size={13} />}
      </button>
    </motion.article>
  );
}
