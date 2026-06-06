import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Activity, Link2, Tag } from "lucide-react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { formatDate } from "../../utils/geometry";
import { CanvasView } from "./CanvasView";
import { ChamberSidebar } from "./ChamberSidebar";
import { ChamberTopBar } from "./ChamberTopBar";
import { DocumentLibrary } from "./DocumentLibrary";
import { DocumentReader } from "./DocumentReader";
import { EmptyChamberState } from "./EmptyChamberState";
import { SettingsPanel } from "./SettingsPanel";

export function KnowledgeChamberPage() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const documents = useKnowledgeStore((state) => state.documents);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const selectedDocumentId = useKnowledgeStore((state) => state.selectedDocumentId);
  const setSelectedDocument = useKnowledgeStore((state) => state.setSelectedDocument);
  const chamberView = useKnowledgeStore((state) => state.chamberView);
  const fullScreenReader = useKnowledgeStore((state) => state.fullScreenReader);
  const activities = useKnowledgeStore((state) => state.activities);
  const orb = orbs[selectedOrbId] ?? orbs["curiosity-core"];

  const orbDocuments = useMemo(() => orb.documentIds.map((id) => documents[id]).filter(Boolean), [documents, orb.documentIds]);
  const selectedDocument = selectedDocumentId ? documents[selectedDocumentId] : null;

  useEffect(() => {
    if (orbDocuments.length && (!selectedDocument || selectedDocument.orbId !== orb.id)) {
      setSelectedDocument(orbDocuments[0].id);
    }
    if (!orbDocuments.length && selectedDocument) {
      setSelectedDocument(null);
    }
  }, [orb.id, orbDocuments, selectedDocument, setSelectedDocument]);

  const recentActivity = activities.filter((activity) => activity.orbId === orb.id).slice(0, 4);

  return (
    <main
      className={`knowledge-chamber-page ${fullScreenReader ? "reader-is-fullscreen" : ""}`}
      style={{ "--accent": orb.color } as CSSProperties}
    >
      <ChamberSidebar orb={orb} />
      <section className="chamber-main">
        <ChamberTopBar orb={orb} />
        {chamberView === "canvas" ? (
          <CanvasView orb={orb} />
        ) : chamberView === "settings" ? (
          <div className="chamber-settings-surface">
            <SettingsPanel inline />
          </div>
        ) : orbDocuments.length === 0 ? (
          <EmptyChamberState orb={orb} />
        ) : (
          <div className="chamber-workspace">
            <DocumentLibrary orb={orb} />
            <DocumentReader document={selectedDocument} />
            <aside className="document-info-panel glass-panel">
              {selectedDocument ? (
                <>
                  <div className="panel-title-row">
                    <div>
                      <p className="eyebrow">Document Info</p>
                      <h2>{selectedDocument.title}</h2>
                    </div>
                  </div>
                  <div className="detail-meta compact">
                    <div>
                      <span>Type</span>
                      <strong>{selectedDocument.type.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span>Added</span>
                      <strong>{formatDate(selectedDocument.createdAt)}</strong>
                    </div>
                    <div>
                      <span>Updated</span>
                      <strong>{formatDate(selectedDocument.updatedAt)}</strong>
                    </div>
                    <div>
                      <span>Read</span>
                      <strong>{selectedDocument.metadata.readingTime ?? `${selectedDocument.metadata.pages ?? 1} pages`}</strong>
                    </div>
                  </div>
                  <div className="tag-row">
                    {selectedDocument.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="side-section">
                    <h3>
                      <Link2 size={14} />
                      Related Concepts
                    </h3>
                    {selectedDocument.relatedOrbIds.map((id) => (
                      <div key={id} className="related-item">
                        <i style={{ background: orbs[id]?.color ?? orb.color }} />
                        {orbs[id]?.title ?? id}
                      </div>
                    ))}
                  </div>
                  <div className="side-section">
                    <h3>
                      <Tag size={14} />
                      Summary
                    </h3>
                    <p>{selectedDocument.metadata.summary ?? selectedDocument.subtitle ?? "No summary yet."}</p>
                  </div>
                </>
              ) : (
                <div className="empty-panel-small">Select an archive object</div>
              )}

              <div className="side-section">
                <h3>
                  <Activity size={14} />
                  Recent Activity
                </h3>
                {recentActivity.length ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <strong>{activity.action}</strong>
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p>No activity yet.</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </section>
      {!fullScreenReader && <SettingsPanel />}
    </main>
  );
}
