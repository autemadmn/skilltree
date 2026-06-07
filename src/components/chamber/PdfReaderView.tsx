import { ArrowLeft, ExternalLink, ImagePlus, Maximize2, Trash2, X } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument, VisualAttachment } from "../../types/models";
import { deleteBlobRecord, loadBlobObjectUrl, saveBlobRecord } from "../../utils/blobStore";
import { loadVaultFileObjectUrl } from "../../utils/localVault";

type ImagePreview = {
  attachment: VisualAttachment;
  url: string;
};

function createBlobId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function AttachmentThumbnail({
  attachment,
  onPreview,
  onDelete
}: {
  attachment: VisualAttachment;
  onPreview: (preview: ImagePreview) => void;
  onDelete: (attachment: VisualAttachment) => void;
}) {
  const updateAttachment = useKnowledgeStore((state) => state.updateDocumentVisualAttachment);
  const [url, setUrl] = useState<string | null>(attachment.dataUrl ?? null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadAttachment() {
      if (!attachment.blobId) return;
      const loaded = await loadBlobObjectUrl(attachment.blobId);
      if (!loaded || cancelled) return;
      objectUrl = loaded;
      setUrl(loaded);
    }

    loadAttachment();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.blobId]);

  return (
    <article className="visual-attachment">
      <button className="visual-thumb" disabled={!url} onClick={() => url && onPreview({ attachment, url })}>
        {url ? <img src={url} alt={attachment.title} /> : <span className="visual-thumb-loading">Cargando imagen</span>}
        <Maximize2 size={15} />
      </button>
      <input
        value={attachment.title}
        onChange={(event) => updateAttachment(attachment.documentId, attachment.id, { title: event.target.value })}
        aria-label="Título de imagen complementaria"
      />
      <textarea
        value={attachment.description ?? ""}
        onChange={(event) => updateAttachment(attachment.documentId, attachment.id, { description: event.target.value })}
        placeholder="Descripción opcional"
      />
      <button className="delete-attachment" onClick={() => onDelete(attachment)}>
        <Trash2 size={14} />
        Eliminar
      </button>
    </article>
  );
}

export function PdfReaderView({ document, onClose }: { document: KnowledgeDocument; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addAttachment = useKnowledgeStore((state) => state.addDocumentVisualAttachment);
  const deleteAttachment = useKnowledgeStore((state) => state.deleteDocumentVisualAttachment);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const attachments = document.visualAttachments ?? [];

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    async function loadPdf() {
      setPdfUrl(null);
      if (document.type !== "pdf") return;

      const blobId = document.metadata.blobId;
      const vaultPath = document.metadata.vaultPath;
      const externalUrl = document.fileUrl && !document.fileUrl.startsWith("vault://") && !document.fileUrl.startsWith("indexeddb://") ? document.fileUrl : null;
      const objectUrl = blobId ? await loadBlobObjectUrl(blobId) : vaultPath ? await loadVaultFileObjectUrl(vaultPath) : null;

      if (cancelled) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }

      if (objectUrl) {
        revokedUrl = objectUrl;
        setPdfUrl(objectUrl);
        return;
      }

      if (externalUrl) setPdfUrl(externalUrl);
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [document.fileUrl, document.id, document.metadata.blobId, document.metadata.vaultPath, document.type]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (imagePreview) {
        setImagePreview(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imagePreview, onClose]);

  const handleImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    setAttachmentError(null);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const blobId = createBlobId("image");
        const createdAt = new Date().toISOString();
        await saveBlobRecord({
          id: blobId,
          kind: "image",
          blob: file,
          fileName: file.name,
          mimeType: file.type || "image/*",
          fileSize: file.size,
          createdAt,
          documentId: document.id
        });
        addAttachment(document.id, {
          id: createBlobId("visual"),
          title: file.name.replace(/\.[^.]+$/, ""),
          blobId,
          mimeType: file.type || "image/*",
          fileName: file.name,
          fileSize: file.size
        });
      } catch (error) {
        setAttachmentError(error instanceof Error ? error.message : "No se pudo guardar una imagen complementaria.");
      }
    }
  };

  const deleteVisualAttachment = async (attachment: VisualAttachment) => {
    if (attachment.blobId) await deleteBlobRecord(attachment.blobId).catch(() => undefined);
    deleteAttachment(document.id, attachment.id);
    if (imagePreview?.attachment.id === attachment.id) setImagePreview(null);
  };

  const openExternal = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (document.fileUrl && !document.fileUrl.startsWith("vault://") && !document.fileUrl.startsWith("indexeddb://")) {
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
                  El PDF real está registrado como <strong>{document.metadata.originalFileName ?? "archivo local"}</strong>, pero el archivo no se
                  pudo abrir desde el almacenamiento local de este navegador.
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
              <div className="note-body-text">{document.content ?? "Este libro todavía no tiene contenido escrito."}</div>
            </article>
          )}
        </main>

        <aside className="visual-annex-panel">
          <div className="annex-header">
            <div>
              <p className="eyebrow">Anexos visuales</p>
              <h3>Imágenes complementarias</h3>
            </div>
            <button className="icon-button" onClick={() => inputRef.current?.click()}>
              <ImagePlus size={16} />
            </button>
          </div>
          {attachmentError && <div className="attachment-error">{attachmentError}</div>}
          {attachments.length ? (
            <div className="visual-attachment-grid">
              {attachments.map((attachment) => (
                <AttachmentThumbnail
                  key={attachment.id}
                  attachment={attachment}
                  onPreview={setImagePreview}
                  onDelete={deleteVisualAttachment}
                />
              ))}
            </div>
          ) : (
            <div className="empty-annex">
              <ImagePlus size={22} />
              <span>Aún no hay imágenes asociadas a este PDF.</span>
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
            <img src={imagePreview.url} alt={imagePreview.attachment.title} />
            <figcaption>
              <strong>{imagePreview.attachment.title}</strong>
              {imagePreview.attachment.description && <span>{imagePreview.attachment.description}</span>}
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
