import { BookOpen, CircleDot, Compass, Network, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";

export function SectionMenu() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const focusOrb = useKnowledgeStore((state) => state.focusOrb);
  const resetCamera = useKnowledgeStore((state) => state.resetCamera);
  const selected = orbs[selectedOrbId];

  const sections = useMemo(() => {
    const core = orbs["curiosity-core"];
    return (core?.childrenIds ?? []).map((id) => orbs[id]).filter(Boolean);
  }, [orbs]);

  return (
    <aside className="section-menu glass-panel">
      <div className="brand-lockup">
        <div className="brand-orb">
          <Network size={18} />
        </div>
        <div>
          <p className="eyebrow">Personal Universe</p>
          <h1>Neural Skill Tree</h1>
        </div>
      </div>

      <nav className="section-nav" aria-label="Knowledge sections">
        <button className="section-link" onClick={resetCamera}>
          <span className="menu-icon neutral">
            <Compass size={15} />
          </span>
          <span>Overview</span>
        </button>
        <button className="section-link" onClick={() => focusOrb("curiosity-core")}>
          <span className="menu-icon neutral">
            <BookOpen size={15} />
          </span>
          <span>All Orbs</span>
        </button>
        {sections.map((section) => {
          const active = selected?.sectionId === section.id || selected?.id === section.id;
          return (
            <button
              key={section.id}
              className={`section-link ${active ? "active" : ""}`}
              style={{ "--accent": section.color } as CSSProperties}
              onClick={() => focusOrb(section.id)}
            >
              <span className="menu-icon" style={{ background: section.color }}>
                <CircleDot size={13} />
              </span>
              <span>{section.title}</span>
            </button>
          );
        })}
        {sections.length === 0 && (
          <div className="empty-section-note">
            <strong>Blank universe</strong>
            <span>Add your first orb when you are ready.</span>
          </div>
        )}
      </nav>

      <button className="reset-view-button" onClick={resetCamera}>
        <RotateCcw size={15} />
        Reset View
      </button>
    </aside>
  );
}
