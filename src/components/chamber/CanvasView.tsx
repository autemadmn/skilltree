import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";
import { CanvasCard } from "./CanvasCard";

type CardPositions = Record<string, { x: number; y: number }>;

export function CanvasView({ orb, onUploadPdf }: { orb: OrbNode; onUploadPdf?: () => void }) {
  const documents = useKnowledgeStore((state) => state.documents);
  const selectedDocumentId = useKnowledgeStore((state) => state.selectedDocumentId);
  const setSelectedDocument = useKnowledgeStore((state) => state.setSelectedDocument);
  const deleteDocument = useKnowledgeStore((state) => state.deleteDocument);
  const [scale, setScale] = useState(1);
  const docs = useMemo(() => orb.documentIds.map((id) => documents[id]).filter(Boolean), [documents, orb.documentIds]);
  const [positions, setPositions] = useState<CardPositions>({});

  useEffect(() => {
    setPositions((current) => {
      const next: CardPositions = {};
      docs.forEach((document, index) => {
        const angle = (index / Math.max(docs.length, 1)) * Math.PI * 2;
        next[document.id] = current[document.id] ?? {
          x: 360 + Math.cos(angle) * (180 + (index % 3) * 40),
          y: 210 + Math.sin(angle) * (125 + (index % 2) * 55)
        };
      });
      return next;
    });
  }, [docs]);

  const docIds = useMemo(() => new Set(docs.map((document) => document.id)), [docs]);
  const links = useMemo(
    () =>
      docs.flatMap((document) =>
        document.relatedDocumentIds.filter((targetId) => docIds.has(targetId)).map((targetId) => [document.id, targetId] as const)
      ),
    [docIds, docs]
  );

  return (
    <section className="canvas-view glass-panel">
      <div className="canvas-toolbar">
        <div>
          <p className="eyebrow">Canvas View</p>
          <h2>{orb.title}</h2>
        </div>
        <div className="canvas-zoom">
          <button className="icon-button" onClick={() => setScale((current) => Math.max(0.72, current - 0.1))}>
            <Minus size={15} />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button className="icon-button" onClick={() => setScale((current) => Math.min(1.35, current + 0.1))}>
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="canvas-surface">
        {docs.length === 0 ? (
          <div className="canvas-empty-state">
            <h2>No hay nodos todavia</h2>
            <p>Sube el primer PDF para que aparezca aqui como nodo conectado a esta camara.</p>
            {onUploadPdf && (
              <button className="toolbar-button primary" onClick={onUploadPdf}>
                Anadir PDF
              </button>
            )}
          </div>
        ) : (
          <div className="canvas-space" style={{ transform: `scale(${scale})` }}>
            <svg className="canvas-lines" viewBox="0 0 960 620" preserveAspectRatio="none">
              {links.map(([sourceId, targetId]) => {
                const source = positions[sourceId];
                const target = positions[targetId];
                if (!source || !target) return null;
                return (
                  <path
                    key={`${sourceId}-${targetId}`}
                    d={`M ${source.x + 118} ${source.y + 70} C ${source.x + 210} ${source.y - 30}, ${target.x - 80} ${
                      target.y + 160
                    }, ${target.x + 118} ${target.y + 70}`}
                  />
                );
              })}
            </svg>
            {docs.map((document) => (
              <CanvasCard
                key={document.id}
                document={document}
                position={positions[document.id] ?? { x: 0, y: 0 }}
                selected={selectedDocumentId === document.id}
                onSelect={() => setSelectedDocument(document.id)}
                onDelete={() => deleteDocument(document.id)}
                onMove={(id, info) =>
                  setPositions((current) => ({
                    ...current,
                    [id]: {
                      x: (current[id]?.x ?? 0) + info.offset.x,
                      y: (current[id]?.y ?? 0) + info.offset.y
                    }
                  }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
