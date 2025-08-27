import { describe, it, expect, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import SeasonInfo from "../SeasonInfo"

// Mock fetch
global.fetch = jest.fn()

describe("SeasonInfo Component", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("should render loading state initially", () => {
		render(<SeasonInfo />)

		expect(screen.getByText("Loading season info...")).toBeInTheDocument()
	})

	it("should render season information when data is loaded", async () => {
		const mockSeasonInfo = {
			season: 2024,
			currentWeek: 5,
		}

		// Mock successful API response
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				data: mockSeasonInfo,
			}),
		})

		render(<SeasonInfo />)

		// Wait for data to load
		await screen.findByText("NFL 2024 Season")
		expect(screen.getByText("Week 5")).toBeInTheDocument()
		expect(screen.getByText("Current Season")).toBeInTheDocument()
	})

	it("should render error state when API call fails", async () => {
		// Mock failed API response
		;(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({
				success: false,
				message: "API Error",
			}),
		})

		render(<SeasonInfo />)

		// Wait for error to appear
		await screen.findByText("Error loading season info")
		expect(screen.getByText("API Error")).toBeInTheDocument()
		expect(screen.getByText("Try again")).toBeInTheDocument()
	})

	it("should retry when retry button is clicked", async () => {
		const mockSeasonInfo = {
			season: 2024,
			currentWeek: 5,
		}

		// First call fails
		;(global.fetch as any)
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					message: "API Error",
				}),
			})
			// Second call succeeds
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: mockSeasonInfo,
				}),
			})

		render(<SeasonInfo />)

		// Wait for error to appear
		await screen.findByText("Error loading season info")

		// Click retry button
		const retryButton = screen.getByText("Try again")
		retryButton.click()

		// Wait for data to load
		await screen.findByText("NFL 2024 Season")
		expect(screen.getByText("Week 5")).toBeInTheDocument()

		// Verify fetch was called twice
		expect(global.fetch).toHaveBeenCalledTimes(2)
	})
})
