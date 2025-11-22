// E2E tests for authentication flows
import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to home page before each test
		await page.goto("/")
	})

	test("should display sign in and sign up links when not authenticated", async ({
		page,
	}) => {
		// Check for sign in link
		const signInLink = page.getByRole("link", { name: /sign in/i })
		await expect(signInLink).toBeVisible()

		// Check for sign up link
		const signUpLink = page.getByRole("link", { name: /sign up/i })
		await expect(signUpLink).toBeVisible()
	})

	test("should navigate to sign in page", async ({ page }) => {
		const signInLink = page.getByRole("link", { name: /sign in/i })
		await signInLink.click()

		// Should be on sign in page
		await expect(page).toHaveURL(/.*signin/)
		await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
	})

	test("should navigate to sign up page", async ({ page }) => {
		const signUpLink = page.getByRole("link", { name: /sign up/i })
		await signUpLink.click()

		// Should be on sign up page
		await expect(page).toHaveURL(/.*signup/)
		await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible()
	})

	test("should redirect to sign in when accessing protected route", async ({
		page,
	}) => {
		// Try to access dashboard without authentication
		await page.goto("/dashboard")

		// Should redirect to sign in
		await expect(page).toHaveURL(/.*signin/)
	})
})

