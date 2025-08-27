// Data normalization service for ESPN API
// Transforms ESPN data structures into our database schema format

import type { ESPNTeam, ESPNGame, ESPNStanding } from "./espn"
import type { Team, Database } from "@/lib/types/database"

export interface NormalizedGame
	extends Omit<Game, "id" | "created_at" | "updated_at"> {
	espn_id: string
}

export interface NormalizedTeam
	extends Omit<Team, "id" | "created_at" | "updated_at"> {
	espn_id: string
}

export interface NormalizedStanding {
	team_id: string
	season: string
	conference: "AFC" | "NFC"
	wins: number
	losses: number
	ties: number
	win_percentage: number
	points_for: number
	points_against: number
	rank: number
}

/**
 * Normalize ESPN team data to our database schema
 */
export function normalizeTeam(espnTeam: ESPNTeam): NormalizedTeam {
	return {
		espn_id: espnTeam.id,
		name: espnTeam.name,
		abbreviation: espnTeam.abbreviation,
		display_name: espnTeam.displayName,
		short_display_name: espnTeam.shortDisplayName,
		location: espnTeam.location,
		primary_color: espnTeam.color,
		secondary_color: espnTeam.alternateColor,
		logo_url: espnTeam.logo,
		conference: determineConference(espnTeam.abbreviation),
		division: determineDivision(espnTeam.abbreviation),
		active: true,
	}
}

/**
 * Normalize ESPN game data to our database schema
 */
export function normalizeGame(espnGame: ESPNGame): NormalizedGame {
	const competition = espnGame.competitions[0]
	if (!competition) {
		throw new Error(`No competition data found for game ${espnGame.id}`)
	}

	const homeTeam = competition.competitors.find((c) => c.homeAway === "home")
	const awayTeam = competition.competitors.find((c) => c.homeAway === "away")

	if (!homeTeam || !awayTeam) {
		throw new Error(`Missing team data for game ${espnGame.id}`)
	}

	// Parse game date
	const gameDate = new Date(espnGame.date)

	// Determine if it's SNF or MNF based on time
	// SNF: Sunday 8:20 PM ET - typically the last game on Sunday
	// MNF: Monday 8:30 PM ET - typically the only Monday game
	// ESPN API returns UTC times, so we need to convert properly
	// ET is UTC-5 (standard) or UTC-4 (daylight)
	// For September (standard time): ET = UTC-5
	// So 8:20 PM ET = 1:20 AM UTC next day
	// And 8:30 PM ET = 1:30 AM UTC next day

	// Convert UTC time to ET by subtracting 5 hours
	// For September (standard time): ET = UTC-5
	let etHour = gameDate.getUTCHours() - 5
	let etDay = gameDate.getUTCDay()

	// Handle day boundary crossing
	if (etHour < 0) {
		etHour += 24
		etDay = (etDay - 1 + 7) % 7
	}

	// SNF: Sunday 8PM ET or later (8PM = 20:00 ET)
	const isSNF = etDay === 0 && etHour >= 20

	// MNF: Monday 8PM ET or later (8PM = 20:00 ET)
	const isMNF = etDay === 1 && etHour >= 20

	// Parse scores if available
	const homeScore = homeTeam.score ? parseInt(homeTeam.score) : undefined
	const awayScore = awayTeam.score ? parseInt(awayTeam.score) : undefined

	// Determine game status
	let status: Database["public"]["Enums"]["game_status"] = "scheduled"
	if (competition.status.type.completed) {
		status = "final"
	} else if (competition.status.type.state === "in") {
		status = "live"
	}

	return {
		espn_id: espnGame.id,
		sport: "NFL",
		season: espnGame.season.year.toString(),
		week: espnGame.week.number,
		home_team: homeTeam.team.abbreviation,
		away_team: awayTeam.team.abbreviation,
		start_time: espnGame.date,
		status,
		home_score: homeScore,
		away_score: awayScore,
		is_snf: isSNF,
		is_mnf: isMNF,
		spread: undefined, // ESPN doesn't provide spreads
	}
}

/**
 * Normalize ESPN standings data to our database schema
 */
export function normalizeStanding(
	espnStanding: ESPNStanding,
	season: string,
	conference: "AFC" | "NFC",
	rank: number
): NormalizedStanding {
	// Find the overall record (type 2 is usually overall)
	const overallRecord =
		espnStanding.records.find((r) => r.type === "2") || espnStanding.records[0]

	// Find points for/against stats
	const pointsForStat = espnStanding.records.find((r) => r.name === "pointsFor")
	const pointsAgainstStat = espnStanding.records.find(
		(r) => r.name === "pointsAgainst"
	)

	// Parse record (e.g., "10-7" -> wins: 10, losses: 7)
	const recordParts = overallRecord?.summary?.split("-") || ["0", "0"]
	const wins = parseInt(recordParts[0]) || 0
	const losses = parseInt(recordParts[1]) || 0
	const ties = parseInt(recordParts[2]) || 0

	// Calculate win percentage
	const totalGames = wins + losses + ties
	const winPercentage = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0

	// Extract team ID from the team reference URL
	// The URL format is: http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/{TEAM_ID}?lang=en&region=us
	let teamId = ""
	if (
		espnStanding.team &&
		typeof espnStanding.team === "object" &&
		"$ref" in espnStanding.team
	) {
		const refUrl = (espnStanding.team as any).$ref
		const match = refUrl.match(/\/teams\/(\d+)/)
		if (match) {
			teamId = match[1]
		}
	}

	return {
		team_id: teamId, // Use the extracted team ID
		season,
		conference,
		wins,
		losses,
		ties,
		win_percentage: Math.round(winPercentage * 1000) / 1000, // Round to 3 decimal places
		points_for: pointsForStat?.value || 0,
		points_against: pointsAgainstStat?.value || 0,
		rank,
	}
}

/**
 * Determine NFL conference based on team abbreviation
 */
function determineConference(abbreviation: string): "AFC" | "NFC" {
	const afcTeams = [
		"BUF",
		"MIA",
		"NE",
		"NYJ", // AFC East
		"CIN",
		"BAL",
		"CLE",
		"PIT", // AFC North
		"HOU",
		"IND",
		"JAX",
		"TEN", // AFC South
		"DEN",
		"KC",
		"LV",
		"LAC", // AFC West
	]

	return afcTeams.includes(abbreviation) ? "AFC" : "NFC"
}

/**
 * Determine NFL division based on team abbreviation
 */
function determineDivision(
	abbreviation: string
): "East" | "North" | "South" | "West" {
	const divisions = {
		East: ["BUF", "MIA", "NE", "NYJ", "DAL", "NYG", "PHI", "WAS"],
		North: ["CIN", "BAL", "CLE", "PIT", "CHI", "DET", "GB", "MIN"],
		South: ["HOU", "IND", "JAX", "TEN", "ATL", "CAR", "NO", "TB"],
		West: ["DEN", "KC", "LV", "LAC", "ARI", "LAR", "SF", "SEA"],
	}

	for (const [division, teams] of Object.entries(divisions)) {
		if (teams.includes(abbreviation)) {
			return division as "East" | "North" | "South" | "West"
		}
	}

	return "East" // Default fallback
}

/**
 * Batch normalize multiple teams
 */
export function normalizeTeams(espnTeams: ESPNTeam[]): NormalizedTeam[] {
	return espnTeams.map(normalizeTeam)
}

/**
 * Batch normalize multiple games
 */
export function normalizeGames(espnGames: ESPNGame[]): NormalizedGame[] {
	return espnGames.map(normalizeGame)
}

/**
 * Batch normalize standings for both conferences
 */
export function normalizeAllStandings(
	afcStandings: ESPNStanding[],
	nfcStandings: ESPNStanding[],
	season: string
): NormalizedStanding[] {
	const afcNormalized = afcStandings.map((standing, index) =>
		normalizeStanding(standing, season, "AFC", index + 1)
	)

	const nfcNormalized = nfcStandings.map((standing, index) =>
		normalizeStanding(standing, season, "NFC", index + 1)
	)

	return [...afcNormalized, ...nfcNormalized]
}
