import { test, expect } from "@playwright/test";

test.describe("Map Page", () => {
  test("renders the map page with header", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    // Mock Supabase graffiti query
    await page.route("**/rest/v1/graffiti**", async (route) => {
      await route.fulfill({
        json: [
          {
            id: "test-1",
            prompt: "test graffiti",
            image_url: "https://via.placeholder.com/200",
            latitude: 52.2053,
            longitude: 0.1218,
            creator: "Tester",
            created_at: new Date().toISOString(),
          },
        ],
      });
    });

    await page.goto("/map");

    await expect(page.getByRole("heading", { name: "Map" })).toBeVisible();

    // Wait for Leaflet map to load
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    });

    await context.close();
  });
});
