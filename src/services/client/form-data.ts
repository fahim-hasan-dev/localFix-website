export function jsonFormData(
  data: unknown,
  files?: Record<string, File | Blob | Array<File | Blob> | null | undefined>,
) {
  const body = new FormData();
  body.append("data", JSON.stringify(data));
  if (!files) return body;

  for (const [key, value] of Object.entries(files)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((file) => body.append(key, file));
    } else {
      body.append(key, value);
    }
  }
  return body;
}

export function apiErrorMessage(error: unknown, fallback: string) {
  const apiErr = error as { data?: { message?: string }; error?: string };
  return apiErr?.data?.message || apiErr?.error || fallback;
}
