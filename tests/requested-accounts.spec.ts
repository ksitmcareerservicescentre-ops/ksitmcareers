import { test, expect } from "@playwright/test";

const accounts = [
  {
    email: "student1@ksitmcareers.org.ng",
    route: "/dashboard",
    marker: "Welcome back, Student One",
  },
  {
    email: "careerofficer1@ksitmcareers.org.ng",
    route: "/staff",
    marker: "Welcome, Career Officer One",
  },
  {
    email: "superadmin@ksitmcareers.org.ng",
    route: "/admin",
    marker: "Super Admin Central",
  },
] as const;

test.describe("requested org.ng accounts", () => {
  for (const account of accounts) {
    test(`${account.email} reaches its role dashboard`, async ({ page }) => {
      await page.goto("/login");
      await page.fill("#identifier", account.email);
      await page.fill("#password", "12345678");
      await page.getByRole("button", { name: "Sign In to Portal" }).click();
      await expect(page).toHaveURL(
        new RegExp(`${account.route.replace("/", "\\/")}([/?#]|$)`),
        { timeout: 15_000 },
      );
      await expect(
        page.getByText(account.marker, { exact: false }).first(),
      ).toBeVisible();
    });
  }

  test("username-only login resolves to the requested org.ng account", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#identifier", "superadmin");
    await page.fill("#password", "12345678");
    await page.getByRole("button", { name: "Sign In to Portal" }).click();
    await expect(page).toHaveURL(/\/admin([/?#]|$)/, { timeout: 15_000 });
  });
});
