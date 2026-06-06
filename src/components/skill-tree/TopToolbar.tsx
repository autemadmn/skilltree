import { Download, HelpCircle, Plus, Search, Settings, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useRef } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { SearchOverlay } from "./SearchOverlay";

export function TopToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orbs = useKnowledgeStore((state) => state.orbs);
  const searchTerm = useKnowledgeStore((state) => state.searchTerm);
  const highlightedOrbIds = useKnowledgeStore((state) => state.highlightedOrbIds);
  const setSearchTerm = useKnowledgeStore((state) => state.setSearchTerm);
  const focusOrb = useKnowledgeStore((state) => state.focusOrb);
  const setAddOrbOpen = useKnowledgeStore((state) => state.setAddOrbOpen);
  const exportSnapshot = useKnowledgeStore((state) => state.exportSnapshot);
  const importSnapshot = useKnowledgeStore((state) => state.importSnapshot);
  const setSettingsOpen = useKnowledgeStore((state) => state.setSettingsOpen);

  const results = useMemo(() => highlightedOrbIds.map((id) => orbs[id]).filter(Boolean), [highlightedOrbIds, orbs]);

  const handleExport = () => {
    const blob = new Blob([exportSnapshot()], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "neural-skill-tree-export.json";
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importSnapshot(text);
    event.target.value = "";
  };

  return (
    <header className="top-toolbar glass-panel">
      <div className="search-field">
        <Search size={17} />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search orbs, tags, descriptions"
          aria-label="Search knowledge orbs"
        />
        <SearchOverlay
          visible={searchTerm.trim().length > 1}
          results={results}
          onSelect={(id) => {
            focusOrb(id);
            setSearchTerm("");
          }}
        />
      </div>

      <div className="toolbar-actions">
        <button className="toolbar-button primary" onClick={() => setAddOrbOpen(true)}>
          <Plus size={16} />
          Add Orb
        </button>
        <button className="icon-button" title="Import JSON" onClick={() => fileInputRef.current?.click()}>
          <Upload size={17} />
        </button>
        <button className="icon-button" title="Export JSON" onClick={handleExport}>
          <Download size={17} />
        </button>
        <button className="icon-button" title="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings size={17} />
        </button>
        <button className="icon-button" title="Help">
          <HelpCircle size={17} />
        </button>
      </div>
      <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json" onChange={handleImport} />
    </header>
  );
}
