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
