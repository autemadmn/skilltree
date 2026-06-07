import { Upload } from "lucide-react";
import type { OrbNode } from "../../types/models";

export function EmptyShelfState({
  orb,
  mode,
  onUploadPdf
}: {
  orb: OrbNode;
  mode: "empty" | "no-results";
  onUploadPdf: () => void;
}) {
  return (
    <div className="empty-shelf-state">
      <div className="empty-book-outline" style={{ borderColor: orb.color, boxShadow: `0 0 38px ${orb.color}44` }}>
        <span style={{ background: orb.color }} />
      </div>
      <h2>{mode === "empty" ? "Esta estantería está vacía." : "No hay libros que coincidan."}</h2>
      <p>
        {mode === "empty"
          ? "Sube el primer PDF de esta cámara de conocimiento."
          : "Cambia la búsqueda o desactiva favoritos para volver a ver la biblioteca completa."}
      </p>
      {mode === "empty" && (
        <button className="toolbar-button primary" onClick={onUploadPdf}>
          <Upload size={16} />
          Añadir PDF
        </button>
      )}
    </div>
  );
}
