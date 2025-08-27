import { espnAPI } from "../espn"

// Mock fetch globally
global.fetch = jest.fn()

describe("ESPN API Service", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getTeams", () => {
		it("should fetch teams successfully", async () => {
			const mockTeamsData = {
				sports: [
					{
						leagues: [
							{
								teams: [
									{
										team: {
											id: "1",
											name: "Bills",
											abbreviation: "BUF",
											displayName: "Buffalo Bills",
											shortDisplayName: "Bills",
											location: "Buffalo",
											color: "00338D",
											alternateColor: "C60C30",
											logos: [{ href: "https://example.com/bills.png" }],
										},
									},
								],
							},
						],
					},
				],
			}

			;(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockTeamsData,
			})

			const teams = await espnAPI.getTeams()

			expect(fetch).toHaveBeenCalledWith(
				"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams"
			)
			expect(teams).toHaveLength(1)
			expect(teams[0]).toEqual({
				id: "1",
				name: "Bills",
				abbreviation: "BUF",
				displayName: "Buffalo Bills",
				shortDisplayName: "Bills",
				location: "Buffalo",
				color: "00338D",
				alternateColor: "C60C30",
				logo: "https://example.com/bills.png",
			})
		})

		it("should handle API errors", async () => {
			;(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
			})

			await expect(espnAPI.getTeams()).rejects.toThrow(
				"Failed to fetch NFL teams"
			)
		})
	})

	describe("getSchedule", () => {
		it("should fetch schedule for specific week", async () => {
			const mockScheduleData = {
				events: [
					{
						id: "123",
						date: "2024-09-05T20:20:00Z",
						name: "Bills vs Jets",
						shortName: "BUF @ NYJ",
						season: { year: 2024, type: 2 },
						week: { number: 1 },
						competitions: [
							{
								id: "456",
								date: "2024-09-05T20:20:00Z",
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
											displayName: "Buffalo Bills",
											shortDisplayName: "Bills",
											color: "00338D",
											alternateColor: "C60C30",
											logos: [{ href: "https://example.com/bills.png" }],
										},
										score: "0",
										records: [{ name: "overall", summary: "0-0" }],
									},
								],
								venue: {
									id: "789",
									fullName: "MetLife Stadium",
									address: { city: "East Rutherford", state: "NJ" },
								},
							},
						],
					},
				],
			}

			;(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockScheduleData,
			})

			const schedule = await espnAPI.getSchedule(2024, 1)

			expect(fetch).toHaveBeenCalledWith(
				"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&seasontype=2&week=1"
			)
			expect(schedule).toHaveLength(1)
			expect(schedule[0].id).toBe("123")
			expect(schedule[0].week.number).toBe(1)
		})
	})

	describe("getStandings", () => {
		it("should fetch AFC standings", async () => {
			const mockStandingsData = {
				standings: [
					{
						team: {
							id: "1",
							name: "Bills",
							abbreviation: "BUF",
							displayName: "Buffalo Bills",
							shortDisplayName: "Bills",
							color: "00338D",
							alternateColor: "C60C30",
							logos: [{ href: "https://example.com/bills.png" }],
						},
						records: [
							{
								id: "0",
								name: "overall",
								abbreviation: "Any",
								type: "total",
								summary: "13-4",
								displayValue: "13-4",
								value: 0.7647058823529411,
								stats: [
									{
										name: "wins",
										displayName: "Wins",
										shortDisplayName: "W",
										description: "Wins",
										abbreviation: "W",
										type: "wins",
										value: 13,
										displayValue: "13",
									},
								],
							},
						],
					},
				],
			}

			;(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockStandingsData,
			})

			const standings = await espnAPI.getStandings(2024, 8)

			expect(fetch).toHaveBeenCalledWith(
				"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/groups/8/standings/0?lang=en&region=us"
			)
			expect(standings).toHaveLength(1)
			expect(standings[0].team.abbreviation).toBe("BUF")
		})
	})

	describe("getCurrentSeasonInfo", () => {
		it("should fetch current season info", async () => {
			const mockSeasonData = {
				season: { year: 2024 },
				week: { number: 5 },
			}

			;(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockSeasonData,
			})

			const seasonInfo = await espnAPI.getCurrentSeasonInfo()

			expect(seasonInfo).toEqual({
				season: 2024,
				currentWeek: 5,
			})
		})

		it("should return default values on error", async () => {
			;(fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

			const seasonInfo = await espnAPI.getCurrentSeasonInfo()

			expect(seasonInfo).toEqual({
				season: 2024,
				currentWeek: 1,
			})
		})
	})
})
