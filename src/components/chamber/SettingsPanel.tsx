import { AnimatePresence, motion } from "framer-motion";
import { Download, FolderOpen, RotateCcw, Save, Upload, X } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { useLocalVaultActions } from "../../utils/localVault";
import { DEFAULT_NAVIGATION_SENSITIVITY, formatSensitivity } from "../../utils/navigationSensitivity";

function SensitivitySlider({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const safeValue = value ?? DEFAULT_NAVIGATION_SENSITIVITY;

  return (
    <label className="sensitivity-control">
      <span className="sensitivity-label-row">
        <span>{label}</span>
        <strong>{formatSensitivity(safeValue)}</strong>
      </span>
      <input type="range" min={0} max={100} step={1} value={safeValue} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="sensitivity-scale">
        <span>Más lento</span>
        <span>Actual</span>
        <span>Más rápido</span>
      </span>
    </label>
  );
}

export function SettingsPanel({ inline = false }: { inline?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsOpen = useKnowledgeStore((state) => state.settingsOpen);
  const setSettingsOpen = useKnowledgeStore((state) => state.setSettingsOpen);
  const settings = useKnowledgeStore((state) => state.settings);
  const updateSettings = useKnowledgeStore((state) => state.updateSettings);
  const resetDemoData = useKnowledgeStore((state) => state.resetDemoData);
  const exportSnapshot = useKnowledgeStore((state) => state.exportSnapshot);
  const importSnapshot = useKnowledgeStore((state) => state.importSnapshot);
  const { status: vaultStatus, connectAndSave, disconnect, loadNow, saveNow } = useLocalVaultActions();
  const vaultBusy = vaultStatus.phase === "connecting" || vaultStatus.phase === "saving" || vaultStatus.phase === "loading";
  const lastSavedLabel = vaultStatus.lastSavedAt ? new Date(vaultStatus.lastSavedAt).toLocaleString() : "Not saved this session";

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

  const handleVaultLoad = async () => {
    if (!window.confirm("Load the local vault and replace the current in-browser state?")) return;
    await loadNow();
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

      <div className="camera-controls-card">
        <div className="local-vault-heading">
          <div>
            <p className="eyebrow">Sensibilidad de navegación</p>
            <h3>Controles de cámara</h3>
          </div>
          <span className="camera-controls-pulse" />
        </div>
        <div className="settings-group camera-sensitivity-group">
          <SensitivitySlider
            label="Movimiento con click izquierdo"
            value={settings.navigationMoveSensitivity}
            onChange={(value) => updateSettings({ navigationMoveSensitivity: value })}
          />
          <SensitivitySlider
            label="Rotación con rueda pulsada"
            value={settings.navigationRotateSensitivity}
            onChange={(value) => updateSettings({ navigationRotateSensitivity: value })}
          />
          <SensitivitySlider
            label="Zoom con rueda"
            value={settings.navigationZoomSensitivity}
            onChange={(value) => updateSettings({ navigationZoomSensitivity: value })}
          />
        </div>
      </div>

      <div className="local-vault-card">
        <div className="local-vault-heading">
          <div>
            <p className="eyebrow">Portable Local Vault</p>
            <h3>Folder-backed archive</h3>
          </div>
          <span className={`vault-status-dot ${vaultStatus.connected ? "connected" : ""}`} />
        </div>
        <p className="vault-description">
          Save a portable copy of your universe to a folder on this computer. Copy that folder to move the app data to another machine.
        </p>
        <div className="vault-meta">
          <span>Folder</span>
          <strong>{vaultStatus.connected ? vaultStatus.directoryName : vaultStatus.supported ? "Not connected" : "Browser not supported"}</strong>
          <span>Last saved</span>
          <strong>{lastSavedLabel}</strong>
        </div>
        {vaultStatus.message && <p className={`vault-message ${vaultStatus.phase === "error" ? "error" : ""}`}>{vaultStatus.message}</p>}
        <div className="settings-actions compact">
          <button className="toolbar-button primary" disabled={!vaultStatus.supported || vaultBusy} onClick={() => void connectAndSave()}>
            <FolderOpen size={16} />
            Connect Folder
          </button>
          <button className="toolbar-button" disabled={!vaultStatus.connected || vaultBusy} onClick={() => void saveNow()}>
            <Save size={16} />
            Save Now
          </button>
          <button className="toolbar-button" disabled={!vaultStatus.connected || vaultBusy} onClick={() => void handleVaultLoad()}>
            <Upload size={16} />
            Load Vault
          </button>
          <button className="toolbar-button" disabled={!vaultStatus.connected || vaultBusy} onClick={() => void disconnect()}>
            <X size={16} />
            Disconnect
          </button>
        </div>
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
