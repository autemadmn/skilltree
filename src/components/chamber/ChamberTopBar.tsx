import { ArrowLeft, Heart, Library, Search, Waypoints } from "lucide-react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";
import { UploadPdfButton } from "./UploadPdfButton";

export function ChamberTopBar({
  orb,
  favoritesOnly,
  onToggleFavorites
}: {
  orb: OrbNode;
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
}) {
  const chamberView = useKnowledgeStore((state) => state.chamberView);
  const setChamberView = useKnowledgeStore((state) => state.setChamberView);
  const chamberSearch = useKnowledgeStore((state) => state.chamberSearch);
  const setChamberSearch = useKnowledgeStore((state) => state.setChamberSearch);
  const returnToSkillTree = useKnowledgeStore((state) => state.returnToSkillTree);
  const activeView = chamberView === "canvas" ? "canvas" : "library";

  return (
    <header className="chamber-topbar bookshelf-topbar">
      <button className="icon-button" title="Back to Skill Tree" onClick={returnToSkillTree}>
        <ArrowLeft size={17} />
      </button>

      <div className="bookshelf-title">
        <span className="brand-orb small" style={{ background: orb.color }}>
          <Waypoints size={15} />
        </span>
        <div>
          <p className="eyebrow">Knowledge Chamber</p>
          <h1>{orb.title}</h1>
        </div>
      </div>

      <nav className="chamber-view-tabs" aria-label="Knowledge Chamber views">
        <button className={activeView === "library" ? "active" : ""} onClick={() => setChamberView("library")}>
          <Library size={16} />
          Library
        </button>
        <button className={activeView === "canvas" ? "active" : ""} onClick={() => setChamberView("canvas")}>
          <Waypoints size={16} />
          Canvas View
        </button>
      </nav>

      {activeView === "library" && (
        <>
          <label className="bookshelf-search">
            <Search size={16} />
            <input value={chamberSearch} onChange={(event) => setChamberSearch(event.target.value)} placeholder="Buscar libro o PDF" />
          </label>
          <button className={`favorite-filter ${favoritesOnly ? "active" : ""}`} onClick={onToggleFavorites}>
            <Heart size={16} />
            Favoritos
          </button>
        </>
      )}

      <UploadPdfButton orbId={orb.id} label="Añadir PDF" />
    </header>
  );
}
