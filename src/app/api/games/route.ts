import { NextRequest } from "next/server"
import { dataSync } from "@/lib/api/sync"
import { createSuccessResponse, handleAPIError, isValidGameStatus, isValidTeamAbbreviation } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		// Get query parameters
		const { searchParams } = new URL(request.url)
		const season = searchParams.get("season") || "2025"
		const week = searchParams.get("week")
		const status = searchParams.get("status")
		const team = searchParams.get("team")

		// Parse week as number if provided
		const weekNumber = week ? parseInt(week) : undefined

		// Validate parameters
		if (status && !isValidGameStatus(status)) {
			return handleAPIError(new Error(`Invalid game status: ${status}`), "fetch games")
		}

		if (team && !isValidTeamAbbreviation(team)) {
			return handleAPIError(new Error(`Invalid team abbreviation: ${team}`), "fetch games")
		}

		// Sync games from ESPN API
		const games = await dataSync.syncGames(parseInt(season), weekNumber)

		// Also sync teams to ensure we have the latest team data
		const teams = await dataSync.syncTeams()

		// Create a mapping of team abbreviations to team data
		const teamMap = teams.reduce((acc, team) => {
			acc[team.abbreviation] = team
			return acc
		}, {} as Record<string, typeof teams[0]>)

		// Enrich games with team data
		const enrichedGames = games.map(game => ({
			...game,
			home_team_data: teamMap[game.home_team] || null,
			away_team_data: teamMap[game.away_team] || null,
		}))

		// Apply filters if provided
		let filteredGames = enrichedGames

		if (status) {
			filteredGames = filteredGames.filter(game => game.status === status)
		}

		if (team) {
			filteredGames = filteredGames.filter(game => 
				game.home_team === team || game.away_team === team
			)
		}

		// Sort by start time (earliest first)
		filteredGames.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

		return createSuccessResponse(filteredGames, {
			count: filteredGames.length,
			season,
			week: weekNumber
		})

	} catch (error) {
		return handleAPIError(error, "fetch games")
	}
}
