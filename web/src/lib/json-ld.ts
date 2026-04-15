export function serializeJsonLd(payload: object) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
