import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

test("manager has an interactive student preview and assignment controls", async ({
  page,
}, info) => {
  await page.setContent(
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div></body></html>',
  );
  for (const file of readdirSync(".next/static/chunks", { recursive: true }))
    if (String(file).endsWith(".css"))
      await page.addStyleTag({
        content: readFileSync(
          join(".next/static/chunks", String(file)),
          "utf8",
        ),
      });
  await page.addScriptTag({ path: "artifacts/modules-ui.js" });
  await page.getByRole("button", { name: "Manage module" }).first().click();
  await expect(
    page.getByRole("tab", { name: "Module Manager" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("combobox", { name: "Select module" }).locator("option"),
  ).toHaveCount(8);
  await page.getByRole("button", { name: "Start module", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete module", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Answer required" }),
  ).toBeVisible();
  await page
    .getByRole("region", { name: "Student preview" })
    .getByLabel("Describe your career goal.", { exact: false })
    .fill("Software engineering");
  await page
    .getByRole("region", { name: "Student preview" })
    .getByLabel("How confident", { exact: false })
    .selectOption("4");
  await page
    .getByRole("button", { name: "Complete module", exact: true })
    .click();
  await expect(
    page.getByText("Preview completed. No student record was changed."),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Raw module data" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Student preview" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Module Manager" }).click();
  const raw = page.getByRole("textbox", { name: "Raw module data" });
  const valid = await raw.inputValue();
  await raw.fill("invalid JSON");
  await expect(
    page.getByRole("button", { name: "Save module", exact: true }),
  ).toBeDisabled();
  await raw.fill(valid);
  await page
    .getByRole("checkbox", { name: "Published and available for assignment" })
    .check();
  await page.getByRole("button", { name: "Save module", exact: true }).click();
  await expect(
    page.getByText(
      "Module saved. Existing assignments retain their original content.",
    ),
  ).toBeVisible();
  await page.getByLabel("Search students", { exact: true }).fill("Test");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("button", { name: "Assign module to Test Student" })
    .click();
  await expect(
    page.getByText(
      "Module assigned. The start date will be recorded when the student begins.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filter records" }).click();
  await page.getByRole("button", { name: "Filter records" }).click();
  await expect(
    page.getByText("No assignments match these filters."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close drawer" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/modules-${info.project.name}.png`,
    fullPage: true,
  });
});
