import { test, expect } from "@playwright/test";

test("approved imagery loads and visual review screenshots are captured", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const [selector, count] of [
    [".ksitm-shield", 1],
    [".gallery-image img", 8],
    [".leader-card img", 2],
  ] as const) {
    await expect(page.locator(selector)).toHaveCount(count);
    for (const image of await page.locator(selector).all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect
        .poll(
          () =>
            image.evaluate(
              (element) => (element as HTMLImageElement).naturalWidth,
            ),
          { timeout: 30_000 },
        )
        .toBeGreaterThan(0);
    }
  }
  await expect(page.locator(".image-fallback")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-hero.png`,
  });
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-homepage.png`,
    fullPage: true,
  });
  await page.goto("/register");
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-registration-entry.png`,
    fullPage: true,
  });
});
