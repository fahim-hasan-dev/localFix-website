function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export const baseUrl = getBaseUrl();
