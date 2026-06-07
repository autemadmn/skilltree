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

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3 ? normalized.split("").map((part) => `${part}${part}`).join("") : normalized;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function mix(hex: string, target: "#000000" | "#ffffff", amount: number) {
  const base = hexToRgb(hex);
  const end = target === "#ffffff" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const channel = (start: number, finish: number) => Math.round(start + (finish - start) * amount);
  return `rgb(${channel(base.r, end.r)}, ${channel(base.g, end.g)}, ${channel(base.b, end.b)})`;
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
  const bookColor = getBookColor(document, index);
  const bookDepth = 18 + (index % 3) * 3;

  return (
    <motion.article
      role="button"
      tabIndex={0}
      className={`shelf-book ${opening ? "opening" : ""}`}
      style={
        {
          "--book-color": bookColor,
          "--book-dark": mix(bookColor, "#000000", 0.34),
          "--book-light": mix(bookColor, "#ffffff", 0.18),
          "--page-color": document.type === "pdf" ? "#d8bd83" : "#c79c66",
          "--book-width": `${42 + (index % 4) * 7}px`,
          "--book-height": `${132 + (index % 5) * 10}px`,
          "--book-depth": `${bookDepth}px`,
          "--book-depth-half": `${bookDepth / 2}px`
        } as CSSProperties
      }
      whileHover={{ y: -10, z: 18, zIndex: 8 }}
      animate={opening ? { rotateY: -72, y: -28, z: 230, scale: 1.22, zIndex: 50 } : { rotateY: 0, z: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 190, damping: 19 }}
      onClick={open}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") open();
      }}
      title={document.title}
    >
      <div className="book-cuboid">
        <div className="book-face book-spine">
          <span className="book-shine" />
          <span className="book-title">{document.title}</span>
          <span className="book-type-mark">
            <TypeIcon document={document} />
          </span>
          <span className="book-ridges" />
        </div>
        <div className="book-face book-side" />
        <div className="book-face book-top" />
        <div className="book-face book-bottom" />
        <div className="book-face book-back" />
      </div>
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
