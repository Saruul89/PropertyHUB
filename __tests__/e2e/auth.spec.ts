import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page with company and tenant tabs', async ({
        page,
    }) => {
        await page.goto('/login');

        // Check page title
        await expect(page.locator('text=PropertyHub')).toBeVisible();

        // Check tabs exist
        await expect(page.locator('text=管理会社')).toBeVisible();
        await expect(page.locator('text=入居者')).toBeVisible();
    });

    test('should show company login form by default', async ({ page }) => {
        await page.goto('/login');

        // Email input should be visible
        await expect(page.locator('input[type="email"]')).toBeVisible();

        // Password input should be visible
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // Login button should be visible
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should switch to tenant login form', async ({ page }) => {
        await page.goto('/login');

        // Click tenant tab
        await page.click('text=入居者');

        // Phone input should be visible
        await expect(page.locator('input[type="tel"]')).toBeVisible();

        // Password input should be visible
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        // Fill in invalid credentials
        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to dashboard after successful login', async ({
        page,
    }) => {
        // Skip if no test credentials
        const testEmail = process.env.TEST_COMPANY_EMAIL;
        const testPassword = process.env.TEST_COMPANY_PASSWORD;

        if (!testEmail || !testPassword) {
            test.skip();
            return;
        }

        await page.goto('/login');

        // Fill in valid credentials
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    });

    test('should show registration link', async ({ page }) => {
        await page.goto('/login');

        // Check registration link exists
        const registerLink = page.locator('a[href="/register"]');
        await expect(registerLink).toBeVisible();
        await expect(registerLink).toHaveText('新規登録');
    });

    test('should navigate to registration page', async ({ page }) => {
        await page.goto('/login');

        // Click registration link
        await page.click('a[href="/register"]');

        // Should be on registration page
        await expect(page).toHaveURL('/register');
    });
});

test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/dashboard');

        // Should be redirected to login
        await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated users from tenant portal', async ({
        page,
    }) => {
        await page.goto('/tenant/dashboard');

        // Should be redirected to login
        await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated users from admin portal', async ({
        page,
    }) => {
        await page.goto('/admin/dashboard');

        // Should be redirected to login
        await expect(page).toHaveURL('/login');
    });
});
