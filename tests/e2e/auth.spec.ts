import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("should show signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should have link between login and signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
