"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, MessageCircle, Play, X } from "lucide-react";
import type { Comment, MediaItem } from "@/lib/types";
import { getEmbeddableVideoUrl, isDirectVideoUrl } from "@/lib/media-url";
import { CommentBox } from "./comment-box";

export function MediaCard({
  eventId,
  item,
  comments,
  viewerAuthenticated,
  scopeLabel = "Manifestazione generale",
  scopeHref
}: {
  eventId: string;
  item: MediaItem;
  comments: Comment[];
  viewerAuthenticated: boolean;
  scopeLabel?: string;
  scopeHref?: string;
}) {
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
    <article className="media-thumb media-card media-smart-card">
      <div className="media-smart-preview">
        <button className="media-smart-open" type="button" onClick={() => setIsViewerOpen(true)} aria-label={`Apri ${item.title}`}>
          <MediaVisual item={item} embedUrl={embedUrl} mode="thumb" />
          {item.type === "video" ? <span className="media-play-pill"><Play size={16} /> Video</span> : null}
        </button>
        <ScopeBadge label={scopeLabel} href={scopeHref} />
        <div className="media-hero-actions" aria-label="Interazioni media">
          <button className="media-hero-button" type="button" onClick={like} disabled={isPending} aria-label="Metti like">
            <Heart size={16} /> {likes}
          </button>
          <button className="media-hero-button" type="button" onClick={() => setIsViewerOpen(true)} aria-label="Apri commenti">
            <MessageCircle size={16} /> {comments.length}
          </button>
        </div>
      </div>
      <div className="media-smart-caption">
        <strong>{item.title}</strong>
        {item.caption ? <p>{item.caption}</p> : null}
        {item.authorName ? <span>Condiviso da {item.authorName}</span> : null}
      </div>
      {isViewerOpen ? (
        <div className="media-viewer" role="dialog" aria-modal="true" aria-label={item.title}>
          <button className="media-viewer-backdrop" type="button" onClick={() => setIsViewerOpen(false)} aria-label="Chiudi media" />
          <div className="media-viewer-panel">
            <button className="media-viewer-close" type="button" onClick={() => setIsViewerOpen(false)} aria-label="Chiudi">
              <X size={20} />
            </button>
            <div className="media-viewer-stage">
              <MediaVisual item={item} embedUrl={embedUrl} mode="viewer" />
            </div>
            <aside className="media-viewer-details">
              <ScopeBadge label={scopeLabel} href={scopeHref} inline />
              <h3>{item.title}</h3>
              {item.caption ? <p className="formatted-description">{item.caption}</p> : null}
              {item.authorName ? <p className="media-author">Condiviso da {item.authorName}</p> : null}
              <div className="media-viewer-stats">
                <button className="like-button" type="button" onClick={like} disabled={isPending} aria-label="Metti like">
                  <Heart size={17} /> {likes}
                </button>
                <span><MessageCircle size={16} /> {comments.length} commenti</span>
              </div>
              {message ? <p className="muted">{message}</p> : null}
              {item.commentsEnabled ? (
                <CommentBox eventId={eventId} targetType="media" targetId={item.id} comments={comments} compact viewerAuthenticated={viewerAuthenticated} />
              ) : (
                <div className="empty">Commenti disattivati per questo contenuto.</div>
              )}
            </aside>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ScopeBadge({ label, href, inline = false }: { label: string; href?: string; inline?: boolean }) {
  const className = `media-scope-pill ${inline ? "inline" : ""} ${href ? "clickable" : ""}`;

  if (href) {
    return <Link className={className} href={href}>{label}</Link>;
  }

  return <span className={className}>{label}</span>;
}

function MediaVisual({ item, embedUrl, mode }: { item: MediaItem; embedUrl: string; mode: "thumb" | "viewer" }) {
  if (item.type === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={mode === "viewer" ? "media-viewer-image" : ""} src={item.url} alt={item.title} />
    );
  }

  if (isDirectVideoUrl(item.url)) {
    return <video className={mode === "viewer" ? "media-viewer-video" : "media-video-thumb"} src={item.url} controls={mode === "viewer"} muted={mode === "thumb"} />;
  }

  if (embedUrl) {
    return <iframe className={mode === "viewer" ? "media-viewer-embed" : "media-embed-thumb"} src={embedUrl} title={item.title} allowFullScreen />;
  }

  return (
    <span className="media-external-link">
      Apri video
    </span>
  );
}
