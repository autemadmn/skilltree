import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbType } from "../../types/models";
import { ColorPicker } from "./ColorPicker";

const orbTypes: OrbType[] = ["concept", "question", "project", "archive", "person", "practice"];

export function AddOrbPanel() {
  const open = useKnowledgeStore((state) => state.addOrbOpen);
  const addOrbParentId = useKnowledgeStore((state) => state.addOrbParentId);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const orbs = useKnowledgeStore((state) => state.orbs);
  const addOrb = useKnowledgeStore((state) => state.addOrb);
  const setAddOrbOpen = useKnowledgeStore((state) => state.setAddOrbOpen);
  const parentIdSeed = addOrbParentId ?? selectedOrbId ?? "curiosity-core";
  const parent = orbs[parentIdSeed] ?? orbs["curiosity-core"];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [parentId, setParentId] = useState(parentIdSeed);
  const [createAsSection, setCreateAsSection] = useState(false);
  const [inheritParentColor, setInheritParentColor] = useState(true);
  const [color, setColor] = useState(parent?.color ?? "#42a8ff");
  const [type, setType] = useState<OrbType>("concept");
  const [favorite, setFavorite] = useState(false);
  const [importance, setImportance] = useState(3);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const nextParentId = addOrbParentId ?? selectedOrbId ?? "curiosity-core";
    setParentId(nextParentId);
    setColor(orbs[nextParentId]?.color ?? "#42a8ff");
    setTitle("");
    setDescription("");
    setTags("");
    setCreateAsSection(nextParentId === "curiosity-core");
    setInheritParentColor(true);
    setType("concept");
    setFavorite(false);
    setImportance(3);
    setRelatedIds([]);
  }, [addOrbParentId, open, orbs, selectedOrbId]);

  const orbOptions = useMemo(
    () =>
      Object.values(orbs)
        .filter((orb) => orb.type !== "core")
        .sort((a, b) => a.title.localeCompare(b.title)),
    [createAsSection, orbs]
  );

  const relatedOptions = useMemo(
    () =>
      Object.values(orbs)
        .filter((orb) => orb.id !== parentId && orb.id !== "curiosity-core")
        .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.title.localeCompare(b.title))
        .slice(0, 34),
    [orbs, parentId]
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addOrb({
      title,
      description,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      parentId,
      createAsSection,
      color,
      inheritParentColor,
      type,
      favorite,
      importance,
      relatedIds
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="add-orb-panel glass-panel"
          initial={{ opacity: 0, x: 32, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 32, scale: 0.98 }}
          transition={{ duration: 0.22 }}
        >
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Grow Universe</p>
              <h2>Add Orb</h2>
            </div>
            <button className="icon-button" onClick={() => setAddOrbOpen(false)}>
              <X size={17} />
            </button>
          </div>

          <form className="orb-form" onSubmit={submit}>
            <label>
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New concept, project, question..." />
            </label>

            <label className="toggle-row">
              <input type="checkbox" checked={createAsSection} onChange={(event) => setCreateAsSection(event.target.checked)} />
              <span>Create as main section</span>
            </label>

            {!createAsSection && orbOptions.length > 0 && (
              <label>
                <span>Parent orb</span>
                <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
                  {orbOptions.map((orb) => (
                    <option key={orb.id} value={orb.id}>
                      {orb.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
            </label>

            <label>
              <span>Tags</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="comma, separated, tags" />
            </label>

            <div className="form-grid">
              <label>
                <span>Type</span>
                <select value={type} onChange={(event) => setType(event.target.value as OrbType)} disabled={createAsSection}>
                  {orbTypes.map((orbType) => (
                    <option key={orbType} value={orbType}>
                      {orbType}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Importance</span>
                <input type="range" min={1} max={5} value={importance} onChange={(event) => setImportance(Number(event.target.value))} />
              </label>
            </div>

            {!createAsSection && (
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={inheritParentColor}
                  onChange={(event) => setInheritParentColor(event.target.checked)}
                />
                <span>Inherit parent color</span>
              </label>
            )}

            {(!inheritParentColor || createAsSection) && <ColorPicker value={color} onChange={setColor} />}

            <label className="toggle-row">
              <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
              <span>Mark favorite</span>
            </label>

            <div className="related-picker">
              <span>Related connections</span>
              <div className="related-grid">
                {relatedOptions.map((orb) => (
                  <label key={orb.id} className="chip-checkbox">
                    <input
                      type="checkbox"
                      checked={relatedIds.includes(orb.id)}
                      onChange={(event) =>
                        setRelatedIds((current) =>
                          event.target.checked ? [...current, orb.id] : current.filter((id) => id !== orb.id)
                        )
                      }
                    />
                    <i style={{ background: orb.color }} />
                    {orb.title}
                  </label>
                ))}
              </div>
            </div>

            <button className="submit-button" type="submit">
              Create Orb
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
