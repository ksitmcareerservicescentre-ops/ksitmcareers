import { build } from "esbuild";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
mkdirSync("artifacts", { recursive: true });
await build({
  entryPoints: ["tests/modules/ui-entry.tsx"],
  outfile: "artifacts/modules-ui.js",
  bundle: true,
  platform: "browser",
  jsx: "automatic",
  alias: { "@/lib/modules-client": resolve("tests/modules/ui-fixture.ts") },
});
const result = spawnSync(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config",
    "playwright.modules.config.ts",
  ],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
