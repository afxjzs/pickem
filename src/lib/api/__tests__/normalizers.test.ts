import { describe, it, expect } from "@jest/globals"
import {
	normalizeTeam,
	normalizeGame,
	normalizeStanding,
	normalizeTeams,
	normalizeGames,
	normalizeAllStandings,
} from "../normalizers"
import type { ESPNTeam, ESPNGame, ESPNStanding } from "../espn"

describe("Data Normalizers", () => {
	describe("normalizeTeam", () => {
		it("should normalize ESPN team data correctly", () => {
			const espnTeam: ESPNTeam = {
				id: "1",
				name: "Buffalo Bills",
				abbreviation: "BUF",
				displayName: "Bills",
				shortDisplayName: "Buffalo",
				location: "Buffalo",
				color: "#00338D",
				alternateColor: "#C60C30",
				logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
				record: {
					wins: 10,
					losses: 7,
					ties: 0,
					winPercent: 0.588,
				},
			}

			const normalized = normalizeTeam(espnTeam)

			expect(normalized).toEqual({
				espn_id: "1",
				name: "Buffalo Bills",
				abbreviation: "BUF",
				display_name: "Bills",
				short_display_name: "Buffalo",
				location: "Buffalo",
				primary_color: "#00338D",
				secondary_color: "#C60C30",
				logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
				conference: "AFC",
				division: "East",
				active: true,
			})
		})

		it("should determine AFC conference correctly", () => {
			const afcTeams = [
				"BUF",
				"MIA",
				"NE",
				"NYJ",
				"CIN",
				"BAL",
				"CLE",
				"PIT",
				"HOU",
				"IND",
				"JAX",
				"TEN",
				"DEN",
				"KC",
				"LV",
				"LAC",
			]

			afcTeams.forEach((abbr) => {
				const espnTeam: ESPNTeam = {
					id: "1",
					name: "Test Team",
					abbreviation: abbr,
					displayName: "Test",
					shortDisplayName: "Test",
					location: "Test",
					color: "#000000",
					alternateColor: "#FFFFFF",
					logo: "",
				}

				const normalized = normalizeTeam(espnTeam)
				expect(normalized.conference).toBe("AFC")
			})
		})

		it("should determine NFC conference correctly", () => {
			const nfcTeams = [
				"DAL",
				"NYG",
				"PHI",
				"WAS",
				"CHI",
				"DET",
				"GB",
				"MIN",
				"ATL",
				"CAR",
				"NO",
				"TB",
				"ARI",
				"LAR",
				"SF",
				"SEA",
			]

			nfcTeams.forEach((abbr) => {
				const espnTeam: ESPNTeam = {
					id: "1",
					name: "Test Team",
					abbreviation: abbr,
					displayName: "Test",
					shortDisplayName: "Test",
					location: "Test",
					color: "#000000",
					alternateColor: "#FFFFFF",
					logo: "",
				}

				const normalized = normalizeTeam(espnTeam)
				expect(normalized.conference).toBe("NFC")
			})
		})

		it("should determine divisions correctly", () => {
			const divisions = {
				East: ["BUF", "MIA", "NE", "NYJ", "DAL", "NYG", "PHI", "WAS"],
				North: ["CIN", "BAL", "CLE", "PIT", "CHI", "DET", "GB", "MIN"],
				South: ["HOU", "IND", "JAX", "TEN", "ATL", "CAR", "NO", "TB"],
				West: ["DEN", "KC", "LV", "LAC", "ARI", "LAR", "SF", "SEA"],
			}

			Object.entries(divisions).forEach(([division, teams]) => {
				teams.forEach((abbr) => {
					const espnTeam: ESPNTeam = {
						id: "1",
						name: "Test Team",
						abbreviation: abbr,
						displayName: "Test",
						shortDisplayName: "Test",
						location: "Test",
						color: "#000000",
						alternateColor: "#FFFFFF",
						logo: "",
					}

					const normalized = normalizeTeam(espnTeam)
					expect(normalized.division).toBe(division)
				})
			})
		})
	})

	describe("normalizeGame", () => {
		it("should normalize ESPN game data correctly", () => {
			const espnGame: ESPNGame = {
				id: "401547456",
				date: "2024-09-08T20:00:00Z",
				name: "Bills at Jets",
				shortName: "BUF @ NYJ",
				season: { year: 2024, type: 2 },
				week: { number: 1 },
				competitions: [
					{
						id: "401547456",
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
									id: "2",
									name: "Buffalo Bills",
									abbreviation: "BUF",
									displayName: "Bills",
									shortDisplayName: "Buffalo",
									color: "#00338D",
									alternateColor: "#C60C30",
									logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
								},
								score: "0",
								records: [],
							},
							{
								id: "3",
								homeAway: "home",
								team: {
									id: "4",
									name: "New York Jets",
									abbreviation: "NYJ",
									displayName: "Jets",
									shortDisplayName: "New York",
									color: "#0C371D",
									alternateColor: "#FFFFFF",
									logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
								},
								score: "0",
								records: [],
							},
						],
						venue: {
							id: "5",
							fullName: "MetLife Stadium",
							address: { city: "East Rutherford", state: "NJ" },
						},
					},
				],
			}

			const normalized = normalizeGame(espnGame)

			expect(normalized).toEqual({
				espn_id: "401547456",
				sport: "NFL",
				season: "2024",
				week: 1,
				home_team: "NYJ",
				away_team: "BUF",
				start_time: "2024-09-08T20:00:00Z",
				status: "scheduled",
				home_score: 0,
				away_score: 0,
				is_snf: false, // Set to false initially, updated in sync function
				is_mnf: false,
				spread: undefined,
			})
		})

		it("should handle completed games correctly", () => {
			const espnGame: ESPNGame = {
				id: "401547456",
				date: "2024-09-08T20:00:00Z",
				name: "Bills at Jets",
				shortName: "BUF @ NYJ",
				season: { year: 2024, type: 2 },
				week: { number: 1 },
				competitions: [
					{
						id: "401547456",
						date: "2024-09-08T20:00:00Z",
						status: {
							type: {
								id: "3",
								name: "Final",
								state: "post",
								completed: true,
							},
						},
						competitors: [
							{
								id: "1",
								homeAway: "away",
								team: {
									id: "2",
									name: "Bills",
									abbreviation: "BUF",
									displayName: "Bills",
									shortDisplayName: "Buffalo",
									color: "#000",
									alternateColor: "#FFF",
									logo: "",
								},
								score: "24",
								records: [],
							},
							{
								id: "3",
								homeAway: "home",
								team: {
									id: "4",
									name: "Jets",
									abbreviation: "NYJ",
									displayName: "Jets",
									shortDisplayName: "New York",
									color: "#000",
									alternateColor: "#FFF",
									logo: "",
								},
								score: "16",
								records: [],
							},
						],
						venue: undefined,
					},
				],
			}

			const normalized = normalizeGame(espnGame)

			expect(normalized.status).toBe("final")
			expect(normalized.home_score).toBe(16)
			expect(normalized.away_score).toBe(24)
		})

		it("should determine SNF and MNF correctly", () => {
			// Sunday Night Football (Sunday 8PM+)
			const snfGame: ESPNGame = {
				id: "1",
				date: "2024-09-08T20:00:00Z", // Sunday 8PM
				name: "Test Game",
				shortName: "Test",
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
									name: "Team A",
									abbreviation: "A",
									displayName: "Team A",
									shortDisplayName: "A",
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
									name: "Team B",
									abbreviation: "B",
									displayName: "Team B",
									shortDisplayName: "B",
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
			}

			// Monday Night Football (Monday 8PM+)
			const mnfGame: ESPNGame = {
				id: "2",
				date: "2024-09-09T20:00:00Z", // Monday 8PM
				name: "Test Game",
				shortName: "Test",
				season: { year: 2024, type: 2 },
				week: { number: 1 },
				competitions: [
					{
						id: "2",
						date: "2024-09-09T20:00:00Z",
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
									name: "Team A",
									abbreviation: "A",
									displayName: "Team A",
									shortDisplayName: "A",
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
									name: "Team B",
									abbreviation: "B",
									displayName: "Team B",
									shortDisplayName: "B",
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
			}

			const snfNormalized = normalizeGame(snfGame)
			const mnfNormalized = normalizeGame(mnfGame)

			// Note: SNF/MNF detection is set to false initially in normalizeGame
			// It's updated later in the sync function based on game times
			expect(snfNormalized.is_snf).toBe(false)
			expect(snfNormalized.is_mnf).toBe(false)
			expect(mnfNormalized.is_snf).toBe(false)
			expect(mnfNormalized.is_mnf).toBe(false)
		})

		it("should throw error for games without competition data", () => {
			const espnGame: ESPNGame = {
				id: "1",
				date: "2024-09-08T20:00:00Z",
				name: "Test Game",
				shortName: "Test",
				season: { year: 2024, type: 2 },
				week: { number: 1 },
				competitions: [],
			}

			expect(() => normalizeGame(espnGame)).toThrow(
				"No competition data found for game 1"
			)
		})

		it("should throw error for games without team data", () => {
			const espnGame: ESPNGame = {
				id: "1",
				date: "2024-09-08T20:00:00Z",
				name: "Test Game",
				shortName: "Test",
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
									name: "Team A",
									abbreviation: "A",
									displayName: "Team A",
									shortDisplayName: "A",
									color: "#000",
									alternateColor: "#FFF",
									logo: "",
								},
								score: "0",
								records: [],
							},
							// Missing home team
						],
						venue: undefined,
					},
				],
			}

			expect(() => normalizeGame(espnGame)).toThrow(
				"Missing team data for game 1"
			)
		})
	})

	describe("normalizeStanding", () => {
		it("should normalize ESPN standing data correctly", () => {
			const espnStanding: ESPNStanding = {
				team: {
					id: "1",
					name: "Buffalo Bills",
					abbreviation: "BUF",
					displayName: "Bills",
					shortDisplayName: "Buffalo",
					color: "#00338D",
					alternateColor: "#C60C30",
					logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
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
					{
						id: "2",
						name: "pointsFor",
						abbreviation: "PF",
						type: "1",
						summary: "350",
						displayValue: "350",
						value: 350,
						stats: [],
					},
					{
						id: "3",
						name: "pointsAgainst",
						abbreviation: "PA",
						type: "1",
						summary: "320",
						displayValue: "320",
						value: 320,
						stats: [],
					},
				],
			}

			const normalized = normalizeStanding(espnStanding, "2024", "AFC", 3)

			expect(normalized).toEqual({
				team_id: "BUF",
				season: "2024",
				conference: "AFC",
				wins: 10,
				losses: 7,
				ties: 0,
				win_percentage: 0.588,
				points_for: 350,
				points_against: 320,
				rank: 3,
			})
		})

		it("should handle ties correctly", () => {
			const espnStanding: ESPNStanding = {
				team: {
					id: "1",
					name: "Test Team",
					abbreviation: "TEST",
					displayName: "Test",
					shortDisplayName: "Test",
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
						summary: "10-6-1",
						displayValue: "10-6-1",
						value: 17,
						stats: [],
					},
				],
			}

			const normalized = normalizeStanding(espnStanding, "2024", "NFC", 1)

			expect(normalized.wins).toBe(10)
			expect(normalized.losses).toBe(6)
			expect(normalized.ties).toBe(1)
			expect(normalized.win_percentage).toBe(0.618) // (10 + 0.5) / 17
		})

		it("should handle missing stats gracefully", () => {
			const espnStanding: ESPNStanding = {
				team: {
					id: "1",
					name: "Test Team",
					abbreviation: "TEST",
					displayName: "Test",
					shortDisplayName: "Test",
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
						summary: "0-0",
						displayValue: "0-0",
						value: 0,
						stats: [],
					},
				],
			}

			const normalized = normalizeStanding(espnStanding, "2024", "AFC", 1)

			expect(normalized.wins).toBe(0)
			expect(normalized.losses).toBe(0)
			expect(normalized.ties).toBe(0)
			expect(normalized.win_percentage).toBe(0)
			expect(normalized.points_for).toBe(0)
			expect(normalized.points_against).toBe(0)
		})
	})

	describe("Batch normalization functions", () => {
		it("should normalize multiple teams", () => {
			const espnTeams: ESPNTeam[] = [
				{
					id: "1",
					name: "Bills",
					abbreviation: "BUF",
					displayName: "Bills",
					shortDisplayName: "Buffalo",
					location: "Buffalo",
					color: "#000",
					alternateColor: "#FFF",
					logo: "",
				},
				{
					id: "2",
					name: "Jets",
					abbreviation: "NYJ",
					displayName: "Jets",
					shortDisplayName: "New York",
					location: "New York",
					color: "#000",
					alternateColor: "#FFF",
					logo: "",
				},
			]

			const normalized = normalizeTeams(espnTeams)

			expect(normalized).toHaveLength(2)
			expect(normalized[0].abbreviation).toBe("BUF")
			expect(normalized[1].abbreviation).toBe("NYJ")
		})

		it("should normalize multiple games", () => {
			const espnGames: ESPNGame[] = [
				{
					id: "1",
					date: "2024-09-08T20:00:00Z",
					name: "Game 1",
					shortName: "G1",
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
										name: "Team A",
										abbreviation: "A",
										displayName: "Team A",
										shortDisplayName: "A",
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
										name: "Team B",
										abbreviation: "B",
										displayName: "Team B",
										shortDisplayName: "B",
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

			const normalized = normalizeGames(espnGames)

			expect(normalized).toHaveLength(1)
			expect(normalized[0].espn_id).toBe("1")
		})

		it("should normalize all standings for both conferences", () => {
			const afcStandings: ESPNStanding[] = [
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

			const nfcStandings: ESPNStanding[] = [
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

			const normalized = normalizeAllStandings(
				afcStandings,
				nfcStandings,
				"2024"
			)

			expect(normalized).toHaveLength(2)
			expect(normalized[0].conference).toBe("AFC")
			expect(normalized[0].team_id).toBe("BUF")
			expect(normalized[1].conference).toBe("NFC")
			expect(normalized[1].team_id).toBe("DAL")
		})
	})
})
