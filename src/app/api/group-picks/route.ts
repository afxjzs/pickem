// src/app/api/group-picks/route.ts
// API endpoint for group picks view (all users' picks for a specific week)

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSuccessResponse, handleAPIError } from "@/lib/api/utils"
import { espnAPI } from "@/lib/api/espn"
import type { Game, Pick, Team } from "@/lib/types/database"
import { calculateWeeklyScore } from "@/lib/utils/scoring"
import { createHash } from "crypto"

/**
 * Batch recalculate scores for all users for a specific week
 * Much faster than sequential recalculation
 */
async function batchRecalculateScores(
	supabase: ReturnType<typeof createClient>,
	week: number,
	season: string,
	games: Game[]
): Promise<void> {
	// Fetch all picks for this week in one query
	const gameIds = games.map(g => g.id)
	if (gameIds.length === 0) {
		return
	}

	const { data: allPicks, error: picksError } = await supabase
		.from("picks")
		.select("*")
		.in("game_id", gameIds)

	if (picksError) {
		console.error("Error fetching picks for batch recalculation:", picksError)
		return
	}

	if (!allPicks || allPicks.length === 0) {
		return
	}

	// Fetch all users
	const { data: allUsers, error: usersError } = await supabase
		.from("users")
		.select("id")

	if (usersError || !allUsers) {
		console.error("Error fetching users for batch recalculation:", usersError)
		return
	}

	// Group picks by user_id
	const picksByUser = new Map<string, Pick[]>()
	for (const pick of allPicks as unknown as Pick[]) {
		const userId = String(pick.user_id)
		if (!picksByUser.has(userId)) {
			picksByUser.set(userId, [])
		}
		picksByUser.get(userId)!.push(pick)
	}

	// Calculate scores for all users in parallel (in-memory)
	const scoresToUpsert: Array<{
		user_id: string
		week: number
		season: string
		points: number
		correct_picks: number
		total_picks: number
	}> = []

	for (const user of allUsers) {
		const userId = String(user.id)
		const userPicks = picksByUser.get(userId) || []
		const scoreData = calculateWeeklyScore(userPicks, games)
		
		scoresToUpsert.push({
			user_id: userId,
			week,
			season,
			points: scoreData.points,
			correct_picks: scoreData.correct_picks,
			total_picks: scoreData.total_picks,
		})
	}

	// Batch upsert all scores in one operation
	if (scoresToUpsert.length > 0) {
		const { error: upsertError } = await supabase
			.from("scores")
			.upsert(scoresToUpsert, {
				onConflict: "user_id,week,season",
			})

		if (upsertError) {
			console.error("Error batch upserting scores:", upsertError)
		} else {
			console.log(`✓ Batch recalculated scores for ${scoresToUpsert.length} users`)
		}
	}
}

/**
 * Sync game odds (spread and over/under) for a specific week
 * Uses service role client to bypass RLS
 * Optimized with parallel requests
 */
async function syncGameOddsForWeek(
	supabase: ReturnType<typeof createClient> | any,
	season: number,
	week: number
): Promise<void> {
	// Fetch all games for this week that have espn_id
	const { data: games, error: gamesError } = await supabase
		.from("games")
		.select("id, espn_id, spread, status")
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

	// Sync odds only for games that are not completed (scheduled, live, in progress)
	// Completed games (status "final") don't need odds updates
	const gamesToSync = games.filter(g => g.espn_id && g.status !== "final")
	
	if (gamesToSync.length === 0) {
		return // No games to sync
	}

	console.log(`Syncing odds for ${gamesToSync.length} games...`)

	// Sync odds in parallel with rate limiting (batch of 5 at a time)
	const batchSize = 5
	const updates: Array<{ gameId: string; spread?: number | null; over_under?: number | null }> = []

	for (let i = 0; i < gamesToSync.length; i += batchSize) {
		const batch = gamesToSync.slice(i, i + batchSize)
		
		// Fetch odds for batch in parallel
		const oddsPromises = batch.map(async (game) => {
			const espnId = game.espn_id as string | undefined
			if (!espnId) {
				return null
			}

			try {
				const odds = await espnAPI.getGameOdds(espnId)
				if (odds) {
					return {
						gameId: String(game.id),
						spread: odds.spread,
						overUnder: odds.overUnder,
					}
				}
			} catch (error) {
				console.error(`Error syncing odds for game ${espnId}:`, error)
			}
			return null
		})

		const results = await Promise.all(oddsPromises)
		
		// Collect updates
		results.forEach((result) => {
			if (result) {
				updates.push({
					gameId: String(result.gameId),
					spread: result.spread,
					over_under: result.overUnder,
				})
			}
		})

		// Small delay between batches to avoid rate limiting
		if (i + batchSize < gamesToSync.length) {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
	}

	// Batch update all games in parallel
	if (updates.length > 0) {
		const updatePromises = updates.map(async (update) => {
			const updateData: { spread?: number | null; over_under?: number | null } = {}
			
			if (update.spread !== null && update.spread !== undefined) {
				updateData.spread = update.spread
			}
			
			if (update.over_under !== null && update.over_under !== undefined) {
				updateData.over_under = update.over_under
			}

			if (Object.keys(updateData).length > 0) {
				const { error } = await supabase
					.from("games")
					.update(updateData)
					.eq("id", update.gameId)

				if (error) {
					console.error(`Error updating odds for game ${update.gameId}:`, error)
				}
			}
		})

		await Promise.all(updatePromises)
		console.log(`✓ Updated odds for ${updates.length} games`)
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

/**
 * Generate ETag from response data
 */
function generateETag(data: GroupPicksResponse): string {
	const dataString = JSON.stringify(data)
	return createHash('md5').update(dataString).digest('hex')
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
			db: {
				schema: 'pickem'
			}
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

		// Check if this is the current week
		const { espnAPI } = await import("@/lib/api/espn")
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()
		const isCurrentWeek = seasonInfo.currentWeek === weekNumber && seasonInfo.season === parseInt(season)
		
		// Get database state to check completeness
		const { data: dbGames } = await supabase
			.from("games")
			.select("id, espn_id, status, start_time, home_score, away_score")
			.eq("season", season)
			.eq("week", weekNumber)
		
		// Check if week is complete (all games final with scores)
		const isWeekComplete = dbGames && dbGames.length > 0 && dbGames.every(game => 
			game.status === "final" && 
			game.home_score !== null && 
			game.away_score !== null
		)
		
		// Check for missing data
		const hasMissingData = dbGames && dbGames.length > 0 && dbGames.some(game => {
			// Game is missing scores
			if (game.home_score === null || game.away_score === null) {
				return true
			}
			// Game should be final but isn't
			if (game.status !== "final") {
				const now = new Date()
				const gameStartTime = new Date(game.start_time)
				const hoursSinceStart = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60)
				if (hoursSinceStart > 4) {
					return true
				}
			}
			return false
		})
		
		// SIMPLE RULE: 
		// - Always sync current week (until noon Tuesday ET when it becomes next week)
		// - Only sync past weeks if they're incomplete (missing data)
		// - Don't sync past weeks that are complete
		const shouldSync = isCurrentWeek || (hasMissingData && !isWeekComplete)
		
		// Log the decision
		console.log(`[GROUP-PICKS] Week ${weekNumber} sync decision:`, {
			isCurrentWeek,
			isWeekComplete,
			hasMissingData,
			shouldSync,
			dbGamesCount: dbGames?.length || 0,
			currentWeekFromAPI: seasonInfo.currentWeek
		})
		
		if (shouldSync) {
			try {
				const { espnAPI: espn } = await import("@/lib/api/espn")
				const { normalizeGames } = await import("@/lib/api/normalizers")
				
				// Force fetch from ESPN (bypass cache)
				const syncReasons = []
				if (isCurrentWeek) syncReasons.push('current week')
				if (hasMissingData) syncReasons.push('missing data detected')
				if (!isWeekComplete) syncReasons.push('week incomplete')
				
				console.log(`🔄 SYNCING week ${weekNumber} - REASONS: ${syncReasons.join(', ')}`)
				const espnGames = await espn.getSchedule(parseInt(season), weekNumber)
				const normalizedGames = normalizeGames(espnGames)
				
				// Batch update all games in one operation
				const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
				const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
				const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
				
				if (supabaseUrl && supabaseServiceKey) {
					const serviceSupabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
						auth: {
							autoRefreshToken: false,
							persistSession: false,
						},
						db: {
							schema: 'pickem'
						}
					})
					
					// Fetch existing games to get IDs
					const { data: existingGames } = await serviceSupabase
						.from("games")
						.select("id, espn_id, status")
						.eq("season", season)
						.eq("week", weekNumber)

					if (existingGames) {
						const gameMap = new Map<string, string>() // espn_id -> id
						existingGames.forEach((g: any) => {
							if (g.espn_id) {
								gameMap.set(g.espn_id, g.id)
							}
						})

						// Prepare batch updates - MUST include ALL required fields
						const updates = normalizedGames
							.filter(game => gameMap.has(game.espn_id))
							.map(game => ({
								id: gameMap.get(game.espn_id)!,
								season: season, // CRITICAL: Must include season
								week: weekNumber, // CRITICAL: Must include week
								home_team: game.home_team, // CRITICAL: Must include home_team
								away_team: game.away_team, // CRITICAL: Must include away_team
								status: game.status,
								home_score: game.home_score,
								away_score: game.away_score,
								start_time: game.start_time,
							}))

						// Check if any games are final (for score recalculation)
						const hasFinalGames = normalizedGames.some(
							g => g.status === "final" && 
							g.home_score !== null && 
							g.away_score !== null
						)

						// Batch update all games
						if (updates.length > 0) {
							// Use upsert with conflict resolution for batch update
							const { error: updateError } = await serviceSupabase
								.from("games")
								.upsert(updates, {
									onConflict: "id",
								})

							if (updateError) {
								console.error(`❌ Error batch updating games:`, updateError)
							} else {
								console.log(`✅ Batch updated ${updates.length} games with latest ESPN data`)
								
								// Verify completeness after sync if week should be complete
								if (!isCurrentWeek && isWeekComplete) {
									const { data: verifyGames } = await serviceSupabase
										.from("games")
										.select("id, status, home_score, away_score")
										.eq("season", season)
										.eq("week", weekNumber)
									
									if (verifyGames) {
										const incomplete = verifyGames.filter(game => 
											game.status !== "final" || 
											game.home_score === null || 
											game.away_score === null
										)
										
										if (incomplete.length === 0) {
											console.log(`✅ Week ${weekNumber} is now COMPLETE - all games final with scores`)
										} else {
											console.error(`❌ Week ${weekNumber} still has ${incomplete.length} incomplete games after sync!`)
											console.error(`Incomplete games:`, incomplete.map(g => ({ id: g.id, status: g.status, scores: `${g.home_score}-${g.away_score}` })))
										}
									}
								}
							}
						}

						// If any games are final with scores, batch recalculate scores for all users
						if (hasFinalGames) {
							const { data: updatedGames } = await serviceSupabase
								.from("games")
								.select("*")
								.eq("season", season)
								.eq("week", weekNumber)

							if (updatedGames) {
								console.log(`🔄 Recalculating scores for week ${weekNumber}`)
								await batchRecalculateScores(
									serviceSupabase as any,
									weekNumber,
									season,
									updatedGames as Game[]
								)
								console.log(`✅ Score recalculation complete for week ${weekNumber}`)
							}
						}
						
						// Set last sync time after successful sync (use service role client)
						const timestamp = new Date().toISOString()
						const key = `last_games_sync_${season}_${weekNumber}`
						const { error: timestampError } = await serviceSupabase.from("app_config").upsert(
							{
								key,
								value: timestamp,
								description: `Last sync time for season ${season}, week ${weekNumber}`,
							},
							{ onConflict: "key" }
						)
						
						if (timestampError) {
							console.error(`Error setting sync timestamp:`, timestampError)
						} else {
							console.log(`✅ Sync timestamp updated for week ${weekNumber}`)
						}
					} else {
						console.warn(`⚠️  No existing games found in database for week ${weekNumber}`)
					}
				}
			} catch (error) {
				console.error(`❌ Error syncing games for week ${weekNumber}:`, error)
				// Continue even if sync fails - but log it clearly
			}
		} else {
			// Only skip if we're CERTAIN everything is complete
			const allComplete = dbGames && dbGames.length > 0 && dbGames.every(game => 
				game.status === "final" && 
				game.home_score !== null && 
				game.away_score !== null
			)
			
			if (allComplete) {
				console.log(`⏭️  Skipping sync for week ${weekNumber} - all games are final with scores`)
			} else {
				// This shouldn't happen, but if it does, log it
				console.warn(`⚠️  Skipping sync but data may be incomplete for week ${weekNumber}`)
			}
		}

		// Fetch all data in parallel for better performance
		const [gamesResult, teamsResult, usersResult] = await Promise.all([
			supabase
				.from("games")
				.select("*")
				.eq("season", season)
				.eq("week", weekNumber)
				.order("start_time", { ascending: true })
				.order("home_team", { ascending: true }),
			supabase
				.from("teams")
				.select("*")
				.eq("active", true),
			supabase
				.from("users")
				.select("id, display_name")
				.order("display_name", { ascending: true }),
		])

		const { data: games, error: gamesError } = gamesResult
		const { data: teams, error: teamsError } = teamsResult
		const { data: allUsers, error: usersError } = usersResult

		if (gamesError) {
			return handleAPIError(gamesError, "fetch games")
		}

		if (usersError) {
			console.error("Error fetching users:", usersError)
			return handleAPIError(usersError, "fetch users")
		}

		// Check if week is complete (all games are final)
		const allGamesFinal = games && games.length > 0 && games.every(game => game.status === "final")
		
		// For current week, always sync odds (they can change)
		// For past weeks, skip odds syncing (too slow, data should already be there)
		if (isCurrentWeek && games && games.some(game => game.espn_id)) {
			// Sync odds in background (don't wait for it)
			// Use service role client to ensure we can update games
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
			const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
			
			if (supabaseUrl && supabaseServiceKey) {
				const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
				const serviceSupabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
					auth: {
						autoRefreshToken: false,
						persistSession: false,
					},
					db: {
						schema: 'pickem'
					}
				})
				
				syncGameOddsForWeek(serviceSupabase, parseInt(season), weekNumber).catch(error => {
					console.error("Error syncing odds (non-fatal):", error)
				})
			}
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

		// Fetch picks and scores in parallel
		const gameIds = enrichedGames.map(g => g.id)
		const [picksResult, scoresResult] = await Promise.all([
			gameIds.length > 0
				? supabase
					.from("picks")
					.select(`
						*,
						users!inner(
							id,
							display_name
						)
					`)
					.in("game_id", gameIds)
				: Promise.resolve({ data: [], error: null }),
			supabase
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
				.order("points", { ascending: false }),
		])

		const { data: picks, error: picksError } = picksResult
		const { data: weeklyScores, error: scoresError } = scoresResult

		if (picksError) {
			return handleAPIError(picksError, "fetch picks")
		}

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

		const responseData: GroupPicksResponse = {
			games: enrichedGames,
			user_picks: userPicksArray,
			week: weekNumber,
			season,
		}

		// Generate ETag for cache validation
		const etag = generateETag(responseData)
		const requestETag = request.headers.get("if-none-match")

		// If ETag matches, return 304 Not Modified
		if (requestETag === `"${etag}"`) {
			return new Response(null, {
				status: 304,
				headers: {
					'ETag': `"${etag}"`,
					'Cache-Control': allGamesFinal 
						? 'public, max-age=31536000, immutable' 
						: 'public, max-age=300',
				},
			})
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
				'Cache-Control': cacheControl,
				'ETag': `"${etag}"`,
			},
		})

	} catch (error) {
		return handleAPIError(error, "fetch group picks")
	}
}
