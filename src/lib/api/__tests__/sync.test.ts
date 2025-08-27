import { describe, it, expect, jest, beforeEach } from "@jest/globals"

// Mock the Supabase client
jest.mock("../../supabase/server", () => ({
	createClient: jest.fn(() => ({
		from: jest.fn(() => ({
			upsert: jest.fn(() => ({ error: null })),
			select: jest.fn(() => ({ error: null, data: [] })),
		})),
	})),
}))

// Mock the ESPN API
const mockEspnAPI = {
	getTeams: jest.fn(),
	getSchedule: jest.fn(),
	getAllStandings: jest.fn(),
	getCurrentSeasonInfo: jest.fn(),
}

jest.mock("../espn", () => ({
	espnAPI: mockEspnAPI,
}))

import { dataSync } from "../sync"
import type { ESPNTeam, ESPNGame, ESPNStanding } from "../espn"

describe("Data Sync Service", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		dataSync.clearCache()
	})

	describe("Rate Limiting", () => {
		it("should allow API calls within rate limits", () => {
			// Should allow first call
			expect(dataSync["canMakeAPICall"]("test")).toBe(true)

			// Should allow multiple calls within limit
			for (let i = 0; i < 29; i++) {
				expect(dataSync["canMakeAPICall"]("test")).toBe(true)
			}
		})

		it("should block API calls when rate limit exceeded", () => {
			// Make 30 calls to reach limit
			for (let i = 0; i < 30; i++) {
				dataSync["canMakeAPICall"]("test")
			}

			// 31st call should be blocked
			expect(dataSync["canMakeAPICall"]("test")).toBe(false)
		})

		it("should reset rate limit after window expires", () => {
			// Make 30 calls to reach limit
			for (let i = 0; i < 30; i++) {
				dataSync["canMakeAPICall"]("test")
			}

			// Mock time passing by 61 seconds
			const originalDateNow = Date.now
			Date.now = jest.fn(() => originalDateNow() + 61000)

			// Should allow call after window expires
			expect(dataSync["canMakeAPICall"]("test")).toBe(true)

			// Restore original Date.now
			Date.now = originalDateNow
		})
	})

	describe("Caching", () => {
		it("should cache data with TTL", () => {
			const testData = { test: "data" }
			const cacheKey = "test_key"
			const ttl = 1000 // 1 second

			dataSync["setCachedData"](cacheKey, testData, ttl)

			// Should return cached data immediately
			expect(dataSync["getCachedData"](cacheKey)).toEqual(testData)
		})

		it("should expire cached data after TTL", () => {
			const testData = { test: "data" }
			const cacheKey = "test_key"
			const ttl = 1000 // 1 second

			dataSync["setCachedData"](cacheKey, testData, ttl)

			// Mock time passing by 1.1 seconds
			const originalDateNow = Date.now
			Date.now = jest.fn(() => originalDateNow() + 1100)

			// Should return null after TTL expires
			expect(dataSync["getCachedData"](cacheKey)).toBeNull()

			// Restore original Date.now
			Date.now = originalDateNow
		})

		it("should return cache statistics", () => {
			const stats = dataSync.getCacheStats()
			expect(stats.size).toBe(0)
			expect(stats.keys).toEqual([])

			// Add some data
			dataSync["setCachedData"]("key1", "data1", 1000)
			dataSync["setCachedData"]("key2", "data2", 1000)

			const newStats = dataSync.getCacheStats()
			expect(newStats.size).toBe(2)
			expect(newStats.keys).toContain("key1")
			expect(newStats.keys).toContain("key2")
		})
	})

	describe("Teams Sync", () => {
		it("should sync teams from ESPN API", async () => {
			const mockTeams: ESPNTeam[] = [
				{
					id: "1",
					name: "Buffalo Bills",
					abbreviation: "BUF",
					displayName: "Bills",
					shortDisplayName: "Buffalo",
					location: "Buffalo",
					color: "#00338D",
					alternateColor: "#C60C30",
					logo: "https://example.com/logo.png",
				},
			]

			mockEspnAPI.getTeams.mockResolvedValue(mockTeams)

			const result = await dataSync.syncTeams()

			expect(result).toHaveLength(1)
			expect(result[0].abbreviation).toBe("BUF")
			expect(result[0].conference).toBe("AFC")
			expect(result[0].division).toBe("East")
			expect(mockEspnAPI.getTeams).toHaveBeenCalledTimes(1)
		})

		it("should use cached teams data when available", async () => {
			const mockTeams: ESPNTeam[] = [
				{
					id: "1",
					name: "Buffalo Bills",
					abbreviation: "BUF",
					displayName: "Bills",
					shortDisplayName: "Buffalo",
					location: "Buffalo",
					color: "#00338D",
					alternateColor: "#C60C30",
					logo: "https://example.com/logo.png",
				},
			]

			// First call should fetch from API
			mockEspnAPI.getTeams.mockResolvedValue(mockTeams)
			await dataSync.syncTeams()

			// Second call should use cache
			mockEspnAPI.getTeams.mockClear()
			await dataSync.syncTeams()

			// API should not be called again
			expect(mockEspnAPI.getTeams).not.toHaveBeenCalled()
		})

		it("should respect rate limiting for teams endpoint", async () => {
			// Exceed rate limit
			for (let i = 0; i < 30; i++) {
				dataSync["canMakeAPICall"]("teams")
			}

			await expect(dataSync.syncTeams()).rejects.toThrow(
				"Rate limit exceeded for teams endpoint"
			)
		})
	})

	describe("Games Sync", () => {
		it("should sync games from ESPN API", async () => {
			const mockGames: ESPNGame[] = [
				{
					id: "1",
					date: "2024-09-08T20:00:00Z",
					name: "Bills at Jets",
					shortName: "BUF @ NYJ",
					season: { year: 2024, type: 2 },
					week: { number: 1 },
					competitions: [
						{
							id: "1",
							date: "2024-09-08T20:00:00Z",
							status: {
								type: {
									id: "1",
									name: "Scheduled",
									state: "pre",
									completed: false,
								},
							},
							competitors: [
								{
									id: "1",
									homeAway: "away",
									team: {
										id: "1",
										name: "Bills",
										abbreviation: "BUF",
										displayName: "Bills",
										shortDisplayName: "Buffalo",
										color: "#000",
										alternateColor: "#FFF",
										logo: "",
									},
									score: "0",
									records: [],
								},
								{
									id: "2",
									homeAway: "home",
									team: {
										id: "2",
										name: "Jets",
										abbreviation: "NYJ",
										displayName: "Jets",
										shortDisplayName: "New York",
										color: "#000",
										alternateColor: "#FFF",
										logo: "",
									},
									score: "0",
									records: [],
								},
							],
							venue: undefined,
						},
					],
				},
			]

			mockEspnAPI.getSchedule.mockResolvedValue(mockGames)

			const result = await dataSync.syncGames(2024, 1)

			expect(result).toHaveLength(1)
			expect(result[0].espn_id).toBe("1")
			expect(result[0].week).toBe(1)
			expect(result[0].season).toBe("2024")
			expect(mockEspnAPI.getSchedule).toHaveBeenCalledWith(2024, 1)
		})

		it("should use cached games data when available", async () => {
			const mockGames: ESPNGame[] = []
			mockEspnAPI.getSchedule.mockResolvedValue(mockGames)

			// First call should fetch from API
			await dataSync.syncGames(2024, 1)

			// Second call should use cache
			mockEspnAPI.getSchedule.mockClear()
			await dataSync.syncGames(2024, 1)

			// API should not be called again
			expect(mockEspnAPI.getSchedule).not.toHaveBeenCalled()
		})
	})

	describe("Standings Sync", () => {
		it("should sync standings from ESPN API", async () => {
			const mockAFCStandings: ESPNStanding[] = [
				{
					team: {
						id: "1",
						name: "Bills",
						abbreviation: "BUF",
						displayName: "Bills",
						shortDisplayName: "Buffalo",
						color: "#000",
						alternateColor: "#FFF",
						logo: "",
					},
					records: [
						{
							id: "1",
							name: "Overall",
							abbreviation: "Overall",
							type: "2",
							summary: "10-7",
							displayValue: "10-7",
							value: 17,
							stats: [],
						},
					],
				},
			]

			const mockNFCStandings: ESPNStanding[] = [
				{
					team: {
						id: "2",
						name: "Cowboys",
						abbreviation: "DAL",
						displayName: "Cowboys",
						shortDisplayName: "Dallas",
						color: "#000",
						alternateColor: "#FFF",
						logo: "",
					},
					records: [
						{
							id: "1",
							name: "Overall",
							abbreviation: "Overall",
							type: "2",
							summary: "12-5",
							displayValue: "12-5",
							value: 17,
							stats: [],
						},
					],
				},
			]

			mockEspnAPI.getAllStandings.mockResolvedValue({
				afc: mockAFCStandings,
				nfc: mockNFCStandings,
			})

			const result = await dataSync.syncStandings(2024)

			expect(result).toHaveLength(2)
			expect(result[0].conference).toBe("AFC")
			expect(result[0].team_id).toBe("BUF")
			expect(result[1].conference).toBe("NFC")
			expect(result[1].team_id).toBe("DAL")
			expect(mockEspnAPI.getAllStandings).toHaveBeenCalledWith(2024)
		})
	})

	describe("Season Info", () => {
		it("should get current season info", async () => {
			const mockSeasonInfo = { season: 2024, currentWeek: 1 }
			mockEspnAPI.getCurrentSeasonInfo.mockResolvedValue(mockSeasonInfo)

			const result = await dataSync.getCurrentSeasonInfo()

			expect(result).toEqual(mockSeasonInfo)
			expect(mockEspnAPI.getCurrentSeasonInfo).toHaveBeenCalledTimes(1)
		})

		it("should respect rate limiting for season info endpoint", async () => {
			// Exceed rate limit
			for (let i = 0; i < 30; i++) {
				dataSync["canMakeAPICall"]("season_info")
			}

			await expect(dataSync.getCurrentSeasonInfo()).rejects.toThrow(
				"Rate limit exceeded for season info endpoint"
			)
		})
	})

	describe("Cache Management", () => {
		it("should clear cache when requested", () => {
			// Add some data to cache
			dataSync["setCachedData"]("key1", "data1", 1000)
			dataSync["setCachedData"]("key2", "data2", 1000)

			expect(dataSync.getCacheStats().size).toBe(2)

			// Clear cache
			dataSync.clearCache()

			expect(dataSync.getCacheStats().size).toBe(0)
		})

		it("should provide rate limit statistics", () => {
			// Make some API calls
			dataSync["canMakeAPICall"]("teams")
			dataSync["canMakeAPICall"]("games")

			const stats = dataSync.getRateLimitStats()

			expect(stats.teams).toBeDefined()
			expect(stats.games).toBeDefined()
			expect(stats.teams.callCount).toBe(1)
			expect(stats.games.callCount).toBe(1)
		})
	})
})
