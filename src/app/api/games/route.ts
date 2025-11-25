import { NextRequest } from "next/server"
import { dataSync } from "@/lib/api/sync"
import { createClient } from "@/lib/supabase/server"
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

		// Sync games from ESPN API to database (with smart caching)
		// This will only sync if data is stale or first time
		await dataSync.syncGames(parseInt(season), weekNumber)

		// Sync odds separately - these can change frequently and need more frequent updates
		// Only sync if week is provided (to avoid syncing all games)
		if (weekNumber !== undefined) {
			await dataSync.syncGameOdds(parseInt(season), weekNumber)
		}

		// Also sync teams to ensure we have the latest team data
		const teams = await dataSync.syncTeams()

		// Fetch games from database (they now have UUIDs)
		const supabase = await createClient()
		let query = supabase
			.from("games")
			.select("*")
			.eq("season", season)

		if (weekNumber) {
			query = query.eq("week", weekNumber)
		}

		if (status) {
			query = query.eq("status", status)
		}

		const { data: games, error: gamesError } = await query

		if (gamesError) {
			return handleAPIError(gamesError, "fetch games from database")
		}

		// Create a mapping of team abbreviations to team data
		const teamMap = teams.reduce((acc, team) => {
			acc[team.abbreviation] = team
			return acc
		}, {} as Record<string, typeof teams[0]>)

		// Enrich games with team data
		let enrichedGames = (games || []).map(game => ({
			...game,
			home_team_data: teamMap[game.home_team] || null,
			away_team_data: teamMap[game.away_team] || null,
		}))

		// Apply team filter if provided
		if (team) {
			enrichedGames = enrichedGames.filter(game => 
				game.home_team === team || game.away_team === team
			)
		}

		// Sort by start time (earliest first), then by home team (alphabetical)
		enrichedGames.sort((a, b) => {
			const timeDiff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
			if (timeDiff !== 0) return timeDiff
			// If start times are equal, sort by home team alphabetically
			return a.home_team.localeCompare(b.home_team)
		})

		return createSuccessResponse(enrichedGames, {
			count: enrichedGames.length,
			season,
			week: weekNumber
		})

	} catch (error) {
		return handleAPIError(error, "fetch games")
	}
}
