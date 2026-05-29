"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MediaContributionForm({
  eventSlug,
  viewerIsAdmin
}: {
  eventSlug: string;
  viewerIsAdmin: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function publish() {
    const files = fileRef.current?.files;

    if (!files?.length) {
      setMessage("Seleziona almeno una foto o un video.");
      return;
    }

    startTransition(async () => {
      setMessage("");
      const formData = new FormData();
      formData.set("caption", caption);
      Array.from(files).forEach((file) => formData.append("file", file));

      const response = await fetch(`/api/events/${eventSlug}/media`, {
        method: "POST",
        body: formData
      });

      if (response.status === 401) {
        setMessage("Accesso admin richiesto.");
        return;
      }

      if (response.status === 403) {
        setMessage("Solo gli amministratori possono pubblicare foto o video.");
        return;
      }

      if (!response.ok) {
        setMessage("Pubblicazione non riuscita.");
        return;
      }

      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      setMessage("Contenuto pubblicato.");
      router.refresh();
    });
  }

  if (!viewerIsAdmin) {
    return null;
  }

  return (
    <div className="community-composer">
      <label className="media-upload-dropzone compact-dropzone">
        <ImagePlus size={20} />
        <strong>Pubblica foto o video</strong>
        <span>Seleziona uno o piu contenuti per questa manifestazione.</span>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple />
      </label>
      <label className="field">
        <span>Didascalia</span>
        <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Aggiungi una didascalia" />
      </label>
      <div className="toolbar">
        <button className="button" type="button" onClick={publish} disabled={isPending}>Pubblica</button>
        {message ? <span className="muted">{message}</span> : null}
      </div>
    </div>
  );
}
