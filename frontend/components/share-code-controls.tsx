"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareCodeControls({ url, qrDataUrl, fileName }: { url: string; qrDataUrl: string; fileName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "PGS Eventi Live", text: "Apri evento PGS Eventi Live", url });
      return;
    }

    await copyLink();
  }

  return (
    <div className="share-code-actions">
      <button className="ghost-button" type="button" onClick={shareLink}>
        <Share2 size={17} /> Condividi
      </button>
      <button className="ghost-button" type="button" onClick={copyLink}>
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? "Copiato" : "Copia link"}
      </button>
      <a className="ghost-button" href={qrDataUrl} download={fileName}>
        <Download size={17} /> Scarica QR
      </a>
    </div>
  );
}
