// src/app/api/group-picks/route.ts
// API endpoint for group picks view (all users' picks for a specific week)

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSuccessResponse, handleAPIError } from "@/lib/api/utils"
import { espnAPI } from "@/lib/api/espn"
import type { Game, Pick, Team } from "@/lib/types/database"

/**
 * Sync game odds (spread and over/under) for a specific week
 * Uses service role client to bypass RLS
 */
async function syncGameOddsForWeek(
	supabase: ReturnType<typeof createClient>,
	season: number,
	week: number
): Promise<void> {
	// Fetch all games for this week that have espn_id
	const { data: games, error: gamesError } = await supabase
		.from("games")
		.select("id, espn_id, spread")
		.eq("season", season.toString())
		.eq("week", week)
		.not("espn_id", "is", null)

	if (gamesError) {
		console.error("Error fetching games for odds sync:", gamesError)
		return
	}

	if (!games || games.length === 0) {
		return
	}

	// Sync odds for all games (to ensure we have latest data)
	// But prioritize games without spread data
	const gamesWithoutSpread = games.filter(g => !g.spread && g.espn_id)
	const gamesWithSpread = games.filter(g => g.spread && g.espn_id)
	
	// Sync games without spread first, then games with spread (to refresh)
	const gamesToSync = [...gamesWithoutSpread, ...gamesWithSpread]

	if (gamesToSync.length === 0) {
		return
	}

	console.log(`Syncing odds for ${gamesToSync.length} games (${gamesWithoutSpread.length} missing spread)...`)

	// Sync odds for each game
	for (const game of gamesToSync) {
		if (!game.espn_id) {
			continue
		}

		try {
			// Fetch odds from ESPN
			const odds = await espnAPI.getGameOdds(game.espn_id)

			if (odds) {
				const updateData: { spread?: number | null; over_under?: number | null } = {}
				
				if (odds.spread !== null) {
					updateData.spread = odds.spread
				}
				
				if (odds.overUnder !== null) {
					updateData.over_under = odds.overUnder
				}

				// Update game with odds data if we have any
				if (Object.keys(updateData).length > 0) {
					const { error: updateError } = await supabase
						.from("games")
						.update(updateData)
						.eq("id", game.id)

					if (updateError) {
						console.error(`Error updating odds for game ${game.espn_id}:`, updateError)
					}
				}
			}

			// Small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 200))
		} catch (error) {
			console.error(`Error syncing odds for game ${game.espn_id}:`, error)
		}
	}
}

export interface UserPickData {
	user_id: string
	display_name: string
	picks: Array<{
		game_id: string
		picked_team: string
		confidence_points: number
	}>
	weekly_points: number
	weekly_rank: number
}

export interface GroupPicksResponse {
	games: Array<Game & {
		home_team_data: Team | null
		away_team_data: Team | null
	}>
	user_picks: UserPickData[]
	week: number
	season: string
}

export async function GET(request: NextRequest) {
	try {
		// Use service role key for group picks (public data, bypasses RLS)
		// This allows us to see all users' picks and display names
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			return handleAPIError(
				new Error("Missing Supabase configuration"),
				"fetch group picks",
				500
			)
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		})
		
		// Get query parameters
		const { searchParams } = new URL(request.url)
		const season = searchParams.get("season") || "2025"
		const week = searchParams.get("week")

		if (!week) {
			return handleAPIError(new Error("Week parameter required"), "fetch group picks", 400)
		}

		const weekNumber = parseInt(week)
		if (isNaN(weekNumber)) {
			return handleAPIError(new Error("Invalid week parameter"), "fetch group picks", 400)
		}

		// For current week, always sync games to get latest status (scheduled -> live -> final)
		// This ensures live games are properly marked as "live"
		const { espnAPI } = await import("@/lib/api/espn")
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()
		const isCurrentWeek = seasonInfo.currentWeek === weekNumber && seasonInfo.season === parseInt(season)
		
		if (isCurrentWeek) {
			// Force sync games for current week to get latest status
			// Bypass cache check since game statuses change in real-time
			try {
				const { espnAPI: espn } = await import("@/lib/api/espn")
				const { normalizeGames } = await import("@/lib/api/normalizers")
				const { dataSync } = await import("@/lib/api/sync")
				const { recalculateUserWeekScore } = await import("@/lib/utils/scoring")
				
				// Force fetch from ESPN (bypass cache)
				console.log(`🔄 Force syncing games for current week ${weekNumber} to get latest status`)
				const espnGames = await espn.getSchedule(parseInt(season), weekNumber)
				const games = normalizeGames(espnGames)
				
				// Sync to database to update game statuses (scheduled -> live -> final)
				// Use service role client to ensure updates work
				const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
				const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
				const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
				
				if (supabaseUrl && supabaseServiceKey) {
					const serviceSupabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
						auth: {
							autoRefreshToken: false,
							persistSession: false,
						},
					})
					
					// Track if any games have final status (to trigger score recalculation)
					let hasFinalGames = false
					
					// Update each game's status directly
					for (const game of games) {
						const { data: existing } = await serviceSupabase
							.from("games")
							.select("id, status")
							.eq("espn_id", game.espn_id)
							.single()
						
						if (existing) {
							// Check if game is final (for score recalculation)
							if (game.status === "final" && 
								game.home_score !== null && 
								game.away_score !== null) {
								hasFinalGames = true
							}
							
							// Update status, scores, and start_time
							await serviceSupabase
								.from("games")
								.update({
									status: game.status,
									home_score: game.home_score,
									away_score: game.away_score,
									start_time: game.start_time,
								})
								.eq("id", existing.id)
						}
					}
					
					// If any games are final, recalculate scores for all users
					// This ensures scores are always up-to-date when viewing current week
					if (hasFinalGames) {
						console.log(`📊 Recalculating scores for all users (week ${weekNumber})`)
						
						// Fetch all users
						const { data: allUsers, error: usersError } = await serviceSupabase
							.from("users")
							.select("id")
						
						if (!usersError && allUsers) {
							// Recalculate scores for each user
							for (const user of allUsers) {
								try {
									await recalculateUserWeekScore(
										serviceSupabase,
										user.id,
										weekNumber,
										season
									)
								} catch (error) {
									console.error(`Error recalculating score for user ${user.id}:`, error)
									// Continue with other users even if one fails
								}
							}
							console.log(`✓ Recalculated scores for ${allUsers.length} users`)
						}
					}
				} else {
					// Fallback to dataSync method
					await dataSync.syncGamesToDatabase(games)
				}
			} catch (error) {
				console.error("Error syncing games for current week (non-fatal):", error)
				// Continue even if sync fails
			}
		}

		// Fetch all games for this week first to check if week is complete
		let { data: games, error: gamesError } = await supabase
			.from("games")
			.select("*")
			.eq("season", season)
			.eq("week", weekNumber)
			.order("start_time", { ascending: true })

		if (gamesError) {
			return handleAPIError(gamesError, "fetch games")
		}

		// Check if week is complete (all games are final)
		const allGamesFinal = games && games.length > 0 && games.every(game => game.status === "final")
		
		// Check if any games are missing spread data
		const gamesMissingSpread = games && games.some(game => !game.spread && game.espn_id)
		
		// Sync odds if:
		// 1. Week is not complete (games might still be live or upcoming) - always sync
		// 2. Week is complete but games are missing spread data - sync to populate missing data
		if (!allGamesFinal || gamesMissingSpread) {
			// Sync odds to ensure we have spread data
			try {
				await syncGameOddsForWeek(supabase, parseInt(season), weekNumber)
				
				// Re-fetch games after syncing odds to get updated spread data
				const { data: updatedGames, error: updatedGamesError } = await supabase
					.from("games")
					.select("*")
					.eq("season", season)
					.eq("week", weekNumber)
					.order("start_time", { ascending: true })
				
				if (!updatedGamesError && updatedGames) {
					games = updatedGames
				}
			} catch (error) {
				console.error("Error syncing odds (non-fatal):", error)
				// Continue even if odds sync fails
			}
		}

		if (gamesError) {
			return handleAPIError(gamesError, "fetch games")
		}

		// Fetch all teams for enrichment
		const { data: teams, error: teamsError } = await supabase
			.from("teams")
			.select("*")
			.eq("active", true)

		if (teamsError) {
			console.error("Error fetching teams:", teamsError)
		}

		// Create team map
		const teamMap = new Map<string, Team>()
		teams?.forEach(team => {
			teamMap.set(team.abbreviation, team)
		})

		// Enrich games with team data
		const enrichedGames = (games || []).map(game => ({
			...game,
			home_team_data: teamMap.get(game.home_team) || null,
			away_team_data: teamMap.get(game.away_team) || null,
		}))

		// Fetch ALL users first (to include users without picks)
		const { data: allUsers, error: usersError } = await supabase
			.from("users")
			.select("id, display_name")
			.order("display_name", { ascending: true })

		if (usersError) {
			console.error("Error fetching users:", usersError)
			return handleAPIError(usersError, "fetch users")
		}

		// Fetch all picks for this week
		const gameIds = enrichedGames.map(g => g.id)
		const { data: picks, error: picksError } = await supabase
			.from("picks")
			.select(`
				*,
				users!inner(
					id,
					display_name
				)
			`)
			.in("game_id", gameIds.length > 0 ? gameIds : [])

		if (picksError) {
			return handleAPIError(picksError, "fetch picks")
		}

		// Fetch weekly scores for ranking
		const { data: weeklyScores, error: scoresError } = await supabase
			.from("scores")
			.select(`
				*,
				users!inner(
					id,
					display_name
				)
			`)
			.eq("season", season)
			.eq("week", weekNumber)
			.order("points", { ascending: false })

		if (scoresError) {
			console.error("Error fetching weekly scores:", scoresError)
		}

		// Build user picks map - start with ALL users
		const userPicksMap = new Map<string, {
			user_id: string
			display_name: string
			picks: Array<{
				game_id: string
				picked_team: string
				confidence_points: number
			}>
			weekly_points: number
			weekly_rank: number
		}>()

		// Initialize all users with empty picks
		allUsers?.forEach((user) => {
			userPicksMap.set(user.id, {
				user_id: user.id,
				display_name: user.display_name || "Unknown User",
				picks: [],
				weekly_points: 0,
				weekly_rank: 0,
			})
		})

		// Process picks - add picks to existing user entries
		picks?.forEach((pick: any) => {
			const userId = pick.user_id
			const existing = userPicksMap.get(userId)

			if (existing) {
				existing.picks.push({
					game_id: pick.game_id,
					picked_team: pick.picked_team,
					confidence_points: pick.confidence_points,
				})
			} else {
				// User not in allUsers list (shouldn't happen, but handle gracefully)
				userPicksMap.set(userId, {
					user_id: userId,
					display_name: pick.users?.display_name || "Unknown User",
					picks: [{
						game_id: pick.game_id,
						picked_team: pick.picked_team,
						confidence_points: pick.confidence_points,
					}],
					weekly_points: 0,
					weekly_rank: 0,
				})
			}
		})

		// Add weekly scores and rankings
		weeklyScores?.forEach((score, index) => {
			const userData = userPicksMap.get(score.user_id)
			if (userData) {
				userData.weekly_points = score.points
				userData.weekly_rank = index + 1
			}
		})

		// Convert to array and sort by weekly rank (or points if no rank)
		const userPicksArray = Array.from(userPicksMap.values())
			.sort((a, b) => {
				if (a.weekly_rank > 0 && b.weekly_rank > 0) {
					return a.weekly_rank - b.weekly_rank
				}
				return b.weekly_points - a.weekly_points
			})

		const responseData = {
			games: enrichedGames,
			user_picks: userPicksArray,
			week: weekNumber,
			season,
		}

		// Add caching headers for completed weeks
		// If all games are final, cache for 1 year (data won't change)
		// Otherwise, cache for 5 minutes (data might still be updating)
		const cacheControl = allGamesFinal 
			? 'public, max-age=31536000, immutable' 
			: 'public, max-age=300'

		return createSuccessResponse(responseData, {
			count: userPicksArray.length,
			type: "group_picks"
		}, {
			headers: {
				'Cache-Control': cacheControl
			}
		})

	} catch (error) {
		return handleAPIError(error, "fetch group picks")
	}
}

