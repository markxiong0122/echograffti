import { test, expect } from "@playwright/test";

test.describe("Create Graffiti Page", () => {
  test("renders the create form", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    await page.goto("/create");

    await expect(page.getByText("Create Graffiti")).toBeVisible();
    await expect(
      page.getByPlaceholder(/dragon breathing neon fire/i)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Generate Graffiti/i })
    ).toBeVisible();

    await context.close();
  });

  test("generates graffiti from a prompt (mocked API)", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 52.2053, longitude: 0.1218 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    // Mock the generate API
    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        json: {
          id: "test-id",
          prompt: "a neon dragon",
          image_url: "https://via.placeholder.com/400",
          latitude: 52.2053,
          longitude: 0.1218,
          creator: "Tester",
          created_at: new Date().toISOString(),
        },
      });
    });

    await page.goto("/create");

    // Wait for location to be acquired
    await expect(page.getByText(/Location locked/i)).toBeVisible({
      timeout: 10000,
    });

    // Fill form
    await page.getByPlaceholder("Anonymous").fill("Tester");
    await page
      .getByPlaceholder(/dragon breathing neon fire/i)
      .fill("a neon dragon");
    await page.getByRole("button", { name: /Generate Graffiti/i }).click();

    // Wait for result
    await expect(page.getByText(/Pinned to your location/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: /View in AR/i })).toBeVisible();

    await context.close();
  });
});
