import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

mkdirSync("artifacts", { recursive: true });
await build({
  entryPoints: ["tests/modules/lifecycle.checks.ts"],
  outfile: "artifacts/modules-tests.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  alias: {
    "@/db/schema": resolve("src/db/schema.ts"),
    "@/db": resolve("tests/modules/fixture.ts"),
    "@/lib/auth/session": resolve("tests/modules/fixture.ts"),
    "next/cache": resolve("tests/modules/fixture.ts"),
  },
});
const result = spawnSync(
  process.execPath,
  ["--test", "artifacts/modules-tests.cjs"],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
