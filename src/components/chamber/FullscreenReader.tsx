import { Minimize2 } from "lucide-react";
import { ReactNode } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";

export function FullscreenReader({ enabled, title, children }: { enabled: boolean; title: string; children: ReactNode }) {
  const setFullScreenReader = useKnowledgeStore((state) => state.setFullScreenReader);

  if (!enabled) return <>{children}</>;

  return (
    <div className="fullscreen-reader">
      <header className="fullscreen-reader-header">
        <strong>{title}</strong>
        <button className="toolbar-button" onClick={() => setFullScreenReader(false)}>
          <Minimize2 size={16} />
          Exit Full Screen
        </button>
      </header>
      <div className="fullscreen-reader-body">{children}</div>
    </div>
  );
}
