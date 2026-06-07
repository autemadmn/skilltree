import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument } from "../../types/models";
import { BookshelfLibrary } from "./BookshelfLibrary";
import { CanvasView } from "./CanvasView";
import { ChamberTopBar } from "./ChamberTopBar";
import { ImmersiveDocumentReader } from "./ImmersiveDocumentReader";

export function KnowledgeChamberPage() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const documents = useKnowledgeStore((state) => state.documents);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const selectedDocumentId = useKnowledgeStore((state) => state.selectedDocumentId);
  const setSelectedDocument = useKnowledgeStore((state) => state.setSelectedDocument);
  const chamberView = useKnowledgeStore((state) => state.chamberView);
  const setChamberView = useKnowledgeStore((state) => state.setChamberView);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [readerDocumentId, setReaderDocumentId] = useState<string | null>(null);
  const orb = orbs[selectedOrbId] ?? orbs["curiosity-core"];

  const orbDocuments = useMemo(() => orb.documentIds.map((id) => documents[id]).filter(Boolean), [documents, orb.documentIds]);
  const activeView = chamberView === "canvas" ? "canvas" : "library";
  const readerDocument = readerDocumentId ? documents[readerDocumentId] : null;

  useEffect(() => {
    if (chamberView !== "library" && chamberView !== "canvas") setChamberView("library");
  }, [chamberView, setChamberView]);

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

  return (
    <main className="knowledge-chamber-page bookshelf-chamber" style={{ "--accent": orb.color } as CSSProperties}>
      <ChamberTopBar orb={orb} favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly((current) => !current)} />
      <section className="bookshelf-chamber-stage">
        {activeView === "canvas" ? (
          <CanvasView orb={orb} />
        ) : (
          <BookshelfLibrary orb={orb} documents={orbDocuments} favoritesOnly={favoritesOnly} onOpenDocument={openDocument} />
        )}
      </section>
      {readerDocument && <ImmersiveDocumentReader document={readerDocument} onClose={() => setReaderDocumentId(null)} />}
    </main>
  );
}
