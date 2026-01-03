import { test, expect } from '@playwright/test';

// Helper to login as company admin
async function loginAsCompanyAdmin(page: import('@playwright/test').Page) {
    const testEmail = process.env.TEST_COMPANY_EMAIL;
    const testPassword = process.env.TEST_COMPANY_PASSWORD;

    if (!testEmail || !testPassword) {
        test.skip();
        return;
    }

    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
}

test.describe('Property Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsCompanyAdmin(page);
    });

    test('should display properties page', async ({ page }) => {
        await page.goto('/dashboard/properties');

        // Check page title
        await expect(page.locator('text=物件管理')).toBeVisible();

        // Check add button exists
        await expect(page.locator('text=物件を追加')).toBeVisible();
    });

    test('should navigate to add property page', async ({ page }) => {
        await page.goto('/dashboard/properties');

        // Click add button
        await page.click('text=物件を追加');

        // Should be on new property page
        await expect(page).toHaveURL('/dashboard/properties/new');
    });

    test('should show property form fields', async ({ page }) => {
        await page.goto('/dashboard/properties/new');

        // Check form fields
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('select[name="property_type"]')).toBeVisible();
        await expect(page.locator('input[name="address"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
        await page.goto('/dashboard/properties/new');

        // Try to submit empty form
        await page.click('button[type="submit"]');

        // Should show validation errors
        await expect(page.locator('text=必須')).toBeVisible({ timeout: 5000 });
    });

    test('should create a new property', async ({ page }) => {
        await page.goto('/dashboard/properties/new');

        // Fill in form
        await page.fill('input[name="name"]', 'E2E Test Property');
        await page.selectOption('select[name="property_type"]', 'apartment');
        await page.fill('input[name="address"]', 'E2E Test Address');
        await page.fill('input[name="total_floors"]', '5');

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to properties list
        await expect(page).toHaveURL('/dashboard/properties', { timeout: 10000 });

        // New property should be visible
        await expect(page.locator('text=E2E Test Property')).toBeVisible();
    });

    test('should navigate to property detail', async ({ page }) => {
        await page.goto('/dashboard/properties');

        // Click on a property card
        const propertyCard = page.locator('.card').first();
        await propertyCard.click();

        // Should be on property detail page
        await expect(page.url()).toContain('/dashboard/properties/');
    });
});

test.describe('Unit Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsCompanyAdmin(page);
    });

    test('should display units page for property', async ({ page }) => {
        await page.goto('/dashboard/properties');

        // Click manage units button on first property
        await page.click('text=部屋を管理');

        // Should be on units page
        await expect(page.url()).toContain('/units');
    });

    test('should show bulk create option', async ({ page }) => {
        // Navigate to a property's units page first
        await page.goto('/dashboard/properties');
        await page.click('text=部屋を管理');

        // Check bulk create button exists
        await expect(page.locator('text=一括登録')).toBeVisible();
    });

    test('should show unit grid view', async ({ page }) => {
        await page.goto('/dashboard/properties');
        await page.click('text=部屋を管理');

        // Check grid view elements
        await expect(page.locator('.grid')).toBeVisible();
    });
});

test.describe('Tenant Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsCompanyAdmin(page);
    });

    test('should display tenants page', async ({ page }) => {
        await page.goto('/dashboard/tenants');

        // Check page title
        await expect(page.locator('text=入居者管理')).toBeVisible();
    });

    test('should show add tenant button', async ({ page }) => {
        await page.goto('/dashboard/tenants');

        // Check add button exists
        await expect(page.locator('text=入居者を追加')).toBeVisible();
    });

    test('should navigate to add tenant page', async ({ page }) => {
        await page.goto('/dashboard/tenants');

        // Click add button
        await page.click('text=入居者を追加');

        // Should be on new tenant page
        await expect(page).toHaveURL('/dashboard/tenants/new');
    });

    test('should show tenant form fields', async ({ page }) => {
        await page.goto('/dashboard/tenants/new');

        // Check form fields
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('input[name="phone"]')).toBeVisible();
        await expect(page.locator('select[name="tenant_type"]')).toBeVisible();
    });
});
