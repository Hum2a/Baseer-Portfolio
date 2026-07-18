import { test, expect } from "@playwright/test";

test("home page loads with brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Baseer", exact: true }).first()).toBeVisible();
  await expect(page.locator("body")).toContainText("Baseer");
});
