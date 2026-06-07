import { Upload } from "lucide-react";

export function PdfUploadButton({ label = "Añadir PDF", disabled = false, onClick }: { label?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button className="toolbar-button" disabled={disabled} onClick={onClick}>
      <Upload size={16} />
      {label}
    </button>
  );
}
