import { UploadPdfButton } from "./UploadPdfButton";
import type { OrbNode } from "../../types/models";

export function EmptyChamberState({ orb, compact = false }: { orb: OrbNode; compact?: boolean }) {
  return (
    <section className={`empty-chamber-state glass-panel ${compact ? "compact" : ""}`}>
      <div className="empty-orb-outline" style={{ borderColor: orb.color, boxShadow: `0 0 42px ${orb.color}55` }}>
        <span style={{ background: orb.color }} />
      </div>
      <p className="eyebrow">{orb.title}</p>
      <h2>Esta estanteria esta vacia.</h2>
      <p>Empieza subiendo el primer PDF de esta camara de conocimiento.</p>
      <div className="empty-actions">
        <UploadPdfButton orbId={orb.id} label="Añadir PDF" />
      </div>
    </section>
  );
}
