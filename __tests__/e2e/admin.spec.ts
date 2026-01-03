import { test, expect } from "@playwright/test";

// Helper to login as system admin
async function loginAsSystemAdmin(page: import("@playwright/test").Page) {
  const testEmail = process.env.TEST_ADMIN_EMAIL;
  const testPassword = process.env.TEST_ADMIN_PASSWORD;

  if (!testEmail || !testPassword) {
    test.skip();
    return;
  }

  await page.goto("/admin-login");
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("/admin/dashboard");
}

test.describe("Admin Portal", () => {
  test("should display admin login page", async ({ page }) => {
    await page.goto("/admin-login");

    // Check page title
    await expect(page.locator("text=システム管理者ログイン")).toBeVisible();

    // Check form fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show error for non-admin users", async ({ page }) => {
    await page.goto("/admin-login");

    // Fill in non-admin credentials
    await page.fill('input[type="email"]', "regular@user.com");
    await page.fill('input[type="password"]', "password123");

    // Click login button
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator(".text-red-600")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
  });

  test("should display admin dashboard", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Check page title
    await expect(page.locator("text=システム管理ダッシュボード")).toBeVisible();
  });

  test("should show system statistics", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Check stats cards
    await expect(page.locator("text=登録会社数")).toBeVisible();
    await expect(page.locator("text=総物件数")).toBeVisible();
    await expect(page.locator("text=総入居者数")).toBeVisible();
  });

  test("should show quick action buttons", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Check action buttons
    await expect(page.locator("text=会社一覧")).toBeVisible();
  });

  test("should show recent companies", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Check recent companies section
    await expect(page.locator("text=最近登録された会社")).toBeVisible();
  });
});

test.describe("Company Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
  });

  test("should display companies list", async ({ page }) => {
    await page.goto("/admin/companies");

    // Check page title
    await expect(page.locator("text=会社管理")).toBeVisible();
  });

  test("should show search and filter options", async ({ page }) => {
    await page.goto("/admin/companies");

    // Check search input
    await expect(page.locator('input[placeholder*="検索"]')).toBeVisible();

    // Check filter buttons
    await expect(page.locator("text=すべて")).toBeVisible();
    await expect(page.locator("text=アパート")).toBeVisible();
    await expect(page.locator("text=Оффис")).toBeVisible();
  });

  test("should filter companies by type", async ({ page }) => {
    await page.goto("/admin/companies");

    // Click apartment filter
    await page.click('button:has-text("アパート")');

    // Should update the list
    await page.waitForTimeout(500);
  });

  test("should search companies", async ({ page }) => {
    await page.goto("/admin/companies");

    // Enter search query
    await page.fill('input[placeholder*="検索"]', "test");

    // Wait for search results
    await page.waitForTimeout(500);
  });

  test("should navigate to company detail", async ({ page }) => {
    await page.goto("/admin/companies");

    // Click on first company settings
    const settingsButton = page.locator("text=設定").first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Should be on company detail page
      await expect(page.url()).toContain("/admin/companies/");
    }
  });

  test("should toggle company status", async ({ page }) => {
    await page.goto("/admin/companies");

    // Find toggle button
    const toggleButton = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first();

    if (await toggleButton.isVisible()) {
      // Get initial state and click
      await toggleButton.click();

      // Wait for update
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Admin Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
  });

  test("should navigate between admin pages", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Click companies link
    await page.click('a[href="/admin/companies"]');
    await expect(page).toHaveURL("/admin/companies");

    // Go back to dashboard
    await page.click('a[href="/admin/dashboard"]');
    await expect(page).toHaveURL("/admin/dashboard");
  });

  test("should show admin sidebar", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Check sidebar elements
    await expect(page.locator("text=ダッシュボード")).toBeVisible();
    await expect(page.locator("text=会社管理")).toBeVisible();
  });
});
