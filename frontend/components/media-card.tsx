"use client";

import { useState, useTransition } from "react";
import { Heart, Maximize2, MessageCircle, X } from "lucide-react";
import type { Comment, MediaItem } from "@/lib/types";
import { getEmbeddableVideoUrl, isDirectVideoUrl } from "@/lib/media-url";
import { CommentBox } from "./comment-box";

export function MediaCard({ eventId, item, comments, viewerAuthenticated }: { eventId: string; item: MediaItem; comments: Comment[]; viewerAuthenticated: boolean }) {
  const [likes, setLikes] = useState(item.likes || 0);
  const [message, setMessage] = useState("");
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const embedUrl = item.type === "video" ? getEmbeddableVideoUrl(item.url) : "";

  function like() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/media/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSlug: eventId, mediaId: item.id })
      });

      if (!response.ok) {
        setMessage("Like non salvato.");
        return;
      }

      const result = await response.json() as { likes: number };
      setLikes(result.likes);
    });
  }

  return (
    <article className="media-thumb media-card">
      {item.type === "photo" ? (
        <button className="media-preview-button" type="button" onClick={() => setIsViewerOpen(true)} aria-label="Apri foto intera">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.title} />
          <span><Maximize2 size={16} /> Apri</span>
        </button>
      ) : isDirectVideoUrl(item.url) ? (
        <video className="embed media-video" src={item.url} controls />
      ) : embedUrl ? (
        <iframe className="embed" src={embedUrl} title={item.title} allowFullScreen />
      ) : (
        <a className="media-external-link" href={item.url} target="_blank" rel="noreferrer">Apri video</a>
      )}
      <div className="card-body media-card-body">
        <div className="media-title-row">
          <div>
            <strong>{item.title}</strong>
            <p className="muted">{item.caption}</p>
            {item.authorName ? <p className="media-author">Condiviso da {item.authorName}</p> : null}
          </div>
          <button className="like-button" type="button" onClick={like} disabled={isPending} aria-label="Metti like">
            <Heart size={17} /> {likes}
          </button>
        </div>
        <div className="media-comment-count">
          <MessageCircle size={16} /> {comments.length} commenti
        </div>
        {message ? <p className="muted">{message}</p> : null}
        {item.commentsEnabled ? (
          <CommentBox eventId={eventId} targetType="media" targetId={item.id} comments={comments} compact viewerAuthenticated={viewerAuthenticated} />
        ) : (
          <div className="empty">Commenti disattivati per questo contenuto.</div>
        )}
      </div>
      {item.type === "photo" && isViewerOpen ? (
        <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={item.title}>
          <button className="media-lightbox-backdrop" type="button" onClick={() => setIsViewerOpen(false)} aria-label="Chiudi foto" />
          <div className="media-lightbox-content">
            <button className="media-lightbox-close" type="button" onClick={() => setIsViewerOpen(false)} aria-label="Chiudi">
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="media-lightbox-image" src={item.url} alt={item.title} />
            <div className="media-lightbox-caption">
              <strong>{item.title}</strong>
              {item.caption ? <span>{item.caption}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
