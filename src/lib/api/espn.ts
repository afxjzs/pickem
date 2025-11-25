// ESPN API service layer for NFL data
// This service handles fetching teams, schedule, and standings from ESPN's free API

export interface ESPNTeam {
	id: string
	name: string
	abbreviation: string
	displayName: string
	shortDisplayName: string
	location: string
	color: string
	alternateColor: string
	logo: string
	record?: {
		wins: number
		losses: number
		ties: number
		winPercent: number
	}
}

export interface ESPNGame {
	id: string
	date: string
	name: string
	shortName: string
	season: {
		year: number
		type: number
	}
	week: {
		number: number
	}
	competitions: Array<{
		id: string
		date: string
		status: {
			type: {
				id: string
				name: string
				state: string
				completed: boolean
			}
		}
		competitors: Array<{
			id: string
			homeAway: string
			team: {
				id: string
				name: string
				abbreviation: string
				displayName: string
				shortDisplayName: string
				color: string
				alternateColor: string
				logo: string
			}
			score: string
			records: Array<{
				name: string
				summary: string
			}>
		}>
		venue?: {
			id: string
			fullName: string
			address: {
				city: string
				state: string
			}
		}
	}>
}

export interface ESPNStanding {
	team: {
		id: string
		name: string
		abbreviation: string
		displayName: string
		shortDisplayName: string
		color: string
		alternateColor: string
		logo: string
	}
	records: Array<{
		id: string
		name: string
		abbreviation: string
		type: string
		summary: string
		displayValue: string
		value: number
		stats: Array<{
			name: string
			displayName: string
			shortDisplayName: string
			description: string
			abbreviation: string
			type: string
			value: string
		}>
	}>
}

// ESPN API response types
interface ESPNScheduleResponse {
	content: {
		sbData: {
			events: Array<{
				id: string
				date: string
				name: string
				shortName: string
				season?: {
					year: number
					type: string
				}
				week?: {
					number: number
				}
				competitions?: Array<{
					id: string
					date: string
					status?: {
						type?: {
							id: string
							name: string
							state: string
							completed: boolean
						}
					}
					competitors?: Array<{
						id: string
						homeAway: string
						team?: {
							id: string
							name: string
							abbreviation: string
							displayName: string
							shortDisplayName: string
							color: string
							alternateColor: string
							logo: string
							logos?: Array<{ href: string }>
						}
						score?: string
						records?: Array<{
							name: string
							summary: string
						}>
					}>
					venue?: {
						id: string
						fullName: string
						address?: {
							city: string
							state: string
						}
					}
				}>
			}>
		}
	}
}

interface ESPNTeamsResponse {
	sports: Array<{
		leagues: Array<{
			teams: Array<{
				team: {
					id: string
					name: string
					abbreviation: string
					displayName: string
					shortDisplayName: string
					location: string
					color: string
					alternateColor: string
					logo: string
					logos: Array<{ href: string }>
				}
			}>
		}>
	}>
}

interface ESPNStandingsResponse {
	standings: Array<{
		team: {
			id: string
			name: string
			abbreviation: string
			displayName: string
			shortDisplayName: string
			color: string
			alternateColor: string
			logo: string
			logos?: Array<{ href: string }>
		}
		records: Array<{
			id: string
			name: string
			abbreviation: string
			type: string
			summary: string
			displayValue: string
			value: number
			stats?: Array<{
				name: string
				displayName: string
				shortDisplayName: string
				description: string
				abbreviation: string
				type: string
				value: string
			}>
		}>
	}>
}

class ESPNAPIService {
	private baseURL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
	private coreURL =
		"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl"

	/**
	 * Fetch all NFL teams
	 */
	async getTeams(): Promise<ESPNTeam[]> {
		try {
			const response = await fetch(`${this.baseURL}/teams`)
			if (!response.ok) {
				throw new Error(`Failed to fetch teams: ${response.status}`)
			}

			const data: ESPNTeamsResponse = await response.json()
			return data.sports[0].leagues[0].teams.map((team) => ({
				id: team.team.id,
				name: team.team.name,
				abbreviation: team.team.abbreviation,
				displayName: team.team.displayName,
				shortDisplayName: team.team.shortDisplayName,
				location: team.team.location,
				color: team.team.color,
				alternateColor: team.team.alternateColor,
				logo: team.team.logos[0]?.href || "",
			}))
		} catch (error) {
			console.error("Error fetching teams:", error)
			throw new Error("Failed to fetch NFL teams")
		}
	}

	/**
	 * Fetch schedule for a specific week and season
	 */
	async getSchedule(season: number = 2025, week?: number): Promise<ESPNGame[]> {
		try {
			// Use the newer ESPN API format for schedule data
			let url = `${this.baseURL}/scoreboard`
			const params = new URLSearchParams({
				seasontype: "2", // Regular season
				limit: "100",
			})

			if (week) {
				params.append("week", week.toString())
			}

			url += `?${params.toString()}`

			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Failed to fetch schedule: ${response.status}`)
			}

			const data = await response.json()

			// Handle different response formats - ESPN API can return different structures
			let events: any[] = []
			if (data.events) {
				events = data.events
			} else if (data.content?.sbData?.events) {
				events = data.content.sbData.events
			} else if (data.content?.events) {
				events = data.content.events
			}

			if (!events || events.length === 0) {
				console.warn("No events found in ESPN API response")
				return []
			}

			return events.map((event: any) => ({
				id: event.id || "",
				date: event.date || "",
				name: event.name || "",
				shortName: event.shortName || "",
				season: {
					year: event.season?.year || season,
					type: event.season?.type || 2,
				},
				week: {
					number: event.week?.number || week || 0,
				},
				competitions: (event.competitions || []).map((comp: any) => ({
					id: comp.id || "",
					date: comp.date || "",
					status: {
						type: {
							id: comp.status?.type?.id || "1",
							name: comp.status?.type?.name || "scheduled",
							state: comp.status?.type?.state || "pre",
							completed: comp.status?.type?.completed || false,
						},
					},
					competitors: (comp.competitors || []).map((competitor: any) => ({
						id: competitor.id || "",
						homeAway: competitor.homeAway || "",
						team: {
							id: competitor.team?.id || "",
							name: competitor.team?.name || "",
							abbreviation: competitor.team?.abbreviation || "",
							displayName:
								competitor.team?.displayName || competitor.team?.name || "",
							shortDisplayName:
								competitor.team?.shortDisplayName ||
								competitor.team?.abbreviation ||
								"",
							color: competitor.team?.color || "",
							alternateColor: competitor.team?.alternateColor || "",
							logo: competitor.team?.logos?.[0]?.href || "",
						},
						score: competitor.score || "0",
						records: (competitor.records || []).map((record: any) => ({
							name: record.name || "",
							summary: record.summary || "",
						})),
					})),
					venue: comp.venue
						? {
								id: comp.venue.id || "",
								fullName: comp.venue.fullName || "",
								address: {
									city: comp.venue.address?.city || "",
									state: comp.venue.address?.state || "",
								},
						  }
						: undefined,
				})),
			}))
		} catch (error) {
			console.error("Error fetching schedule:", error)
			throw new Error("Failed to fetch NFL schedule")
		}
	}

	/**
	 * Fetch standings for a specific season and conference
	 * conference: 8 for AFC, 7 for NFC
	 */
	async getStandings(
		season: number = 2025,
		conference: number = 8
	): Promise<ESPNStanding[]> {
		try {
			// Use the original ESPN API format that works
			const response = await fetch(
				`${this.coreURL}/seasons/${season}/types/2/groups/${conference}/standings/0?lang=en&region=us`
			)
			if (!response.ok) {
				throw new Error(`Failed to fetch standings: ${response.status}`)
			}

			const data: ESPNStandingsResponse = await response.json()

			// The API returns standings with team references and records
			return data.standings.map((standing) => {
				// Find the overall record (usually the first record entry)
				const overallRecord =
					standing.records?.find((r) => r.type === "total") ||
					standing.records?.[0]

				// Find points for/against stats from the overall record
				const pointsFor =
					overallRecord?.stats?.find((s) => s.name === "pointsFor")?.value || 0
				const pointsAgainst =
					overallRecord?.stats?.find((s) => s.name === "pointsAgainst")
						?.value || 0

				// Extract wins, losses, ties from the summary
				const summary = overallRecord?.summary || "0-0-0"
				const [wins = 0, losses = 0, ties = 0] = summary.split("-").map(Number)

				return {
					team: {
						id: standing.team?.id || "",
						name: standing.team?.name || "",
						abbreviation: standing.team?.abbreviation || "",
						displayName:
							standing.team?.displayName || standing.team?.name || "",
						shortDisplayName:
							standing.team?.shortDisplayName ||
							standing.team?.abbreviation ||
							"",
						color: standing.team?.color || "",
						alternateColor: standing.team?.alternateColor || "",
						logo: standing.team?.logos?.[0]?.href || "",
					},
					records: [
						{
							id: overallRecord?.id || "",
							name: overallRecord?.name || "total",
							abbreviation: overallRecord?.abbreviation || "TOT",
							type: overallRecord?.type || "total",
							summary: summary,
							displayValue: overallRecord?.displayValue || summary,
							value: overallRecord?.value || 0,
							stats: [
								{
									name: "wins",
									displayName: "Wins",
									shortDisplayName: "W",
									description: "Total wins",
									abbreviation: "W",
									type: "number",
									value: wins.toString(),
								},
								{
									name: "losses",
									displayName: "Losses",
									shortDisplayName: "L",
									description: "Total losses",
									abbreviation: "L",
									type: "number",
									value: losses.toString(),
								},
								{
									name: "ties",
									displayName: "Ties",
									shortDisplayName: "T",
									description: "Total ties",
									abbreviation: "T",
									type: "number",
									value: ties.toString(),
								},
								{
									name: "pointsFor",
									displayName: "Points For",
									shortDisplayName: "PF",
									description: "Total points scored",
									abbreviation: "PF",
									type: "number",
									value: pointsFor.toString(),
								},
								{
									name: "pointsAgainst",
									displayName: "Points Against",
									shortDisplayName: "PA",
									description: "Total points allowed",
									abbreviation: "PA",
									type: "number",
									value: pointsAgainst.toString(),
								},
							],
						},
					],
				}
			})
		} catch (error) {
			console.error("Error fetching standings:", error)
			throw new Error("Failed to fetch NFL standings")
		}
	}

	/**
	 * Fetch odds (spread and over/under) for a specific game
	 * @param eventId - ESPN event ID (game ID)
	 * @returns Object with spread and overUnder, or null if not available
	 */
	async getGameOdds(
		eventId: string
	): Promise<{ spread: number | null; overUnder: number | null } | null> {
		try {
			// ESPN odds endpoint
			const url = `${this.coreURL}/events/${eventId}/competitions/${eventId}/odds`
			const response = await fetch(url)

			if (!response.ok) {
				// Odds may not be available for all games, return null instead of throwing
				if (response.status === 404) {
					return null
				}
				throw new Error(`Failed to fetch odds: ${response.status}`)
			}

			const data = await response.json()

			// ESPN odds API returns an items array with odds from different providers
			// Some items may have $ref (need to fetch separately), others have direct data
			// We'll use the first item with direct spread/overUnder data
			const items = data.items || []

			if (items.length === 0) {
				return null
			}

			// Find first item with direct spread/overUnder data (not just a $ref)
			let spread: number | null = null
			let overUnder: number | null = null

			for (const item of items) {
				// Skip items that only have $ref (would need separate fetch)
				if (item.$ref && !item.spread && !item.overUnder) {
					continue
				}

				// Spread is from home team's perspective:
				// - Negative value = home team favored (e.g., -6.5 means home team favored by 6.5)
				// - Positive value = away team favored (e.g., +3 means away team favored by 3)
				if (item.spread !== undefined && spread === null) {
					spread = Number(item.spread)
				}

				// Over/under is the total points line
				if (item.overUnder !== undefined && overUnder === null) {
					overUnder = Number(item.overUnder)
				}

				// If we found both values, we're done
				if (spread !== null && overUnder !== null) {
					break
				}
			}

			// Return result if we have at least one value
			if (spread !== null || overUnder !== null) {
				return { spread, overUnder }
			}

			return null
		} catch (error) {
			console.error(`Error fetching odds for game ${eventId}:`, error)
			// Return null instead of throwing - odds may not be available
			return null
		}
	}

	/**
	 * Fetch both AFC and NFC standings
	 */
	async getAllStandings(
		season: number = 2025
	): Promise<{ afc: ESPNStanding[]; nfc: ESPNStanding[] }> {
		try {
			const [afc, nfc] = await Promise.all([
				this.getStandings(season, 8), // AFC
				this.getStandings(season, 7), // NFC
			])

			return { afc, nfc }
		} catch (error) {
			console.error("Error fetching all standings:", error)
			throw new Error("Failed to fetch NFL standings")
		}
	}

	/**
	 * Get current season and week information
	 * NFL weeks reset at noon Tuesday ET
	 */
	async getCurrentSeasonInfo(): Promise<{
		season: number
		currentWeek: number
	}> {
		try {
			const response = await fetch(`${this.baseURL}/scoreboard`)
			if (!response.ok) {
				throw new Error(`Failed to fetch season info: ${response.status}`)
			}

			const data = await response.json()
			const espnWeek = data.week?.number || 1
			const season = data.season?.year || 2025

			// Check if it's after noon Tuesday ET - if so, increment week
			const now = new Date()
			// Convert to ET (Eastern Time)
			const etTime = new Date(
				now.toLocaleString("en-US", { timeZone: "America/New_York" })
			)
			const dayOfWeek = etTime.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
			const hour = etTime.getHours()

			// If it's Tuesday and after noon ET, or Wednesday or later, increment week
			let currentWeek = espnWeek
			if (dayOfWeek === 2 && hour >= 12) {
				// Tuesday at or after noon ET - week has reset
				currentWeek = espnWeek + 1
			} else if (dayOfWeek > 2) {
				// Wednesday or later - week has reset
				currentWeek = espnWeek + 1
			}

			return {
				season,
				currentWeek,
			}
		} catch (error) {
			console.error("Error fetching season info:", error)
			// Return default values if API fails
			return { season: 2025, currentWeek: 1 }
		}
	}
}

// Export singleton instance
export const espnAPI = new ESPNAPIService()
