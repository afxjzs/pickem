// scripts/add-week-picks.ts
// Script to add picks for all fake users for a specific week

import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import type { Game, Pick } from "../src/lib/types/database"

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

/**
 * Create picks for all fake users for a specific week
 */
async function addWeekPicks(season: string, week: number) {
	console.log(`🎯 Adding picks for Season ${season}, Week ${week}...\n`)

	try {
		// Fetch all fake users (test users)
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("id, display_name, email")
			.like("email", "testuser%@pickem.test")
			.order("email", { ascending: true })

		if (usersError) {
			throw new Error(`Failed to fetch users: ${usersError.message}`)
		}

		if (!users || users.length === 0) {
			console.log("⚠️  No test users found. Run seed-leaderboard.ts first to create test users.")
			return
		}

		console.log(`Found ${users.length} test users\n`)

		// Fetch all games for this week
		const { data: games, error: gamesError } = await supabase
			.from("games")
			.select("*")
			.eq("season", season)
			.eq("week", week)
			.order("start_time", { ascending: true })

		if (gamesError) {
			throw new Error(`Failed to fetch games: ${gamesError.message}`)
		}

		if (!games || games.length === 0) {
			console.log(`⚠️  No games found for Season ${season}, Week ${week}`)
			return
		}

		console.log(`Found ${games.length} games for Week ${week}\n`)

		// Process each user
		for (let i = 0; i < users.length; i++) {
			const user = users[i]
			console.log(`Processing user ${i + 1}/${users.length}: ${user.display_name || user.email}`)

			// Shuffle confidence points 1-N for this week (where N = number of games, max 16)
			const numGames = games.length
			const maxConfidence = Math.min(numGames, 16)
			const allConfidencePoints = shuffleArray(
				Array.from({ length: maxConfidence }, (_, i) => i + 1)
			)

			// Create picks for each game
			const picks: Pick[] = []
			for (let j = 0; j < games.length; j++) {
				const game = games[j]
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

			// Check existing picks for this user and week
			const gameIds = picks.map(p => p.game_id)
			const { data: existingPicks } = await supabase
				.from("picks")
				.select("game_id")
				.eq("user_id", user.id)
				.in("game_id", gameIds)

			const existingGameIds = new Set(existingPicks?.map(p => p.game_id) || [])
			
			// Filter out picks that already exist
			const newPicks = picks.filter(p => !existingGameIds.has(p.game_id))

			if (newPicks.length === 0) {
				console.log(`  ✓ All picks already exist (${picks.length} total)`)
				continue
			}

			// Insert new picks
			const { error: insertError } = await supabase.from("picks").insert(
				newPicks.map((p) => ({
					user_id: p.user_id,
					game_id: p.game_id,
					picked_team: p.picked_team,
					confidence_points: p.confidence_points,
				}))
			)

			if (insertError) {
				throw new Error(`Failed to insert picks for ${user.display_name}: ${insertError.message}`)
			}

			console.log(`  ✓ Created ${newPicks.length} new picks (${picks.length} total)`)
		}

		console.log(`\n✅ Successfully added picks for Week ${week}!`)
		console.log(`\nSummary:`)
		console.log(`  - Users processed: ${users.length}`)
		console.log(`  - Games processed: ${games.length}`)
		console.log(`  - Total picks: ${users.length * games.length}`)
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
	
	if (args.length < 2) {
		console.error("Usage: tsx scripts/add-week-picks.ts <season> <week>")
		console.error("Example: tsx scripts/add-week-picks.ts 2025 12")
		process.exit(1)
	}

	const season = args[0]
	const week = parseInt(args[1], 10)

	if (isNaN(week) || week < 1 || week > 18) {
		console.error("Error: Week must be a number between 1 and 18")
		process.exit(1)
	}

	await addWeekPicks(season, week)
}

main()




