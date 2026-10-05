import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public page renders, preserves content and has no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("KSITM Careers — Advancing Futures");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Advancing Futures/i,
  );
  for (const id of [
    "services",
    "gallery",
    "leaders",
    "updates",
    "training",
    "contacts",
  ]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(
    page.getByRole("heading", { name: "Nura Sadiq, M.Sc., CPCC" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Abubakar Abdu" }),
  ).toBeVisible();
  await expect(page.locator(".service-card")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("leadership biographies expand independently and collapse by keyboard", async ({
  page,
}) => {
  await page.goto("/#leaders");
  const nura = page.getByRole("button", {
    name: "Continue Reading about Nura Sadiq, M.Sc., CPCC",
  });
  await expect(page.locator("#nura-sadiq-biography")).toBeHidden();
  await nura.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#nura-sadiq-biography")).toBeVisible();
  await expect(page.locator("#abubakar-abdu-biography")).toBeHidden();
  await expect(
    page.getByText(
      "Guiding philosophy: Discover. Develop. Connect. Transition. Progress.",
    ),
  ).toBeVisible();
  const collapse = page.getByRole("button", {
    name: "Show Less about Nura Sadiq, M.Sc., CPCC",
  });
  await collapse.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#nura-sadiq-biography")).toBeHidden();
});

test("gallery exposes all eight assets with informative content", async ({
  page,
}) => {
  await page.goto("/#gallery");
  await expect(page.locator(".gallery-card")).toHaveCount(8);
  for (const card of await page.locator(".gallery-card").all()) {
    await expect(card.locator(".gallery-image img")).toBeAttached();
    await expect(card.locator("h3")).not.toBeEmpty();
  }
});

test("mobile navigation opens, closes on selection and supports Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Leadership" }).click();
  await expect(nav).toBeHidden();
  await expect(page).toHaveURL(/#leaders$/);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("hero animation can be paused and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation" }).click();
  expect(
    await page
      .locator(".hero-slide-0")
      .evaluate((element) => getComputedStyle(element).animationPlayState),
  ).toBe("paused");
  await page.getByRole("button", { name: "Resume animation" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".hero-slide-0")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".hero-slide-0")
      .evaluate((element) => getComputedStyle(element).opacity),
  ).toBe("1");
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeHidden();
});

test("auth entry routes render properly with accessible forms and navigation", async ({
  page,
}) => {
  // Test /login
  const loginRes = await page.goto("/login");
  expect(loginRes?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Student Sign In", exact: true }),
  ).toBeVisible();
  await expect(page.locator("input#identifier")).toBeVisible();
  await expect(page.locator("input#password")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign In to Portal" }),
  ).toBeVisible();

  // Test /register
  const regRes = await page.goto("/register");
  expect(regRes?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Create Student Account", exact: true }),
  ).toBeVisible();
  await expect(page.locator("input#fullName")).toBeVisible();
  await expect(page.locator("input#regNumber")).toBeVisible();
  await expect(page.locator("input#email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Complete Registration/i }),
  ).toBeVisible();
});

test("service information routes and unknown routes work", async ({ page }) => {
  await page.goto("/");
  const urls = await page
    .locator(".service-card a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
  for (const url of urls) {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "About this service" }),
    ).toBeVisible();
    await expect(
      page.getByText("Portal service planned", { exact: true }),
    ).toBeVisible();
  }
  const response = await page.goto("/services/not-a-service");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("link", { name: "Return to KSITM Careers" }),
  ).toBeVisible();
});

test("home has no missing anchors, placeholder links or invented social links", async ({
  page,
}) => {
  await page.goto("/");
  const invalid = await page.locator("a").evaluateAll((links) =>
    links
      .filter((link) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return true;
        if (href.startsWith("#") || href.startsWith("/#"))
          return !document.getElementById(href.split("#")[1]);
        return false;
      })
      .map((link) => link.textContent),
  );
  expect(invalid).toEqual([]);
  await expect(
    page.getByRole("navigation", { name: "Social media" }),
  ).toHaveCount(0);
});

test("responsive widths have no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `overflow at ${width}px`,
    ).toBe(true);
  }
});

test("WCAG AA automated checks pass on public and entry pages", async ({
  page,
}) => {
  for (const route of ["/", "/login", "/register", "/services/mentorship"]) {
    await page.goto(route);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  }
});

test("failed image requests produce a readable fallback", async ({ page }) => {
  await page.route("https://res.cloudinary.com/**", (route) => route.abort());
  await page.goto("/#gallery");
  await page.locator(".gallery-image").first().scrollIntoViewIfNeeded();
  await expect(
    page.locator(".gallery-image").first().getByText("Image unavailable"),
  ).toBeVisible();
});
