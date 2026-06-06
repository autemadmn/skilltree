import { Maximize2, Pencil, Save, Star, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { KnowledgeDocument } from "../../types/models";
import { formatDate } from "../../utils/geometry";

export function NoteReaderEditor({ document }: { document: KnowledgeDocument }) {
  const updateDocument = useKnowledgeStore((state) => state.updateDocument);
  const setFullScreenReader = useKnowledgeStore((state) => state.setFullScreenReader);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [subtitle, setSubtitle] = useState(document.subtitle ?? "");
  const [tags, setTags] = useState(document.tags.join(", "));
  const [content, setContent] = useState(document.content ?? "");

  useEffect(() => {
    setTitle(document.title);
    setSubtitle(document.subtitle ?? "");
    setTags(document.tags.join(", "));
    setContent(document.content ?? "");
    setEditing(false);
  }, [document.id, document.content, document.subtitle, document.tags, document.title]);

  const save = () => {
    updateDocument(document.id, {
      title,
      subtitle,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      content,
      metadata: {
        ...document.metadata,
        readingTime: `${Math.max(1, Math.round(content.split(/\s+/).length / 210))} min`
      }
    });
    setEditing(false);
  };

  return (
    <div className="note-reader">
      <div className="reader-toolbar">
        <button className={`toolbar-button ${editing ? "primary" : ""}`} onClick={() => (editing ? save() : setEditing(true))}>
          {editing ? <Save size={16} /> : <Pencil size={16} />}
          {editing ? "Save" : "Edit"}
        </button>
        <button className="icon-button" onClick={() => updateDocument(document.id, { favorite: !document.favorite })}>
          <Star size={16} fill={document.favorite ? "currentColor" : "none"} />
        </button>
        <button className="icon-button">
          <Tag size={16} />
        </button>
        <button className="icon-button" onClick={() => setFullScreenReader(true)}>
          <Maximize2 size={16} />
        </button>
      </div>

      {editing ? (
        <div className="note-editor">
          <input className="note-title-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="note-subtitle-input" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          <input className="note-tags-input" value={tags} onChange={(event) => setTags(event.target.value)} />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} />
        </div>
      ) : (
        <article className="note-document">
          <div className="note-meta-row">
            <span>{document.type.toUpperCase()}</span>
            <span>{formatDate(document.updatedAt)}</span>
            <span>{document.metadata.readingTime ?? "1 min"}</span>
          </div>
          <h1>{document.title}</h1>
          {document.subtitle && <p className="note-subtitle">{document.subtitle}</p>}
          <div className="tag-row">
            {document.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="note-body">
            {(document.content ?? "").split("\n").map((line, index) => {
              if (line.startsWith("# ")) return <h2 key={index}>{line.replace("# ", "")}</h2>;
              if (line.startsWith("## ")) return <h3 key={index}>{line.replace("## ", "")}</h3>;
              if (line.startsWith("> ")) return <blockquote key={index}>{line.replace("> ", "")}</blockquote>;
              if (line.startsWith("- ")) return <p key={index} className="note-bullet">{line}</p>;
              return line.trim() ? <p key={index}>{line}</p> : <br key={index} />;
            })}
          </div>
        </article>
      )}
    </div>
  );
}
