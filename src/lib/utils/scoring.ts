// Scoring utility functions for calculating pick correctness and weekly scores

import type { Game, Pick, Score } from "@/lib/types/database"

/**
 * Determine the winning team for a game
 * Returns null if game is not final or scores are missing
 */
export function getWinningTeam(game: Game): string | null {
	if (game.status !== "final") {
		return null
	}

	if (
		game.home_score === null ||
		game.home_score === undefined ||
		game.away_score === null ||
		game.away_score === undefined
	) {
		return null
	}

	if (game.home_score > game.away_score) {
		return game.home_team
	} else if (game.away_score > game.home_score) {
		return game.away_team
	} else {
		// Tie - in NFL, this is rare but possible
		// For scoring purposes, we'll return null (no winner)
		return null
	}
}

/**
 * Check if a pick is correct
 * Returns true if pick is correct, false if incorrect, null if game not final or no winner
 */
export function isPickCorrect(pick: Pick, game: Game): boolean | null {
	const winningTeam = getWinningTeam(game)
	if (winningTeam === null) {
		return null
	}

	return pick.picked_team === winningTeam
}

/**
 * Calculate points for a single pick
 * Returns the confidence_points if correct, 0 if incorrect, null if game not final
 */
export function calculatePickPoints(pick: Pick, game: Game): number | null {
	// Incomplete picks (confidence_points = 0) don't count
	if (pick.confidence_points === 0) {
		return null
	}

	const correct = isPickCorrect(pick, game)
	if (correct === null) {
		return null
	}

	return correct ? pick.confidence_points : 0
}

/**
 * Calculate weekly score for a user from their picks
 * Returns aggregated score data for a week
 */
export function calculateWeeklyScore(
	picks: Pick[],
	games: Game[]
): {
	points: number
	correct_picks: number
	total_picks: number
} {
	let points = 0
	let correct_picks = 0
	let total_picks = 0

	// Create a map of game_id to game for quick lookup
	const gameMap = new Map<string, Game>()
	games.forEach((game) => {
		gameMap.set(game.id, game)
	})

	// Process each pick
	picks.forEach((pick) => {
		const game = gameMap.get(pick.game_id)
		if (!game) {
			// Game not found - skip this pick
			return
		}

		// Only count picks with confidence_points > 0 (complete picks)
		if (pick.confidence_points === 0) {
			return
		}

		total_picks++

		const pickPoints = calculatePickPoints(pick, game)
		if (pickPoints !== null) {
			points += pickPoints
			if (pickPoints > 0) {
				correct_picks++
			}
		}
	})

	return {
		points,
		correct_picks,
		total_picks,
	}
}

/**
 * Recalculate scores for a specific week and user
 * This can be called when games finish to update scores
 */
export async function recalculateUserWeekScore(
	supabase: any,
	userId: string,
	week: number,
	season: string
): Promise<Score | null> {
	// Fetch all picks for this user and week
	const { data: picks, error: picksError } = await supabase
		.from("picks")
		.select("*")
		.eq("user_id", userId)

	if (picksError) {
		throw new Error(`Failed to fetch picks: ${picksError.message}`)
	}

	// Fetch all games for this week
	const { data: games, error: gamesError } = await supabase
		.from("games")
		.select("*")
		.eq("season", season)
		.eq("week", week)

	if (gamesError) {
		throw new Error(`Failed to fetch games: ${gamesError.message}`)
	}

	// Filter picks to only this week's games
	const weekGameIds = new Set(games?.map((g: Game) => g.id) || [])
	const weekPicks = picks?.filter((p: Pick) => weekGameIds.has(p.game_id)) || []

	// Calculate score
	const scoreData = calculateWeeklyScore(weekPicks, games || [])

	// Upsert score record
	const { data: score, error: scoreError } = await supabase
		.from("scores")
		.upsert(
			{
				user_id: userId,
				week,
				season,
				points: scoreData.points,
				correct_picks: scoreData.correct_picks,
				total_picks: scoreData.total_picks,
			},
			{
				onConflict: "user_id,week,season",
			}
		)
		.select()
		.single()

	if (scoreError) {
		throw new Error(`Failed to save score: ${scoreError.message}`)
	}

	return score
}

