// scripts/populate-picks.ts
// Script to retroactively create picks for a user for all weeks up to and including the current week

import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import type { Game, Pick } from "../src/lib/types/database"
import { calculateWeeklyScore } from "../src/lib/utils/scoring"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("Missing required environment variables:")
	console.error("  NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
	console.error("  SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey)
	process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
	db: {
		schema: 'pickem'
	}
})

// Helper function to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array]
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}
	return shuffled
}

// Helper function to get random boolean
function randomBoolean(): boolean {
	return Math.random() < 0.5
}

// Helper function to check if a game is locked
function isGameLocked(game: Game, lockOffsetMinutes: number = 5): boolean {
	const isLockedByStatus = game.status === "live" || game.status === "final"
	
	// Check time-based lock (5 minutes before start)
	const gameTime = new Date(game.start_time)
	const lockTime = new Date(gameTime.getTime() - (lockOffsetMinutes * 60 * 1000))
	const isLockedByTime = new Date() >= lockTime
	
	return isLockedByStatus || isLockedByTime
}

/**
 * Get current week and season from database
 */
async function getCurrentWeek(): Promise<{ season: number; currentWeek: number }> {
	const now = new Date()

	// Get all games for this season, ordered by week and start_time
	// Try 2025 first, then 2024
	let season = "2025"
	const { data: allGames, error } = await supabase
		.from("games")
		.select("week, start_time, status, season")
		.eq("season", season)
		.order("week", { ascending: true })
		.order("start_time", { ascending: true })

	if (error || !allGames || allGames.length === 0) {
		// Try 2024
		season = "2024"
		const { data: games2024, error: error2024 } = await supabase
			.from("games")
			.select("week, start_time, status, season")
			.eq("season", season)
			.order("week", { ascending: true })
			.order("start_time", { ascending: true })
		
		if (error2024 || !games2024 || games2024.length === 0) {
			console.error("Error fetching games from database:", error || error2024)
			return { season: 2025, currentWeek: 1 }
		}
		
		// Use 2024 games
		const upcomingGame = games2024.find((game) => {
			const gameTime = new Date(game.start_time)
			return (
				game.status === "scheduled" ||
				game.status === "live" ||
				(game.status !== "final" && gameTime > now)
			)
		})

		if (upcomingGame) {
			return {
				season: parseInt(season),
				currentWeek: upcomingGame.week,
			}
		}

		const latestWeek = Math.max(...games2024.map((g) => g.week))
		return {
			season: parseInt(season),
			currentWeek: latestWeek,
		}
	}

	// Find the first game that hasn't started yet (or is currently live)
	const upcomingGame = allGames.find((game) => {
		const gameTime = new Date(game.start_time)
		return (
			game.status === "scheduled" ||
			game.status === "live" ||
			(game.status !== "final" && gameTime > now)
		)
	})

	if (upcomingGame) {
		return {
			season: parseInt(season),
			currentWeek: upcomingGame.week,
		}
	}

	// All games have finished. Find the latest week
	const latestWeek = Math.max(...allGames.map((g) => g.week))
	return {
		season: parseInt(season),
		currentWeek: latestWeek,
	}
}

/**
 * Recalculate scores for all users for a specific week
 * This ensures standings are accurate after picks are created
 */
async function batchRecalculateScores(
	week: number,
	season: string,
	games: Game[]
): Promise<void> {
	// Fetch all picks for this week in one query
	const gameIds = games.map((g) => g.id)
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
			console.log(
				`  ✓ Recalculated scores for ${scoresToUpsert.length} users`
			)
		}
	}
}

/**
 * Invalidate group picks cache for a specific week
 * This forces the group picks view to refresh on next fetch
 */
async function invalidateGroupPicksCache(week: number, season: string): Promise<void> {
	try {
		const key = `last_games_sync_${season}_${week}`
		const { error } = await supabase
			.from("app_config")
			.delete()
			.eq("key", key)

		if (error) {
			console.error(`Error invalidating group picks cache for week ${week}:`, error)
		} else {
			console.log(`  ✓ Invalidated group picks cache for Week ${week}`)
		}
	} catch (error) {
		console.error(`Error invalidating group picks cache for week ${week}:`, error)
	}
}

/**
 * Create picks for a user for all weeks up to and including the current week
 */
async function populatePicks(userEmail: string) {
	console.log(`🎯 Populating picks for user: ${userEmail}\n`)

	try {
		// Find user by email
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("id, display_name, email")
			.eq("email", userEmail)
			.single()

		if (userError || !user) {
			throw new Error(`User not found: ${userEmail}`)
		}

		console.log(`Found user: ${user.display_name || user.email} (${user.id})\n`)

		// Get current week and season
		const { season, currentWeek } = await getCurrentWeek()
		console.log(`Current season: ${season}, Current week: ${currentWeek}\n`)

		let totalPicksCreated = 0
		let totalPicksSkipped = 0

		// Process each week from 1 to current week
		for (let week = 1; week <= currentWeek; week++) {
			console.log(`Processing Week ${week}...`)

			// Fetch all games for this week
			const { data: games, error: gamesError } = await supabase
				.from("games")
				.select("*")
				.eq("season", season.toString())
				.eq("week", week)
				.order("start_time", { ascending: true })

			if (gamesError) {
				console.error(`  ⚠️  Error fetching games for week ${week}: ${gamesError.message}`)
				continue
			}

			if (!games || games.length === 0) {
				console.log(`  ⚠️  No games found for Week ${week}`)
				continue
			}

			// For testing/mocking purposes, we allow picks for locked games
			// Filter out locked games only for informational purposes
			const lockedGames = games.filter((game) => isGameLocked(game))
			const availableGames = games

			if (availableGames.length === 0) {
				console.log(`  ⚠️  No games found for Week ${week}`)
				continue
			}

			if (lockedGames.length > 0) {
				console.log(
					`  ℹ️  Note: ${lockedGames.length} game(s) are locked (already started), but creating picks anyway for testing/mocking`
				)
			}

			// Check existing picks for this user and week
			const gameIds = availableGames.map((g) => g.id)
			const { data: existingPicks } = await supabase
				.from("picks")
				.select("game_id")
				.eq("user_id", user.id)
				.in("game_id", gameIds)

			const existingGameIds = new Set(existingPicks?.map((p) => p.game_id) || [])

			// Filter out games that already have picks
			const gamesNeedingPicks = availableGames.filter(
				(g) => !existingGameIds.has(g.id)
			)

			if (gamesNeedingPicks.length === 0) {
				console.log(`  ✓ All picks already exist for Week ${week} (${availableGames.length} games)`)
				totalPicksSkipped += availableGames.length
				// Still recalculate scores and invalidate cache to ensure everything is up to date
				await batchRecalculateScores(week, season.toString(), games)
				await invalidateGroupPicksCache(week, season.toString())
				continue
			}

			// Shuffle confidence points 1-N for this week (where N = number of games needing picks, max 16)
			const numGames = gamesNeedingPicks.length
			const maxConfidence = Math.min(numGames, 16)
			const allConfidencePoints = shuffleArray(
				Array.from({ length: maxConfidence }, (_, i) => i + 1)
			)

			// Create picks for each game
			const picks: Pick[] = []
			for (let j = 0; j < gamesNeedingPicks.length; j++) {
				const game = gamesNeedingPicks[j]
				// Use modulo to handle cases where there are more than 16 games
				const confidencePoint = allConfidencePoints[j % allConfidencePoints.length]

				// Randomly pick home or away team
				const pickedTeam = randomBoolean() ? game.home_team : game.away_team

				picks.push({
					user_id: user.id,
					game_id: game.id,
					picked_team: pickedTeam,
					confidence_points: confidencePoint,
				} as Pick)
			}

			// Insert new picks
			const { error: insertError } = await supabase.from("picks").insert(
				picks.map((p) => ({
					user_id: p.user_id,
					game_id: p.game_id,
					picked_team: p.picked_team,
					confidence_points: p.confidence_points,
				}))
			)

			if (insertError) {
				throw new Error(
					`Failed to insert picks for Week ${week}: ${insertError.message}`
				)
			}

			console.log(
				`  ✓ Created ${picks.length} picks for Week ${week} (${existingGameIds.size} already existed)`
			)
			totalPicksCreated += picks.length
			totalPicksSkipped += existingGameIds.size

			// Recalculate scores for all users for this week (affects standings)
			await batchRecalculateScores(week, season.toString(), games)

			// Invalidate group picks cache for this week
			await invalidateGroupPicksCache(week, season.toString())
		}

		console.log(`\n✅ Successfully populated picks!`)
		console.log(`\nSummary:`)
		console.log(`  - User: ${user.display_name || user.email}`)
		console.log(`  - Season: ${season}`)
		console.log(`  - Weeks processed: 1-${currentWeek}`)
		console.log(`  - Picks created: ${totalPicksCreated}`)
		console.log(`  - Picks skipped (already existed): ${totalPicksSkipped}`)
	} catch (error) {
		console.error("\n❌ Error:", error)
		if (error instanceof Error) {
			console.error("   Message:", error.message)
		}
		process.exit(1)
	}
}

/**
 * Main function
 */
async function main() {
	const args = process.argv.slice(2)

	if (args.length < 1) {
		console.error("Usage: tsx scripts/populate-picks.ts <user-email>")
		console.error("Example: tsx scripts/populate-picks.ts web@afx.cc")
		process.exit(1)
	}

	const userEmail = args[0]

	if (!userEmail || !userEmail.includes("@")) {
		console.error("Error: Invalid email address")
		process.exit(1)
	}

	await populatePicks(userEmail)
}

main()

