// Tests for new functionality: confidence points reassignment, incomplete picks, locked game protection
import { NextRequest } from "next/server"
import { POST, PUT } from "../../../app/api/picks/route"
import { createClient } from "../../supabase/server"

// Mock Supabase client
jest.mock("../../supabase/server", () => ({
	createClient: jest.fn(),
}))

// Mock NextRequest
const createMockRequest = (
	url: string,
	method: "POST" | "PUT" = "POST",
	body?: any
): NextRequest => {
	const request = {
		url: `http://localhost:3000${url}`,
		method,
		json: jest.fn().mockResolvedValue(body || {}),
	} as unknown as NextRequest

	return request
}

describe("Picks API - New Features", () => {
	let mockSupabase: any

	beforeEach(() => {
		mockSupabase = {
			auth: {
				getUser: jest.fn(),
			},
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			neq: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			single: jest.fn(),
			maybeSingle: jest.fn(),
		}
		;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe("Confidence Points Reassignment", () => {
		it("should prevent reassigning confidence points from locked games", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockGame = {
				id: "game-1",
				start_time: "2030-09-07T20:00:00Z", // Far future date to ensure game is not locked
				status: "scheduled",
				week: 1,
				season: "2025",
			}
			const mockOtherPick = {
				id: "pick-other",
				confidence_points: 8,
				games: {
					status: "live", // Locked game
				},
			}

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			mockSupabase.from
				// User exists check
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							maybeSingle: jest.fn().mockResolvedValue({
								data: { id: mockUser.id },
								error: null,
							}),
						}),
					}),
				})
				// Load game
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: mockGame,
								error: null,
							}),
						}),
					}),
				})
				// Check existing pick
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: null,
									error: { code: "PGRST116" },
								}),
							}),
						}),
					}),
				})
				// Re-fetch game for validation
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: mockGame,
								error: null,
							}),
						}),
					}),
				})
				// Check if confidence point is used
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								eq: jest.fn().mockReturnValue({
									eq: jest.fn().mockResolvedValue({
										data: [mockOtherPick],
										error: null,
									}),
								}),
							}),
						}),
					}),
				})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				pickedTeam: "KC",
				confidencePoints: 8, // Used by locked game
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toContain("locked game and cannot be changed")
		})
	})

	describe("Incomplete Picks", () => {
		it("should allow creating picks with confidence points = 0 (incomplete)", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockGame = {
				id: "game-1",
				start_time: "2030-09-07T20:00:00Z", // Far future date to ensure game is not locked
				status: "scheduled",
				week: 1,
				season: "2025",
			}
			const mockNewPick = {
				id: "pick-1",
				user_id: "user-123",
				game_id: "game-1",
				picked_team: "KC",
				confidence_points: 0, // Incomplete pick
			}

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			mockSupabase.from
				// User exists check
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							maybeSingle: jest.fn().mockResolvedValue({
								data: { id: mockUser.id },
								error: null,
							}),
						}),
					}),
				})
				// Load game (loadGame helper)
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: mockGame,
								error: null,
							}),
						}),
					}),
				})
				// Check existing pick
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: null,
									error: { code: "PGRST116" },
								}),
							}),
						}),
					}),
				})
				// Re-fetch game for validation (even when confidence points = 0)
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: mockGame,
								error: null,
							}),
						}),
					}),
				})
				// Insert new pick (confidence points = 0, so no validation needed)
				.mockReturnValueOnce({
					insert: jest.fn().mockReturnValue({
						select: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: mockNewPick,
								error: null,
							}),
						}),
					}),
				})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				pickedTeam: "KC",
				confidencePoints: 0, // Incomplete pick
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBeGreaterThanOrEqual(200)
			expect(response.status).toBeLessThan(300)
			expect(data.success).toBe(true)
			expect(data.data.confidence_points).toBe(0)
		})
	})
})

