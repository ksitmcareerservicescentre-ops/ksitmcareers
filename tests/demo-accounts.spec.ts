import { test, expect } from "@playwright/test";

test.describe("Demo Accounts Verification", () => {
  test("demo student logs in with registration number and views dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#identifier", "KSITM/ND/STE/24/001");
    await page.fill("#password", "Password123!");
    await page.getByRole("button", { name: "Sign In to Portal" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /Welcome back, Amina Bello/i }),
    ).toBeVisible();

    // Verify student details
    await expect(page.getByText("KSITM/ND/STE/24/001").first()).toBeVisible();
    await expect(page.getByText("Software & Web Development")).toBeVisible();
    await expect(page.getByText("ND II")).toBeVisible();

    // Verify services
    await expect(page.getByText("Appointment Scheduler")).toBeVisible();
    await expect(page.getByText("Resume Builder")).toBeVisible();
  });

  test("demo student logs in with email and views dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#identifier", "student@ksitmcareers.edu.ng");
    await page.fill("#password", "Password123!");
    await page.getByRole("button", { name: "Sign In to Portal" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /Welcome back, Amina Bello/i }),
    ).toBeVisible();
  });
});
