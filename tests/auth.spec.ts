import { test, expect } from "@playwright/test";

test.describe
  .serial("Student Registration, Authentication and Dashboard", () => {
  let testStudent: {
    fullName: string;
    regNumber: string;
    email: string;
    department: string;
    level: string;
    password: string;
  };

  test.beforeAll(async ({}, testInfo) => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    testStudent = {
      fullName: `Test Student ${testInfo.project.name} ${randomId}`,
      regNumber: `KSITM/ND/STE/24/${randomId}`,
      email: `student.${testInfo.project.name}.${randomId}.${Date.now()}@ksitmcareers.edu.ng`,
      department: "Computer Software Engineering",
      level: "National Diploma I (ND 1)",
      password: "Password123!",
    };
  });

  test("unauthenticated access to /dashboard redirects to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Student Sign In" }),
    ).toBeVisible();
  });

  test("registration validates required fields and password rules", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.fill("#fullName", "Ab");
    await page.fill("#regNumber", "K");
    await page.fill("#email", "invalid@format");
    await page.fill("#password", "short");
    await page.fill("#confirmPassword", "different");
    await page.getByRole("button", { name: /Complete Registration/i }).click();

    await expect(
      page.locator("text=Full name must be at least 3 characters long."),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("student registers successfully, gets immediate dashboard with active entitlements", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill("#fullName", testStudent.fullName);
    await page.fill("#regNumber", testStudent.regNumber);
    await page.fill("#email", testStudent.email);
    await page.selectOption("#department", testStudent.department);
    await page.selectOption("#level", testStudent.level);
    await page.fill("#password", testStudent.password);
    await page.fill("#confirmPassword", testStudent.password);

    await page.getByRole("button", { name: /Complete Registration/i }).click();

    // Must be redirected directly to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Verify student details on dashboard
    await expect(
      page.getByRole("heading", {
        name: `Welcome back, ${testStudent.fullName}`,
      }),
    ).toBeVisible();
    await expect(page.getByText(testStudent.regNumber).first()).toBeVisible();
    await expect(page.getByText(testStudent.department).first()).toBeVisible();

    // Verify service entitlements are displayed
    await expect(
      page.getByText("Individual Service Entitlements"),
    ).toBeVisible();
    await expect(page.getByText("● Active").first()).toBeVisible();

    // Verify Sign Out works
    await page
      .getByRole("button", { name: "Sign out of student portal" })
      .click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("registration rejects duplicate registration number", async ({
    page,
  }) => {
    await page.goto("/register");

    // Try to register with already registered regNumber
    await page.fill("#fullName", "Another Student");
    await page.fill("#regNumber", testStudent.regNumber);
    await page.fill("#email", `different.${Date.now()}@ksitmcareers.edu.ng`);
    await page.fill("#password", testStudent.password);
    await page.fill("#confirmPassword", testStudent.password);

    await page.getByRole("button", { name: /Complete Registration/i }).click();

    await expect(page.getByText(/already registered/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("student authenticates using registration number and password", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#identifier", testStudent.regNumber);
    await page.fill("#password", testStudent.password);
    await page.getByRole("button", { name: "Sign In to Portal" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", {
        name: `Welcome back, ${testStudent.fullName}`,
      }),
    ).toBeVisible();
  });

  test("student authenticates using email and password", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#identifier", testStudent.email);
    await page.fill("#password", testStudent.password);
    await page.getByRole("button", { name: "Sign In to Portal" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", {
        name: `Welcome back, ${testStudent.fullName}`,
      }),
    ).toBeVisible();
  });

  test("login rejects invalid credentials with friendly feedback", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#identifier", testStudent.regNumber);
    await page.fill("#password", "WrongPassword123!");
    await page.getByRole("button", { name: "Sign In to Portal" }).click();

    await expect(
      page.getByText("Invalid registration number/email or password."),
    ).toBeVisible({ timeout: 10_000 });
  });
});
