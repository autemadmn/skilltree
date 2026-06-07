import { ArrowLeft, Heart, Library, Search, Waypoints } from "lucide-react";
import type { ChamberView } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";
import { PdfUploadButton } from "./PdfUploadButton";

type KnowledgeChamberTopBarProps = {
  orb: OrbNode;
  currentView: ChamberView;
  onChangeView: (view: ChamberView) => void;
  onBack: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
  onUploadPdf: () => void;
  uploadBusy?: boolean;
};

export function KnowledgeChamberTopBar({
  orb,
  currentView,
  onChangeView,
  onBack,
  searchQuery,
  onSearchChange,
  favoritesOnly,
  onToggleFavorites,
  onUploadPdf,
  uploadBusy = false
}: KnowledgeChamberTopBarProps) {
  return (
    <header className="chamber-topbar bookshelf-topbar">
      <button className="icon-button" title="Volver al Skill Tree" onClick={onBack}>
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
        <button className={currentView === "library" ? "active" : ""} onClick={() => onChangeView("library")}>
          <Library size={16} />
          Library
        </button>
        <button className={currentView === "canvas" ? "active" : ""} onClick={() => onChangeView("canvas")}>
          <Waypoints size={16} />
          Canvas View
        </button>
      </nav>

      <label className={`bookshelf-search ${currentView !== "library" ? "disabled" : ""}`}>
        <Search size={16} />
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar libro o PDF"
          disabled={currentView !== "library"}
        />
      </label>

      <button className={`favorite-filter ${favoritesOnly ? "active" : ""}`} disabled={currentView !== "library"} onClick={onToggleFavorites}>
        <Heart size={16} />
        Favoritos
      </button>

      <PdfUploadButton disabled={uploadBusy} onClick={onUploadPdf} />
    </header>
  );
}
