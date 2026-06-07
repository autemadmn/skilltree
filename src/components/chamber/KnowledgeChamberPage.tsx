import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument } from "../../types/models";
import { saveBlobRecord } from "../../utils/blobStore";
import { saveFileToLocalVault, useLocalVaultStatus } from "../../utils/localVault";
import { CanvasView } from "./CanvasView";
import { KnowledgeChamberTopBar } from "./KnowledgeChamberTopBar";
import { LibraryView } from "./LibraryView";
import { PdfReaderView } from "./PdfReaderView";

function createBlobId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function KnowledgeChamberPage() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const documents = useKnowledgeStore((state) => state.documents);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const selectedDocumentId = useKnowledgeStore((state) => state.selectedDocumentId);
  const setSelectedDocument = useKnowledgeStore((state) => state.setSelectedDocument);
  const chamberView = useKnowledgeStore((state) => state.chamberView);
  const setChamberView = useKnowledgeStore((state) => state.setChamberView);
  const chamberSearch = useKnowledgeStore((state) => state.chamberSearch);
  const setChamberSearch = useKnowledgeStore((state) => state.setChamberSearch);
  const returnToSkillTree = useKnowledgeStore((state) => state.returnToSkillTree);
  const createUploadedPdf = useKnowledgeStore((state) => state.createUploadedPdf);
  const vaultStatus = useLocalVaultStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [readerDocumentId, setReaderDocumentId] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const orb = orbs[selectedOrbId] ?? orbs["curiosity-core"];

  const orbDocuments = useMemo(() => orb.documentIds.map((id) => documents[id]).filter(Boolean), [documents, orb.documentIds]);
  const readerDocument = readerDocumentId ? documents[readerDocumentId] : null;

  useEffect(() => {
    if (orbDocuments.length && (!selectedDocumentId || !documents[selectedDocumentId])) {
      setSelectedDocument(orbDocuments[0].id);
    }
    if (!orbDocuments.length && selectedDocumentId) {
      setSelectedDocument(null);
    }
  }, [documents, orbDocuments, selectedDocumentId, setSelectedDocument]);

  useEffect(() => {
    if (readerDocumentId && !documents[readerDocumentId]) setReaderDocumentId(null);
  }, [documents, readerDocumentId]);

  const openDocument = (document: KnowledgeDocument) => {
    setSelectedDocument(document.id);
    setReaderDocumentId(document.id);
  };

  const handlePdfSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("Solo se pueden subir archivos PDF.");
      return;
    }

    setUploadBusy(true);
    setUploadError(null);
    try {
      const blobId = createBlobId("pdf");
      const savedAt = new Date().toISOString();
      await saveBlobRecord({
        id: blobId,
        kind: "pdf",
        blob: file,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        fileSize: file.size,
        createdAt: savedAt
      });

      const vaultFile = vaultStatus.connected ? await saveFileToLocalVault(file) : null;
      createUploadedPdf(orb.id, {
        originalFileName: vaultFile?.originalFileName ?? file.name,
        fileName: vaultFile?.fileName ?? file.name,
        fileSize: vaultFile?.fileSize ?? file.size,
        mimeType: vaultFile?.mimeType || file.type || "application/pdf",
        savedAt: vaultFile?.savedAt ?? savedAt,
        blobId,
        vaultPath: vaultFile?.vaultPath
      });
      setChamberView("library");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "No se pudo guardar el PDF.");
    } finally {
      setUploadBusy(false);
    }
  };

  return (
    <main className="knowledge-chamber-page bookshelf-chamber" style={{ "--accent": orb.color } as CSSProperties}>
      <KnowledgeChamberTopBar
        orb={orb}
        currentView={chamberView}
        onChangeView={setChamberView}
        onBack={returnToSkillTree}
        searchQuery={chamberSearch}
        onSearchChange={setChamberSearch}
        favoritesOnly={favoritesOnly}
        onToggleFavorites={() => setFavoritesOnly((current) => !current)}
        onUploadPdf={() => fileInputRef.current?.click()}
        uploadBusy={uploadBusy}
      />
      <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/pdf" onChange={handlePdfSelected} />
      {uploadError && <div className="chamber-upload-error">{uploadError}</div>}
      <section className="bookshelf-chamber-stage">
        {chamberView === "canvas" ? (
          <CanvasView orb={orb} onUploadPdf={() => fileInputRef.current?.click()} />
        ) : (
          <LibraryView
            orb={orb}
            documents={orbDocuments}
            searchQuery={chamberSearch}
            favoritesOnly={favoritesOnly}
            onOpenDocument={openDocument}
            onUploadPdf={() => fileInputRef.current?.click()}
          />
        )}
      </section>
      {readerDocument && <PdfReaderView document={readerDocument} onClose={() => setReaderDocumentId(null)} />}
    </main>
  );
}
