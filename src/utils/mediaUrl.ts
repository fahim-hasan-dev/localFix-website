/**
 * Media/file origin (no `/api/v1`).
 * Prefer NEXT_PUBLIC_BASE_URL; fall back to stripping `/api/v1` from the API URL.
 */
function getMediaOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/api\/v1\/?$/i, "") ||
    "http://localhost:8000";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export const mediaOrigin = getMediaOrigin();

/**
 * Join the media base URL with a relative upload path from the API.
 * Absolute http(s)/data/blob URLs are returned unchanged.
 */
export function mediaUrl(path?: string | null): string {
  if (!path) return "";
  const trimmed = String(path).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  // Already includes the same host — leave as-is.
  if (trimmed.startsWith(mediaOrigin)) return trimmed;

  return `${mediaOrigin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
