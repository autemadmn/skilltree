import { ChevronLeft, ChevronRight, Maximize2, RotateCw, Search, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument } from "../../types/models";

export function PDFReader({ document }: { document: KnowledgeDocument }) {
  const setFullScreenReader = useKnowledgeStore((state) => state.setFullScreenReader);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const pages = document.metadata.pages ?? 1;

  return (
    <div className="pdf-reader">
      <div className="reader-toolbar">
        <button className="icon-button" onClick={() => setPage((current) => Math.max(1, current - 1))}>
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button className="icon-button" onClick={() => setPage((current) => Math.min(pages, current + 1))}>
          <ChevronRight size={16} />
        </button>
        <div className="reader-toolbar-divider" />
        <button className="icon-button">
          <Search size={16} />
        </button>
        <button className="icon-button" onClick={() => setZoom((current) => Math.max(0.65, current - 0.1))}>
          <ZoomOut size={16} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button className="icon-button" onClick={() => setZoom((current) => Math.min(1.8, current + 0.1))}>
          <ZoomIn size={16} />
        </button>
        <button className="icon-button">
          <RotateCw size={16} />
        </button>
        <button className="icon-button" onClick={() => setFullScreenReader(true)}>
          <Maximize2 size={16} />
        </button>
      </div>
      <div className="pdf-stage">
        {/* To render real PDFs, install react-pdf/pdfjs and replace this placeholder page with <Document><Page /></Document>. */}
        <article className="mock-pdf-page" style={{ transform: `scale(${zoom})` }}>
          <div className="mock-pdf-kicker">PDF Archive</div>
          <h1>{document.title}</h1>
          <p>{document.metadata.summary ?? document.subtitle ?? "PDF placeholder ready for a local file URL."}</p>
          <div className="mock-pdf-line wide" />
          <div className="mock-pdf-line" />
          <div className="mock-pdf-line short" />
          <div className="mock-pdf-columns">
            <div />
            <div />
          </div>
          {document.metadata.vaultPath && <div className="mock-annotation">Vault file: {document.metadata.vaultPath}</div>}
          <div className="mock-annotation">Annotation-ready layer</div>
        </article>
      </div>
    </div>
  );
}
