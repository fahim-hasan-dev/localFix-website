/**
 * Avatar helper — never invents stock photos.
 * Returns a real mapped URL only when explicitly known; otherwise empty string
 * so UI can show initials / a neutral avatar instead of a fake face.
 */

/**
 * @deprecated Prefer real `profileImage` / `avatar` from the API.
 * Kept as a no-op fallback so call sites that still OR this never get Unsplash faces.
 */
export function getAvatar(_name?: string, _id?: string): string {
  return "";
}
