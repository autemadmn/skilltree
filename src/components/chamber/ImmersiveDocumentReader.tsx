import { ArrowLeft, ExternalLink, ImagePlus, Maximize2, Trash2, X } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument, VisualAttachment } from "../../types/models";
import { loadVaultFileObjectUrl } from "../../utils/localVault";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImmersiveDocumentReader({ document, onClose }: { document: KnowledgeDocument; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addAttachment = useKnowledgeStore((state) => state.addDocumentVisualAttachment);
  const updateAttachment = useKnowledgeStore((state) => state.updateDocumentVisualAttachment);
  const deleteAttachment = useKnowledgeStore((state) => state.deleteDocumentVisualAttachment);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<VisualAttachment | null>(null);
  const attachments = document.visualAttachments ?? [];

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    async function loadPdf() {
      setPdfUrl(null);
      if (document.type !== "pdf") return;
      const vaultPath = document.metadata.vaultPath;
      if (!vaultPath) return;
      const objectUrl = await loadVaultFileObjectUrl(vaultPath);
      if (!objectUrl || cancelled) return;
      revokedUrl = objectUrl;
      setPdfUrl(objectUrl);
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [document.id, document.metadata.vaultPath, document.type]);

  const handleImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(file);
      addAttachment(document.id, {
        id: `visual-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        dataUrl,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size
      });
    }
  };

  const openExternal = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (document.fileUrl && !document.fileUrl.startsWith("vault://")) {
      window.open(document.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="immersive-reader">
      <div className="reader-cosmos" />
      <header className="immersive-reader-topbar">
        <button className="icon-button" onClick={onClose}>
          <ArrowLeft size={17} />
        </button>
        <div>
          <p className="eyebrow">{document.type === "pdf" ? "PDF abierto" : "Documento abierto"}</p>
          <h2>{document.title}</h2>
        </div>
        <div className="immersive-reader-actions">
          <button className="toolbar-button" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={16} />
            Añadir imagen complementaria
          </button>
          {document.type === "pdf" && (
            <button className="toolbar-button" onClick={openExternal}>
              <ExternalLink size={16} />
              Abrir PDF
            </button>
          )}
          <button className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={handleImages} />
      </header>

      <div className="immersive-reader-body">
        <main className="immersive-document-stage">
          {document.type === "pdf" ? (
            pdfUrl ? (
              <iframe className="embedded-pdf-frame" src={`${pdfUrl}#toolbar=1&view=FitH`} title={document.title} />
            ) : (
              <article className="pdf-vault-placeholder">
                <FileFallbackIcon />
                <h3>{document.title}</h3>
                <p>
                  El PDF real esta guardado como <strong>{document.metadata.vaultPath ?? document.metadata.originalFileName ?? "archivo local"}</strong>.
                  Conecta la carpeta vault para verlo integrado aqui, o abre el archivo en el navegador si esta disponible.
                </p>
                <button className="toolbar-button primary" onClick={openExternal}>
                  <ExternalLink size={16} />
                  Abrir PDF
                </button>
              </article>
            )
          ) : (
            <article className="immersive-note-page">
              <p className="eyebrow">{document.type}</p>
              <h1>{document.title}</h1>
              <p>{document.subtitle ?? document.metadata.summary}</p>
              <div className="note-body-text">{document.content ?? "Este libro todavia no tiene contenido escrito."}</div>
            </article>
          )}
        </main>

        <aside className="visual-annex-panel">
          <div className="annex-header">
            <div>
              <p className="eyebrow">Anexos visuales</p>
              <h3>Imagenes complementarias</h3>
            </div>
            <button className="icon-button" onClick={() => inputRef.current?.click()}>
              <ImagePlus size={16} />
            </button>
          </div>
          {attachments.length ? (
            <div className="visual-attachment-grid">
              {attachments.map((attachment) => (
                <article className="visual-attachment" key={attachment.id}>
                  <button className="visual-thumb" onClick={() => setImagePreview(attachment)}>
                    <img src={attachment.dataUrl} alt={attachment.title} />
                    <Maximize2 size={15} />
                  </button>
                  <input
                    value={attachment.title}
                    onChange={(event) => updateAttachment(document.id, attachment.id, { title: event.target.value })}
                    aria-label="Titulo de imagen complementaria"
                  />
                  <textarea
                    value={attachment.description ?? ""}
                    onChange={(event) => updateAttachment(document.id, attachment.id, { description: event.target.value })}
                    placeholder="Descripcion opcional"
                  />
                  <button className="delete-attachment" onClick={() => deleteAttachment(document.id, attachment.id)}>
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-annex">
              <ImagePlus size={22} />
              <span>Aun no hay imagenes asociadas a este PDF.</span>
            </div>
          )}
        </aside>
      </div>

      {imagePreview && (
        <div className="visual-preview-modal" onClick={() => setImagePreview(null)}>
          <figure onClick={(event) => event.stopPropagation()}>
            <button className="icon-button" onClick={() => setImagePreview(null)}>
              <X size={17} />
            </button>
            <img src={imagePreview.dataUrl} alt={imagePreview.title} />
            <figcaption>
              <strong>{imagePreview.title}</strong>
              {imagePreview.description && <span>{imagePreview.description}</span>}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}

function FileFallbackIcon() {
  return (
    <div className="file-fallback-icon">
      <span />
    </div>
  );
}
