import { test, expect } from "@playwright/test";

test("home page loads with brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Baseer", exact: true }).first()).toBeVisible();
  await expect(page.locator("body")).toContainText("Baseer");
});

test("unauthenticated /admin redirects to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await expect(page.getByText("Baseer Studio")).toBeVisible();
});

test("public analytics beacon accepts page views", async ({ request }) => {
  const res = await request.post("/api/analytics/beacon", {
    data: {
      path: "/",
      sessionId: "e2e-session-smoke-test",
      eventType: "page_view",
      referrer: null,
    },
  });
  expect(res.ok()).toBeTruthy();
  expect([200, 201]).toContain(res.status());
});

test("login page signs in and reaches dashboard", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL ?? "baseer@baseer.co.uk";
  const password = process.env.ADMIN_PASSWORD ?? "changeme-baseer-admin";

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 15_000,
  });
});

test("admin page editor opens Home builder", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL ?? "baseer@baseer.co.uk";
  const password = process.env.ADMIN_PASSWORD ?? "changeme-baseer-admin";

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/admin/pages");
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  await page.getByRole("link", { name: "Edit" }).first().click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Save page" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Preview" })).toBeVisible();
});
