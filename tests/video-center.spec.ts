import { test, expect } from "@playwright/test";
import { parseTrainingMedia } from "../src/lib/training-media";

test("media URLs distinguish YouTube from direct HTTPS files", () => {
  expect(parseTrainingMedia("https://youtu.be/dQw4w9WgXcQ")?.provider).toBe("youtube");
  expect(parseTrainingMedia("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.id).toBe("dQw4w9WgXcQ");
  expect(parseTrainingMedia("https://cdn.example.org/video.mp4?v=abcdefghijk")?.provider).toBe("direct");
  expect(parseTrainingMedia("https://youtube.com/watch?v=invalid")).toBeNull();
  expect(parseTrainingMedia("javascript:alert(1)")).toBeNull();
  expect(parseTrainingMedia("http://cdn.example.org/video.mp4")).toBeNull();
});

test("Video Center requires authentication", async ({ page }) => {
  await page.goto("/training/preview", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

test("admin navigation opens, stays fixed, and closes by keyboard", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill("#identifier", "superadmin@ksitmcareers.org.ng");
  await page.fill("#password", process.env.TEST_ADMIN_PASSWORD || "12345678");
  await page.getByRole("button", { name: "Sign In to Portal" }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 60000 });
  const toggle = page.getByRole("button", { name: "Workspace menu", exact: true });
  await toggle.click();
  const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("position", "fixed");
  await expect(page.locator("header").first()).toHaveCSS("position", "fixed");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await drawer.getByRole("button", { name: "Skills training", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.goto("/training/preview", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Learning Videos" })).toBeVisible();
  await expect(page.getByText("Video Center", { exact: true })).toBeVisible();
});
