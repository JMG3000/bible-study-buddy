import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const env = { ...process.env };
const configuredTemp = tmpdir();

if (
  !existsSync(configuredTemp) ||
  (process.platform === "linux" && configuredTemp.startsWith("/mnt/"))
) {
  const fallbackTemp = existsSync("/tmp") ? "/tmp" : process.cwd();
  env.TEMP = fallbackTemp;
  env.TMP = fallbackTemp;
  env.TMPDIR = fallbackTemp;
}

const vitest = fileURLToPath(
  new URL("../node_modules/vitest/vitest.mjs", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [vitest, "run", ...process.argv.slice(2)],
  { env, stdio: "inherit" },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
