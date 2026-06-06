import { BookOpen } from "lucide-react";
import type { KnowledgeDocument } from "../../types/models";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { FullscreenReader } from "./FullscreenReader";
import { NoteReaderEditor } from "./NoteReaderEditor";
import { PDFReader } from "./PDFReader";

export function DocumentReader({ document }: { document: KnowledgeDocument | null }) {
  const fullScreenReader = useKnowledgeStore((state) => state.fullScreenReader);

  if (!document) {
    return (
      <section className="document-reader glass-panel empty">
        <BookOpen size={24} />
        <h2>Select an archive object</h2>
      </section>
    );
  }

  const content =
    document.type === "pdf" ? <PDFReader document={document} /> : <NoteReaderEditor document={document} />;

  return (
    <section className="document-reader glass-panel">
      <FullscreenReader enabled={fullScreenReader} title={document.title}>
        {content}
      </FullscreenReader>
    </section>
  );
}
