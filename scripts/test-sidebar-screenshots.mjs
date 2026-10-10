import { build } from "esbuild";
import { resolve, join } from "node:path";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

console.log("Bundling sidebar UI entry with esbuild...");
await build({
  entryPoints: ["tests/modules/sidebar-ui-entry.tsx"],
  outfile: "artifacts/sidebar-ui.js",
  bundle: true,
  platform: "browser",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
  },
  alias: {
    "@/lib/modules-client": resolve("tests/modules/sidebar-ui-fixture.ts"),
    "@/actions/appointments": resolve("tests/modules/sidebar-ui-fixture.ts"),
    "@/actions/landing-content": resolve("tests/modules/sidebar-ui-fixture.ts"),
    "@/actions/admin": resolve("tests/modules/sidebar-ui-fixture.ts"),
  },
});

console.log("Launching browser for screenshot capture...");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.setContent(
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><script>window.process = { env: { NODE_ENV: "development" } };</script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body class="bg-[#0A0A1A] text-white"><div id="root"></div></body></html>',
);

for (const file of readdirSync(".next/static/chunks", { recursive: true })) {
  if (String(file).endsWith(".css")) {
    await page.addStyleTag({
      content: readFileSync(join(".next/static/chunks", String(file)), "utf8"),
    });
  }
}

await page.addScriptTag({ path: "artifacts/sidebar-ui.js" });

// Wait for modules to load
await page.waitForTimeout(1000);

// Capture initial desktop view with pinned modules flyout
await page.screenshot({
  path: "artifacts/sidebar-extended-desktop.png",
  fullPage: false,
});
console.log("Captured artifacts/sidebar-extended-desktop.png");

// Click on Resume builder submenu
const resumeBtn = page.getByRole("button", {
  name: "Resume builder",
  exact: false,
});
if ((await resumeBtn.count()) > 0) {
  await resumeBtn.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "artifacts/single-module-env-desktop.png",
    fullPage: false,
  });
  console.log("Captured artifacts/single-module-env-desktop.png");
}

await browser.close();
console.log("Screenshot capture complete.");
