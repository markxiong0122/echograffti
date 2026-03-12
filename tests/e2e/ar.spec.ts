import { test, expect } from "@playwright/test";

test.describe("AR Page", () => {
  test("renders AR page with overlay UI", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation", "camera"],
    });
    const page = await context.newPage();

    // Mock Supabase graffiti query
    await page.route("**/rest/v1/graffiti**", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/ar");

    // Overlay navigation should be visible
    await expect(page.getByText(/Exit AR/i)).toBeVisible();

    await context.close();
  });
});
