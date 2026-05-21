"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { Comment, MediaItem } from "@/lib/types";
import { CommentBox } from "./comment-box";

export function MediaCard({ eventId, item, comments }: { eventId: string; item: MediaItem; comments: Comment[] }) {
  const [likes, setLikes] = useState(item.likes || 0);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

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
        <Image src={item.url} width={640} height={480} alt={item.title} />
      ) : isStoredVideo(item.url) ? (
        <video className="embed media-video" src={item.url} controls />
      ) : (
        <iframe className="embed" src={item.url} title={item.title} allowFullScreen />
      )}
      <div className="card-body media-card-body">
        <div className="media-title-row">
          <div>
            <strong>{item.title}</strong>
            <p className="muted">{item.caption}</p>
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
          <CommentBox eventId={eventId} targetType="media" targetId={item.id} comments={comments} compact />
        ) : (
          <div className="empty">Commenti disattivati per questo contenuto.</div>
        )}
      </div>
    </article>
  );
}

function isStoredVideo(url: string) {
  return url.includes("/uploads/") || /\.(mp4|webm|mov)(?:\?|$)/i.test(url);
}
