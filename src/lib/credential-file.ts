export type DocReviewStatus = "verified" | "review" | "needed";

export interface CredentialFile {
  name: string;
  sizeLabel: string;
  kind: "pdf" | "image";
  uploadedAt: string;
  status: DocReviewStatus;
  previewUrl?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateCredentialFile(file: File) {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return "Use a PDF, JPG, or PNG.";
  if (file.size > MAX_BYTES) return "File must be under 10 MB.";
  return null;
}

export function fileFromUpload(file: File): CredentialFile {
  return {
    name: file.name,
    sizeLabel: formatFileSize(file.size),
    kind: file.type.includes("pdf") ? "pdf" : "image",
    uploadedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: "review",
    previewUrl: URL.createObjectURL(file),
  };
}

/** Empty placeholders kept for form defaults — no demo filenames. */
export function defaultLicenseDoc(): CredentialFile {
  return {
    name: "",
    sizeLabel: "",
    kind: "pdf",
    uploadedAt: "",
    status: "needed",
  };
}

export function defaultInsuranceDoc(): CredentialFile {
  return {
    name: "",
    sizeLabel: "",
    kind: "pdf",
    uploadedAt: "",
    status: "needed",
  };
}

export function defaultIdDoc(): CredentialFile {
  return {
    name: "",
    sizeLabel: "",
    kind: "image",
    uploadedAt: "",
    status: "needed",
  };
}
