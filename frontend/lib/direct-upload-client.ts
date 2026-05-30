"use client";

export type DirectUploadResult = {
  files: Array<{ url: string; type: "photo" | "video"; name: string }>;
  url?: string;
};

type DirectUploadSession = {
  uploadUrl: string;
  token: string;
  maxSizeMb?: number;
};

type DirectUploadOptions = {
  files: File[];
  sessionPath?: string;
  extraFields?: Record<string, string>;
  onProgress?: (percent: number) => void;
};

export async function uploadFilesDirect({
  files,
  sessionPath = "/api/uploads/direct",
  extraFields = {},
  onProgress
}: DirectUploadOptions) {
  const sessionResponse = await fetch(sessionPath, { method: "POST" });
  const session = await sessionResponse.json().catch(() => null) as DirectUploadSession | null;

  if (!sessionResponse.ok || !session?.uploadUrl || !session.token) {
    throw new Error("Preparazione caricamento non riuscita.");
  }

  if (session.maxSizeMb) {
    const maxBytes = session.maxSizeMb * 1024 * 1024;
    const tooLarge = files.find((file) => file.size > maxBytes);

    if (tooLarge) {
      throw new Error(`${tooLarge.name} supera il limite di ${session.maxSizeMb} MB.`);
    }
  }

  const formData = new FormData();
  Object.entries(extraFields).forEach(([key, value]) => formData.set(key, value));
  files.forEach((file) => formData.append("file", file));

  return await sendUpload(session.uploadUrl, session.token, formData, onProgress);
}

function sendUpload(uploadUrl: string, token: string, formData: FormData, onProgress?: (percent: number) => void) {
  return new Promise<DirectUploadResult>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("POST", uploadUrl);
    request.setRequestHeader("x-upload-token", token);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    request.onload = () => {
      const payload = parseJson(request.responseText);

      if (request.status < 200 || request.status >= 300 || !payload) {
        reject(new Error(payload?.message || "Caricamento non riuscito."));
        return;
      }

      onProgress?.(100);
      resolve(payload as DirectUploadResult);
    };

    request.onerror = () => reject(new Error("Connessione interrotta durante il caricamento."));
    request.onabort = () => reject(new Error("Caricamento annullato."));
    request.send(formData);
  });
}

function parseJson(raw: string) {
  try {
    return raw ? JSON.parse(raw) as DirectUploadResult & { message?: string } : null;
  } catch {
    return null;
  }
}
