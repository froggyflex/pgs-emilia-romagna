"use client";

import { useId, useState, useTransition } from "react";
import type { Comment } from "@/lib/types";

type Props = {
  eventId: string;
  targetType: "event" | "feed" | "media";
  targetId: string;
  comments: Comment[];
  compact?: boolean;
  viewerAuthenticated: boolean;
};

export function CommentBox({ eventId, targetType, targetId, comments: initialComments, compact = false, viewerAuthenticated }: Props) {
  const commentInputId = useId();
  const [body, setBody] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, targetType, targetId, body })
      });

      if (response.status === 401) {
        setMessage("Accedi con Google per commentare.");
        return;
      }

      if (!response.ok) {
        setMessage("Il commento non è stato salvato.");
        return;
      }

      const saved = await response.json();
      setComments((items) => [saved, ...items]);
      setBody("");
    });
  }

  return (
    <div className={compact ? "compact-comments" : ""}>
      {viewerAuthenticated ? (
        <>
          <div className="field">
            <label htmlFor={commentInputId}>Aggiungi commento</label>
            <textarea id={commentInputId} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Scrivi un commento..." />
          </div>
          <div className="toolbar" style={{ marginTop: 10 }}>
            <button className="button" type="button" onClick={submit} disabled={isPending || body.trim().length === 0}>
              Pubblica
            </button>
            {message ? <span className="muted">{message}</span> : null}
          </div>
        </>
      ) : (
        <div className="interaction-lock">Accedi con Google per commentare.</div>
      )}
      {comments.length === 0 ? <div className="empty">Nessun commento pubblicato.</div> : null}
      {comments.map((comment) => (
        <article className="comment" key={comment.id}>
          <strong>{comment.authorName}</strong>
          <p>{comment.body}</p>
        </article>
      ))}
    </div>
  );
}
