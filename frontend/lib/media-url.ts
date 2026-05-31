export function inferMediaTypeFromUrl(url: string): "photo" | "video" {
  return isDirectVideoUrl(url) || getEmbeddableVideoUrl(url) ? "video" : "photo";
}

export function isDirectVideoUrl(url: string) {
  return url.includes("/uploads/") || /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(url);
}

export function getEmbeddableVideoUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}${youtubeStartQuery(parsed)}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const id = parsed.searchParams.get("v") || (["embed", "live", "shorts"].includes(pathParts[0]) ? pathParts[1] : "");
      return id ? `https://www.youtube.com/embed/${id}${youtubeStartQuery(parsed)}` : "";
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }

    if (host === "player.vimeo.com") {
      return trimmed;
    }

    if (host === "drive.google.com") {
      const id = getGoogleDriveFileId(parsed);
      return id ? `https://drive.google.com/file/d/${id}/preview` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function getGoogleDriveFileId(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  const fileIndex = parts.indexOf("d");

  if (parts[0] === "file" && fileIndex !== -1 && parts[fileIndex + 1]) {
    return parts[fileIndex + 1];
  }

  return url.searchParams.get("id") || "";
}

export function titleFromMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    return decodeURIComponent(lastSegment).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  } catch {
    return "Media";
  }
}

function youtubeStartQuery(url: URL) {
  const start = url.searchParams.get("start") || url.searchParams.get("t");

  if (!start) {
    return "";
  }

  const seconds = /^\d+$/.test(start) ? start : "";
  return seconds ? `?start=${seconds}` : "";
}
