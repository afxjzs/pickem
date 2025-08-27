import { describe, it, expect } from "@jest/globals"
import {
	isValidTeamAbbreviation,
	isValidConference,
	isValidDivision,
	isValidGameStatus,
} from "../utils"

describe("API Endpoint Logic", () => {
	describe("Parameter Validation", () => {
		it("should validate team abbreviations correctly", () => {
			// AFC Teams
			expect(isValidTeamAbbreviation("BUF")).toBe(true)
			expect(isValidTeamAbbreviation("MIA")).toBe(true)
			expect(isValidTeamAbbreviation("KC")).toBe(true)

			// NFC Teams
			expect(isValidTeamAbbreviation("DAL")).toBe(true)
			expect(isValidTeamAbbreviation("GB")).toBe(true)
			expect(isValidTeamAbbreviation("SF")).toBe(true)

			// Invalid
			expect(isValidTeamAbbreviation("XXX")).toBe(false)
			expect(isValidTeamAbbreviation("")).toBe(false)
		})

		it("should validate conferences correctly", () => {
			expect(isValidConference("AFC")).toBe(true)
			expect(isValidConference("NFC")).toBe(true)
			expect(isValidConference("afc")).toBe(true)
			expect(isValidConference("nfc")).toBe(true)
			expect(isValidConference("ABC")).toBe(false)
		})

		it("should validate divisions correctly", () => {
			expect(isValidDivision("East")).toBe(true)
			expect(isValidDivision("North")).toBe(true)
			expect(isValidDivision("South")).toBe(true)
			expect(isValidDivision("West")).toBe(true)
			expect(isValidDivision("Central")).toBe(false)
		})

		it("should validate game statuses correctly", () => {
			expect(isValidGameStatus("scheduled")).toBe(true)
			expect(isValidGameStatus("live")).toBe(true)
			expect(isValidGameStatus("final")).toBe(true)
			expect(isValidGameStatus("cancelled")).toBe(true)
			expect(isValidGameStatus("pending")).toBe(false)
		})
	})

	describe("Data Processing Logic", () => {
		it("should handle team filtering logic", () => {
			const mockTeams = [
				{ abbreviation: "BUF", conference: "AFC", division: "East" },
				{ abbreviation: "MIA", conference: "AFC", division: "East" },
				{ abbreviation: "DAL", conference: "NFC", division: "East" },
				{ abbreviation: "NYG", conference: "NFC", division: "East" },
			]

			// Filter by AFC conference
			const afcTeams = mockTeams.filter((team) => team.conference === "AFC")
			expect(afcTeams).toHaveLength(2)
			expect(afcTeams[0].abbreviation).toBe("BUF")
			expect(afcTeams[1].abbreviation).toBe("MIA")

			// Filter by East division
			const eastTeams = mockTeams.filter((team) => team.division === "East")
			expect(eastTeams).toHaveLength(4)

			// Filter by both AFC and East
			const afcEastTeams = mockTeams.filter(
				(team) => team.conference === "AFC" && team.division === "East"
			)
			expect(afcEastTeams).toHaveLength(2)
		})

		it("should handle game filtering logic", () => {
			const mockGames = [
				{ status: "scheduled", home_team: "BUF", away_team: "MIA" },
				{ status: "live", home_team: "DAL", away_team: "NYG" },
				{ status: "final", home_team: "KC", away_team: "LV" },
			]

			// Filter by status
			const scheduledGames = mockGames.filter(
				(game) => game.status === "scheduled"
			)
			expect(scheduledGames).toHaveLength(1)
			expect(scheduledGames[0].home_team).toBe("BUF")

			// Filter by team
			const bufGames = mockGames.filter(
				(game) => game.home_team === "BUF" || game.away_team === "BUF"
			)
			expect(bufGames).toHaveLength(1)
			expect(bufGames[0].away_team).toBe("BUF")
		})

		it("should handle standings grouping logic", () => {
			const mockStandings = [
				{ team_id: "BUF", conference: "AFC", rank: 1 },
				{ team_id: "MIA", conference: "AFC", rank: 2 },
				{ team_id: "DAL", conference: "NFC", rank: 1 },
				{ team_id: "NYG", conference: "NFC", rank: 2 },
			]

			// Group by conference
			const grouped = mockStandings.reduce((acc, standing) => {
				if (!acc[standing.conference]) {
					acc[standing.conference] = []
				}
				acc[standing.conference].push(standing)
				return acc
			}, {} as Record<string, typeof mockStandings>)

			expect(grouped.AFC).toHaveLength(2)
			expect(grouped.NFC).toHaveLength(2)
			expect(grouped.AFC[0].team_id).toBe("BUF")
			expect(grouped.NFC[0].team_id).toBe("DAL")
		})
	})

	describe("Sorting Logic", () => {
		it("should sort teams by conference, division, and name", () => {
			const mockTeams = [
				{ name: "Bills", conference: "AFC", division: "East" },
				{ name: "Cowboys", conference: "NFC", division: "East" },
				{ name: "Dolphins", conference: "AFC", division: "East" },
				{ name: "Giants", conference: "NFC", division: "East" },
			]

			const sorted = mockTeams.sort((a, b) => {
				// First by conference
				if (a.conference !== b.conference) {
					return a.conference.localeCompare(b.conference)
				}
				// Then by division
				if (a.division !== b.division) {
					return a.division.localeCompare(b.division)
				}
				// Finally by name
				return a.name.localeCompare(b.name)
			})

			expect(sorted[0].conference).toBe("AFC")
			expect(sorted[0].name).toBe("Bills")
			expect(sorted[1].conference).toBe("AFC")
			expect(sorted[1].name).toBe("Dolphins")
			expect(sorted[2].conference).toBe("NFC")
			expect(sorted[2].name).toBe("Cowboys")
			expect(sorted[3].conference).toBe("NFC")
			expect(sorted[3].name).toBe("Giants")
		})

		it("should sort games by start time", () => {
			const mockGames = [
				{ start_time: "2024-09-08T20:00:00Z" },
				{ start_time: "2024-09-08T13:00:00Z" },
				{ start_time: "2024-09-08T17:00:00Z" },
			]

			const sorted = mockGames.sort(
				(a, b) =>
					new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
			)

			expect(sorted[0].start_time).toBe("2024-09-08T13:00:00Z")
			expect(sorted[1].start_time).toBe("2024-09-08T17:00:00Z")
			expect(sorted[2].start_time).toBe("2024-09-08T20:00:00Z")
		})

		it("should sort standings by rank within conference", () => {
			const mockStandings = [
				{ conference: "AFC", rank: 3 },
				{ conference: "AFC", rank: 1 },
				{ conference: "NFC", rank: 2 },
				{ conference: "NFC", rank: 1 },
			]

			const sorted = mockStandings.sort((a, b) => {
				// First by conference
				if (a.conference !== b.conference) {
					return a.conference.localeCompare(b.conference)
				}
				// Then by rank
				return a.rank - b.rank
			})

			expect(sorted[0].conference).toBe("AFC")
			expect(sorted[0].rank).toBe(1)
			expect(sorted[1].conference).toBe("AFC")
			expect(sorted[1].rank).toBe(3)
			expect(sorted[2].conference).toBe("NFC")
			expect(sorted[2].rank).toBe(1)
			expect(sorted[3].conference).toBe("NFC")
			expect(sorted[3].rank).toBe(2)
		})
	})
})
