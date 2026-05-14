import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should show sekpriAI branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "sekpriAI" })).toBeVisible();
  });

  test("should have sign in and sign up buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("should navigate to login on sign in click", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
