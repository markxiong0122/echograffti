import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders the app title and navigation buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=ECHO//GRAFFITI")).toBeVisible();
    await expect(page.getByRole("link", { name: /Explore AR/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View Map/i })).toBeVisible();
  });

  test("Explore AR link navigates to /ar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Explore AR/i }).click();
    await expect(page).toHaveURL("/ar");
  });

  test("View Map link navigates to /map", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /View Map/i }).click();
    await expect(page).toHaveURL("/map");
  });
});
