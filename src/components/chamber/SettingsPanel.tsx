import { AnimatePresence, motion } from "framer-motion";
import { Download, RotateCcw, Upload, X } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";

export function SettingsPanel({ inline = false }: { inline?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsOpen = useKnowledgeStore((state) => state.settingsOpen);
  const setSettingsOpen = useKnowledgeStore((state) => state.setSettingsOpen);
  const settings = useKnowledgeStore((state) => state.settings);
  const updateSettings = useKnowledgeStore((state) => state.updateSettings);
  const resetDemoData = useKnowledgeStore((state) => state.resetDemoData);
  const exportSnapshot = useKnowledgeStore((state) => state.exportSnapshot);
  const importSnapshot = useKnowledgeStore((state) => state.importSnapshot);

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

  const content = (
    <div className={`settings-panel glass-panel ${inline ? "inline" : ""}`}>
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Local Settings</p>
          <h2>Settings</h2>
        </div>
        {!inline && (
          <button className="icon-button" onClick={() => setSettingsOpen(false)}>
            <X size={17} />
          </button>
        )}
      </div>

      <div className="settings-group">
        <label>
          <span>Bloom intensity</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={settings.bloomIntensity}
            onChange={(event) => updateSettings({ bloomIntensity: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Labels</span>
          <select value={settings.showLabels} onChange={(event) => updateSettings({ showLabels: event.target.value as typeof settings.showLabels })}>
            <option value="minimal">Minimal</option>
            <option value="sections">Sections</option>
            <option value="all">All</option>
          </select>
        </label>
        <label>
          <span>Library layout</span>
          <select
            value={settings.libraryLayout}
            onChange={(event) => updateSettings({ libraryLayout: event.target.value as typeof settings.libraryLayout })}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.autoFocusOnSelect}
            onChange={(event) => updateSettings({ autoFocusOnSelect: event.target.checked })}
          />
          <span>Focus camera on select</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) => updateSettings({ reducedMotion: event.target.checked })}
          />
          <span>Reduced motion</span>
        </label>
      </div>

      <div className="settings-actions">
        <button className="toolbar-button" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
          Import JSON
        </button>
        <button className="toolbar-button" onClick={handleExport}>
          <Download size={16} />
          Export JSON
        </button>
        <button
          className="toolbar-button danger"
          onClick={() => {
            if (window.confirm("Reset local data to the blank starter universe?")) resetDemoData();
          }}
        >
          <RotateCcw size={16} />
          Reset Starter Universe
        </button>
      </div>
      <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json" onChange={handleImport} />
    </div>
  );

  if (inline) return content;

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div className="settings-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
