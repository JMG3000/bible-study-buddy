export const POST_AUTH_REDIRECT_COOKIE = "bsb_post_auth_redirect";
export const IDLE_SESSION_STORAGE_KEY = "bsb_last_activity";
export const IDLE_ACTIVITY_COOKIE = "bsb_last_activity_at";
export const IDLE_SESSION_TIMEOUT_MS = 60 * 60 * 1000;
export const AUTH_SESSION_EXPIRED_MESSAGE =
  "Your session expired after inactivity. Please sign in again.";

export function sanitizeNextPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/dashboard",
) {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function appendMessage(
  path: string,
  key: string,
  value: string,
) {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set(key, value);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function slugifyText(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "lesson";
}
