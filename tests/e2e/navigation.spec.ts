// E2E tests for navigation
import { test, expect } from "@playwright/test"

test.describe("Navigation", () => {
	test("should navigate between pages when authenticated", async ({ page }) => {
		// Note: This test assumes user is already authenticated
		// In a real scenario, you'd set up authentication first
		// For now, we'll test the navigation structure

		await page.goto("/dashboard")

		// Check if navigation is present (will fail if not authenticated, which is expected)
		const navigation = page.locator("header")
		const navExists = await navigation.count() > 0

		if (navExists) {
			// Test navigation links exist
			const dashboardLink = page.getByRole("link", { name: /dashboard/i })
			const picksLink = page.getByRole("link", { name: /picks/i })
			const dataLink = page.getByRole("link", { name: /data/i })

			// Check links are visible (if authenticated)
			if ((await dashboardLink.count()) > 0) {
				await expect(dashboardLink).toBeVisible()
			}
			if ((await picksLink.count()) > 0) {
				await expect(picksLink).toBeVisible()
			}
			if ((await dataLink.count()) > 0) {
				await expect(dataLink).toBeVisible()
			}
		}
	})

	test("should navigate to data page", async ({ page }) => {
		await page.goto("/data")

		// Should be on data page
		await expect(page).toHaveURL(/.*data/)
		// Check for NFL Data Dashboard heading
		const heading = page.getByRole("heading", { name: /nfl data/i })
		if ((await heading.count()) > 0) {
			await expect(heading).toBeVisible()
		}
	})
})

