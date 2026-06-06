import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  GitBranchPlus,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Waypoints
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { formatDate } from "../../utils/geometry";

export function OrbDetailsPanel() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const documents = useKnowledgeStore((state) => state.documents);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const openInterior = useKnowledgeStore((state) => state.openInterior);
  const openKnowledgeChamber = useKnowledgeStore((state) => state.openKnowledgeChamber);
  const setAddOrbOpen = useKnowledgeStore((state) => state.setAddOrbOpen);
  const updateOrb = useKnowledgeStore((state) => state.updateOrb);
  const deleteOrb = useKnowledgeStore((state) => state.deleteOrb);
  const addRelatedConnection = useKnowledgeStore((state) => state.addRelatedConnection);
  const [relationTarget, setRelationTarget] = useState("");
  const selected = orbs[selectedOrbId];

  const stats = useMemo(() => {
    if (!selected) return null;
    const docs = selected.documentIds.map((id) => documents[id]).filter(Boolean);
    return {
      documents: docs.length,
      notes: docs.filter((document) => document.type !== "pdf" && document.type !== "source").length,
      links: selected.relatedIds.length + selected.childrenIds.length + (selected.parentId ? 1 : 0)
    };
  }, [documents, selected]);

  if (!selected || !stats) return null;

  const section = orbs[selected.sectionId] ?? selected;
  const relationOptions = Object.values(orbs)
    .filter((orb) => orb.id !== selected.id && !selected.relatedIds.includes(orb.id))
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOrb(selected.id, { color: event.target.value });
  };

  return (
    <AnimatePresence>
      <motion.aside
        className="orb-details-panel glass-panel"
        style={{ "--accent": selected.color } as CSSProperties}
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 28 }}
        transition={{ duration: 0.22 }}
      >
        <div className="orb-detail-hero">
          <div className="detail-orb-icon" style={{ background: selected.color }}>
            <Sparkles size={18} />
          </div>
          <div>
            <p className="eyebrow">{section.title}</p>
            <h2>{selected.title}</h2>
          </div>
          <button className={`favorite-button ${selected.favorite ? "active" : ""}`} onClick={() => updateOrb(selected.id, { favorite: !selected.favorite })}>
            <Star size={16} />
          </button>
        </div>

        <p className="detail-description">{selected.description}</p>

        <div className="tag-row">
          {selected.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="stat-grid">
          <div>
            <strong>{stats.documents}</strong>
            <span>Documents</span>
          </div>
          <div>
            <strong>{stats.notes}</strong>
            <span>Notes</span>
          </div>
          <div>
            <strong>{stats.links}</strong>
            <span>Links</span>
          </div>
        </div>

        <div className="detail-meta">
          <div>
            <span>Type</span>
            <strong>{selected.type}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{selected.status}</strong>
          </div>
          <div>
            <span>Created</span>
            <strong>{formatDate(selected.createdAt)}</strong>
          </div>
          <div>
            <span>Updated</span>
            <strong>{formatDate(selected.updatedAt)}</strong>
          </div>
        </div>

        <div className="color-edit">
          <span>Color</span>
          <input type="color" value={selected.color} onChange={handleColorChange} />
        </div>

        <div className="relation-control">
          <select value={relationTarget} onChange={(event) => setRelationTarget(event.target.value)}>
            <option value="">Add related concept</option>
            {relationOptions.map((orb) => (
              <option key={orb.id} value={orb.id}>
                {orb.title}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            disabled={!relationTarget}
            onClick={() => {
              addRelatedConnection(selected.id, relationTarget);
              setRelationTarget("");
            }}
          >
            <Link2 size={16} />
          </button>
        </div>

        <div className="detail-actions">
          <button onClick={() => openInterior(selected.id)}>
            <Waypoints size={16} />
            Enter Orb
          </button>
          <button onClick={() => openKnowledgeChamber(selected.id)}>
            <BookOpen size={16} />
            Open Chamber
          </button>
          <button onClick={() => setAddOrbOpen(true, selected.id)}>
            <Plus size={16} />
            Add Child
          </button>
          <button onClick={() => setAddOrbOpen(true, selected.id)}>
            <GitBranchPlus size={16} />
            Add Related
          </button>
          <button onClick={() => updateOrb(selected.id, { status: selected.status === "archived" ? "active" : "archived" })}>
            <Pencil size={16} />
            Edit Status
          </button>
          <button className="danger" disabled={selected.id === "curiosity-core"} onClick={() => deleteOrb(selected.id)}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
