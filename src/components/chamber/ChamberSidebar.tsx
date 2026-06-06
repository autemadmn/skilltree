import {
  ArrowLeft,
  Clock,
  FileText,
  Grid2X2,
  Heart,
  Home,
  Library,
  Link2,
  NotebookText,
  Settings,
  Waypoints,
  type LucideIcon
} from "lucide-react";
import { useKnowledgeStore, type ChamberView } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";

const navItems: Array<{ id: ChamberView; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "library", label: "Library", icon: Library },
  { id: "pdfs", label: "PDFs", icon: FileText },
  { id: "notes", label: "Notes", icon: NotebookText },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "linked", label: "Linked Concepts", icon: Link2 },
  { id: "canvas", label: "Canvas View", icon: Grid2X2 },
  { id: "settings", label: "Settings", icon: Settings }
];

export function ChamberSidebar({ orb }: { orb: OrbNode }) {
  const returnToSkillTree = useKnowledgeStore((state) => state.returnToSkillTree);
  const chamberView = useKnowledgeStore((state) => state.chamberView);
  const setChamberView = useKnowledgeStore((state) => state.setChamberView);

  return (
    <aside className="chamber-sidebar glass-panel">
      <div className="chamber-orb-header">
        <div className="brand-orb large" style={{ background: orb.color }}>
          <Waypoints size={20} />
        </div>
        <div>
          <p className="eyebrow">Knowledge Chamber</p>
          <h1>{orb.title}</h1>
        </div>
      </div>

      <nav className="chamber-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={chamberView === item.id ? "active" : ""} onClick={() => setChamberView(item.id)}>
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="profile-card">
        <div>
          <strong>Local Archive</strong>
          <span>Private browser state</span>
        </div>
      </div>

      <button className="toolbar-button back-button" onClick={returnToSkillTree}>
        <ArrowLeft size={16} />
        Back to Skill Tree
      </button>
    </aside>
  );
}
