export type ApiRecord = Record<string, unknown>;

/** Backend may return the user directly or nested under `user`. */
export function unwrapRecord(data: unknown): ApiRecord | null {
  if (!data || typeof data !== "object") return null;
  const record = data as ApiRecord;
  const nested = record.user;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as ApiRecord;
  return record;
}

export function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

export function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && value !== "" && value !== null && value !== undefined ? n : fallback;
}

/** Category may be populated ({_id, name}) or a bare id string. */
export function refId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return str((value as ApiRecord)._id);
  return "";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Best-effort sanitizer for admin-authored rule HTML (strips active content). */
function sanitizeHtml(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed|link|meta|form)[\s\S]*?(<\/\1\s*>|$)/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta|form)\b[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*("|')?/gi, "$1=\"#\"");
}

/** Converts API rule content (HTML or plain text) into safe HTML for rendering. */
export function ruleContentToHtml(content: string) {
  if (/<\/?[a-z][\s\S]*?>/i.test(content)) return sanitizeHtml(content);
  return escapeHtml(content.trim())
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** True when API rule content is more than a placeholder word (e.g. literally "about"). */
export function isRealRuleContent(content?: string | null): content is string {
  if (!content) return false;
  const plain = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  if (plain.length < 40) return false;
  return !["about", "terms", "privacy"].includes(plain.toLowerCase());
}
