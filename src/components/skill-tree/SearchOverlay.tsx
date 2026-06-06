import { ArrowRight, Search } from "lucide-react";
import type { OrbNode } from "../../types/models";

type SearchOverlayProps = {
  results: OrbNode[];
  visible: boolean;
  onSelect: (id: string) => void;
};

export function SearchOverlay({ results, visible, onSelect }: SearchOverlayProps) {
  if (!visible) return null;

  return (
    <div className="search-overlay glass-panel">
      {results.length === 0 ? (
        <div className="empty-search">
          <Search size={16} />
          No matching orbs
        </div>
      ) : (
        results.slice(0, 8).map((orb) => (
          <button key={orb.id} className="search-result" onClick={() => onSelect(orb.id)}>
            <span className="search-dot" style={{ background: orb.color }} />
            <span>
              <strong>{orb.title}</strong>
              <small>{orb.tags.slice(0, 3).join(" / ") || orb.type}</small>
            </span>
            <ArrowRight size={14} />
          </button>
        ))
      )}
    </div>
  );
}
