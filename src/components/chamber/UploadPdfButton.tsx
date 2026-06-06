import { Upload } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { saveFileToLocalVault, useLocalVaultStatus } from "../../utils/localVault";

export function UploadPdfButton({ orbId, label = "Upload PDF" }: { orbId: string; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const vaultStatus = useLocalVaultStatus();
  const createUploadedPdf = useKnowledgeStore((state) => state.createUploadedPdf);
  const setSettingsOpen = useKnowledgeStore((state) => state.setSettingsOpen);
  const busy = vaultStatus.phase === "connecting" || vaultStatus.phase === "saving" || vaultStatus.phase === "loading";

  const requestUpload = () => {
    if (!vaultStatus.connected) {
      setSettingsOpen(true);
      return;
    }
    inputRef.current?.click();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const savedFile = await saveFileToLocalVault(file);
    if (!savedFile) return;
    createUploadedPdf(orbId, savedFile);
  };

  return (
    <>
      <button className="toolbar-button" disabled={busy} onClick={requestUpload}>
        <Upload size={16} />
        {label}
      </button>
      <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf" onChange={handleFile} />
    </>
  );
}
