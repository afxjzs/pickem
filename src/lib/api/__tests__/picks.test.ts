import { NextRequest } from "next/server"
import { GET, POST } from "../../../app/api/picks/route"
import { createClient } from "../../supabase/server"

// Mock Supabase client
jest.mock("../../supabase/server", () => ({
	createClient: jest.fn(),
}))

// Mock NextRequest
const createMockRequest = (
	url: string,
	method: "GET" | "POST" = "GET",
	body?: any
): NextRequest => {
	const request = {
		url: `http://localhost:3000${url}`,
		method,
		json: jest.fn().mockResolvedValue(body || {}),
	} as unknown as NextRequest

	return request
}

describe("Picks API", () => {
	let mockSupabase: any

	beforeEach(() => {
		mockSupabase = {
			auth: {
				getUser: jest.fn(),
			},
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			single: jest.fn(),
		}
		;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe("GET /api/picks", () => {
		it("should return 401 when user is not authenticated", async () => {
			// Arrange
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: new Error("Not authenticated"),
			})

			const request = createMockRequest("/api/picks?season=2025&week=1")

			// Act
			const response = await GET(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(401)
			expect(data.success).toBe(false)
			expect(data.message).toBe("Unauthorized")
		})

		it("should return user picks for a specific week", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockPicks = [
				{
					id: "pick-1",
					user_id: "user-123",
					game_id: "game-1",
					picked_team: "KC",
					confidence_points: 16,
					games: {
						id: "game-1",
						season: "2025",
						week: 1,
						home_team: "KC",
						away_team: "BAL",
						start_time: "2025-09-07T20:00:00Z",
						status: "scheduled",
						home_score: null,
						away_score: null,
					},
				},
			]

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			// Mock the query chain properly
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: mockPicks,
							error: null,
						}),
					}),
				}),
			})

			const request = createMockRequest("/api/picks?season=2025&week=1")

			// Act
			const response = await GET(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.data).toEqual(mockPicks)
			expect(data.count).toBe(1)
			expect(data.season).toBe("2025")
			expect(data.week).toBe(1)
		})

		it("should return 400 for invalid week parameter", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			const request = createMockRequest("/api/picks?season=2025&week=invalid")

			// Act
			const response = await GET(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toContain("Invalid week parameter")
		})

		it("should handle database errors gracefully", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			// Mock the query chain to return an error
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: null,
							error: new Error("Database connection failed"),
						}),
					}),
				}),
			})

			const request = createMockRequest("/api/picks?season=2025&week=1")

			// Act
			const response = await GET(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(500)
			expect(data.success).toBe(false)
			expect(data.message).toContain("Failed to fetch picks from database")
		})
	})

	describe("POST /api/picks", () => {
		it("should return 401 when user is not authenticated", async () => {
			// Arrange
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: new Error("Not authenticated"),
			})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				pickedTeam: "KC",
				confidencePoints: 16,
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(401)
			expect(data.success).toBe(false)
			expect(data.message).toBe("Unauthorized")
		})

		it("should return 400 when required fields are missing", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				// Missing pickedTeam and confidencePoints
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toContain("Missing required fields")
		})

		it("should return 400 when confidence points are out of range", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				pickedTeam: "KC",
				confidencePoints: 20, // Invalid: should be 1-16
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toContain(
				"Confidence points must be between 1 and 16"
			)
		})

		it("should return 404 when game does not exist", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: new Error("Game not found"),
						}),
					}),
				}),
			})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "non-existent-game",
				pickedTeam: "KC",
				confidencePoints: 16,
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(404)
			expect(data.success).toBe(false)
			expect(data.message).toBe("Game not found")
		})

		it("should return 400 when game has already started", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockGame = {
				id: "game-1",
				start_time: "2025-09-07T20:00:00Z",
				status: "live", // Game is live, so picks are locked
			}

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: mockGame,
							error: null,
						}),
					}),
				}),
			})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				pickedTeam: "KC",
				confidencePoints: 16,
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toBe("Game has already started, picks are locked")
		})

		it("should return 400 when user already has a pick for this game", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockGame = {
				id: "game-1",
				start_time: "2025-09-07T20:00:00Z",
				status: "scheduled",
			}
			const mockExistingPick = {
				id: "pick-1",
				user_id: "user-123",
				game_id: "game-1",
			}

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			mockSupabase.from
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
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: mockExistingPick,
									error: null,
								}),
							}),
						}),
					}),
				})

			const request = createMockRequest("/api/picks", "POST", {
				gameId: "game-1",
				pickedTeam: "KC",
				confidencePoints: 16,
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toBe("User already has a pick for this game")
		})

		it("should return 400 when confidence points are already used for the week", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockGame = {
				id: "game-1",
				start_time: "2025-09-07T20:00:00Z",
				status: "scheduled",
				week: 1,
				season: "2025",
			}
			const mockUsedConfidence = [
				{ confidence_points: 16 },
				{ confidence_points: 15 },
			]

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			// Mock the complex query chain for confidence points validation
			mockSupabase.from
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
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: null,
									error: { code: "PGRST116" }, // Not found error
								}),
							}),
						}),
					}),
				})
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
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								eq: jest.fn().mockReturnValue({
									eq: jest.fn().mockResolvedValue({
										data: mockUsedConfidence,
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
				confidencePoints: 16, // Already used
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.message).toContain(
				"Confidence points 16 already used for week 1"
			)
		})

		it("should successfully create a pick when all validations pass", async () => {
			// Arrange
			const mockUser = { id: "user-123", email: "test@example.com" }
			const mockGame = {
				id: "game-1",
				start_time: "2025-09-07T20:00:00Z",
				status: "scheduled",
				week: 1,
				season: "2025",
			}
			const mockNewPick = {
				id: "pick-1",
				user_id: "user-123",
				game_id: "game-1",
				picked_team: "KC",
				confidence_points: 16,
			}

			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: mockUser },
				error: null,
			})

			// Mock the complex query chain for successful pick creation
			mockSupabase.from
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
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: null,
									error: { code: "PGRST116" }, // Not found error
								}),
							}),
						}),
					}),
				})
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
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								eq: jest.fn().mockReturnValue({
									eq: jest.fn().mockResolvedValue({
										data: [],
										error: null,
									}),
								}),
							}),
						}),
					}),
				})
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
				confidencePoints: 16,
			})

			// Act
			const response = await POST(request)
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.data).toEqual(mockNewPick)
			expect(data.message).toBe("Pick created successfully")
		})
	})
})
