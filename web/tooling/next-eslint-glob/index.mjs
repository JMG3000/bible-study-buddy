import { isAbsolute } from "node:path";
import { globSync as discoverDirectories } from "tinyglobby";

// Intentionally supports only getRootDirs in @next/eslint-plugin-next 16.3.8.
// Unknown calls must fail instead of silently losing lint coverage.
export function globSync(pattern, options) {
  if (typeof pattern !== "string") {
    throw new TypeError("Next.js glob pattern must be a string");
  }
  if (!options || options.onlyDirectories !== true ||
      Object.keys(options).some((key) => key !== "onlyDirectories")) {
    throw new TypeError("unsupported Next.js glob options");
  }
  if (pattern.length > 10000) {
    throw new RangeError("glob pattern exceeds 10000 characters");
  }

  const nesting = [];
  for (let i = 0; i < pattern.length; i++) {
    const token = pattern[i];
    if (token === "\\") {
      i++;
    } else if (token === "{" || token === "(") {
      nesting.push(token);
      if (nesting.length > 100) {
        throw new RangeError("glob nesting exceeds 100 levels");
      }
    } else if ((token === "}" && nesting.at(-1) === "{") ||
               (token === ")" && nesting.at(-1) === "(")) {
      nesting.pop();
    }
  }

  return discoverDirectories(pattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: isAbsolute(pattern),
  }).map((directory) => pattern.endsWith("/") ? directory : directory.replace(/\/$/, ""));
}
