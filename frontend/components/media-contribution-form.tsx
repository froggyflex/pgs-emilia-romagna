"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type EventMediaUploadSession = {
  uploadUrl: string;
  token: string;
  authorName: string;
  authorEmail: string;
  authorImage?: string;
  maxSizeMb?: number;
};

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
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  function publish() {
    const files = fileRef.current?.files;

    if (!files?.length) {
      setMessage("Seleziona almeno una foto o un video.");
      return;
    }

    setIsPublishing(true);
    setUploadProgress(0);

    void (async () => {
      setMessage("");
      const sessionResponse = await fetch(`/api/events/${eventSlug}/media/direct`, { method: "POST" });
      const session = await sessionResponse.json().catch(() => null) as EventMediaUploadSession | null;

      if (sessionResponse.status === 401) {
        setMessage("Accesso admin richiesto.");
        setIsPublishing(false);
        setUploadProgress(null);
        return;
      }

      if (sessionResponse.status === 403) {
        setMessage("Solo gli amministratori possono pubblicare foto o video.");
        setIsPublishing(false);
        setUploadProgress(null);
        return;
      }

      if (!sessionResponse.ok || !session?.uploadUrl || !session.token) {
        setMessage("Preparazione caricamento non riuscita.");
        setIsPublishing(false);
        setUploadProgress(null);
        return;
      }

      if (session.maxSizeMb) {
        const maxBytes = session.maxSizeMb * 1024 * 1024;
        const tooLarge = Array.from(files).find((file) => file.size > maxBytes);

        if (tooLarge) {
          setMessage(`${tooLarge.name} supera il limite di ${session.maxSizeMb} MB.`);
          setIsPublishing(false);
          setUploadProgress(null);
          return;
        }
      }

      const formData = new FormData();
      formData.set("caption", caption);
      formData.set("authorName", session.authorName);
      formData.set("authorEmail", session.authorEmail);
      if (session.authorImage) formData.set("authorImage", session.authorImage);
      Array.from(files).forEach((file) => formData.append("file", file));

      const response = await uploadWithProgress(session.uploadUrl, session.token, formData, (percent) => {
        setUploadProgress(percent);
        setMessage(percent >= 100 ? "Video caricato, pubblicazione in corso..." : `Caricamento ${percent}%`);
      });

      if (response.status === 401) {
        setMessage("Accesso admin richiesto.");
        setIsPublishing(false);
        window.setTimeout(() => setUploadProgress(null), 1400);
        return;
      }

      if (response.status === 403) {
        setMessage("Solo gli amministratori possono pubblicare foto o video.");
        setIsPublishing(false);
        window.setTimeout(() => setUploadProgress(null), 1400);
        return;
      }

      if (!response.ok) {
        const payload = response.payload;
        setMessage(payload?.message || "Pubblicazione non riuscita.");
        setIsPublishing(false);
        window.setTimeout(() => setUploadProgress(null), 1400);
        return;
      }

      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      setMessage("Contenuto pubblicato.");
      setIsPublishing(false);
      window.setTimeout(() => setUploadProgress(null), 1400);
      router.refresh();
    })().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Pubblicazione non riuscita.");
      setIsPublishing(false);
      window.setTimeout(() => setUploadProgress(null), 1400);
    });
  }

  if (!viewerIsAdmin) {
    return null;
  }

  return (
    <div className="community-composer">
      <label className="media-upload-dropzone compact-dropzone">
        <ImagePlus size={20} />
        <strong>{isPublishing ? "Caricamento in corso..." : "Pubblica foto o video"}</strong>
        <span>Seleziona uno o piu contenuti per questa manifestazione.</span>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple disabled={isPublishing} />
      </label>
      {uploadProgress !== null ? <UploadProgress percent={uploadProgress} /> : null}
      <label className="field">
        <span>Didascalia</span>
        <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Aggiungi una didascalia" />
      </label>
      <div className="toolbar">
        <button className="button" type="button" onClick={publish} disabled={isPublishing}>Pubblica</button>
        {message ? <span className="muted">{message}</span> : null}
      </div>
    </div>
  );
}

function uploadWithProgress(
  uploadUrl: string,
  token: string,
  formData: FormData,
  onProgress: (percent: number) => void
) {
  return new Promise<{ ok: boolean; status: number; payload: { message?: string } | null }>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("POST", uploadUrl);
    request.setRequestHeader("x-upload-token", token);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    request.onload = () => {
      onProgress(100);
      resolve({
        ok: request.status >= 200 && request.status < 300,
        status: request.status,
        payload: parsePayload(request.responseText)
      });
    };

    request.onerror = () => reject(new Error("Connessione interrotta durante il caricamento."));
    request.onabort = () => reject(new Error("Caricamento annullato."));
    request.send(formData);
  });
}

function parsePayload(raw: string) {
  try {
    return raw ? JSON.parse(raw) as { message?: string } : null;
  } catch {
    return null;
  }
}

function UploadProgress({ percent }: { percent: number }) {
  return (
    <div className="upload-progress" aria-label={`Caricamento ${percent}%`}>
      <div className="upload-progress-header">
        <span>Caricamento media</span>
        <strong>{percent}%</strong>
      </div>
      <div className="upload-progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
