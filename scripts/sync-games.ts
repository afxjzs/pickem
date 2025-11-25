// scripts/sync-games.ts
// Script to fetch and populate games table from ESPN API for all weeks

import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import { espnAPI } from "../src/lib/api/espn"
import { normalizeTeams, normalizeGames } from "../src/lib/api/normalizers"
import type { NormalizedGame } from "../src/lib/api/normalizers"
import type { Game } from "../src/lib/types/database"

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

/**
 * Identify SNF and MNF games based on game times
 */
function identifySNFandMNF(games: NormalizedGame[]): NormalizedGame[] {
	// Group games by day (ET)
	const gamesByDay = new Map<number, NormalizedGame[]>()

	games.forEach((game) => {
		const gameDate = new Date(game.start_time)
		// Convert to ET (UTC-5 for standard time, UTC-4 for daylight)
		// For simplicity, we'll use UTC-5 (standard time)
		let etHour = gameDate.getUTCHours() - 5
		let etDay = gameDate.getUTCDay()

		// Handle day boundary crossing
		if (etHour < 0) {
			etHour += 24
			etDay = (etDay - 1 + 7) % 7
		}

		// Create a key for the day
		const dayKey = etDay
		if (!gamesByDay.has(dayKey)) {
			gamesByDay.set(dayKey, [])
		}
		gamesByDay.get(dayKey)!.push(game)
	})

	// Find the last game on Sunday (day 0) and Monday (day 1)
	const sundayGames = gamesByDay.get(0) || []
	const mondayGames = gamesByDay.get(1) || []

	// Sort by time and mark the last game of each day
	if (sundayGames.length > 0) {
		sundayGames.sort(
			(a, b) =>
				new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
		)
		sundayGames[sundayGames.length - 1].is_snf = true
	}

	if (mondayGames.length > 0) {
		mondayGames.sort(
			(a, b) =>
				new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
		)
		mondayGames[mondayGames.length - 1].is_mnf = true
	}

	return games
}

/**
 * Sync teams data to database
 */
async function syncTeamsToDatabase(): Promise<void> {
	console.log("📋 Syncing teams...")
	const espnTeams = await espnAPI.getTeams()
	const teams = normalizeTeams(espnTeams)

	for (const team of teams) {
		const { error } = await supabase
			.from("teams")
			.upsert(team, { onConflict: "espn_id" })

		if (error) {
			console.error(`  ❌ Error syncing team ${team.abbreviation}:`, error.message)
		}
	}

	console.log(`  ✓ Synced ${teams.length} teams\n`)
}

/**
 * Sync games data to database
 */
async function syncGamesToDatabase(games: NormalizedGame[]): Promise<{
	inserted: number
	updated: number
	errors: number
}> {
	let inserted = 0
	let updated = 0
	let errors = 0

	for (const game of games) {
		// First, check if game exists by espn_id
		const { data: existing } = await supabase
			.from("games")
			.select("id")
			.eq("espn_id", game.espn_id)
			.single()

		if (existing) {
			// Update existing game
			const { error } = await supabase
				.from("games")
				.update(game)
				.eq("id", existing.id)

			if (error) {
				console.error(`  ❌ Error updating game ${game.espn_id}:`, error.message)
				errors++
			} else {
				updated++
			}
		} else {
			// Insert new game
			const { error } = await supabase.from("games").insert(game)

			if (error) {
				console.error(`  ❌ Error inserting game ${game.espn_id}:`, error.message)
				errors++
			} else {
				inserted++
			}
		}
	}

	return { inserted, updated, errors }
}

/**
 * Sync games for a specific week
 */
async function syncWeek(season: number, week: number): Promise<number> {
	try {
		console.log(`  Week ${week}...`)
		const espnGames = await espnAPI.getSchedule(season, week)
		
		if (espnGames.length === 0) {
			console.log(`    ⚠️  No games found for week ${week}`)
			return 0
		}

		const normalizedGames = normalizeGames(espnGames)
		const gamesWithSNFMNF = identifySNFandMNF(normalizedGames)

		const result = await syncGamesToDatabase(gamesWithSNFMNF)
		
		console.log(`    ✓ ${gamesWithSNFMNF.length} games (${result.inserted} new, ${result.updated} updated)`)
		
		return gamesWithSNFMNF.length
	} catch (error) {
		console.error(`    ❌ Error syncing week ${week}:`, error instanceof Error ? error.message : error)
		return 0
	}
}

/**
 * Main function
 */
async function main() {
	console.log("🚀 Starting game sync script...\n")

	try {
		// Step 1: Sync teams first
		await syncTeamsToDatabase()

		// Step 2: Get current season info
		console.log("📅 Getting current season info...")
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()
		const season = seasonInfo.season
		const currentWeek = seasonInfo.currentWeek

		console.log(`  ✓ Season: ${season}, Current Week: ${currentWeek}\n`)

		// Step 3: Sync games for all regular season weeks (1-18)
		// NFL regular season is 18 weeks, so we sync all weeks regardless of current week
		const regularSeasonWeeks = 18
		console.log(`📊 Syncing games for season ${season} (weeks 1-${regularSeasonWeeks})...\n`)

		let totalGames = 0
		const weeksToSync = Array.from({ length: regularSeasonWeeks }, (_, i) => i + 1)

		for (const week of weeksToSync) {
			const gameCount = await syncWeek(season, week)
			totalGames += gameCount

			// Small delay to avoid rate limiting (always add delay except for last week)
			if (week < regularSeasonWeeks) {
				await new Promise((resolve) => setTimeout(resolve, 500))
			}
		}

		console.log(`\n✅ Sync completed!`)
		console.log(`   Season: ${season}`)
		console.log(`   Weeks synced: ${weeksToSync.length}`)
		console.log(`   Total games: ${totalGames}`)

		// Show summary of game statuses
		const { data: gameStats } = await supabase
			.from("games")
			.select("status")
			.eq("season", season.toString())

		if (gameStats) {
			const statusCounts = gameStats.reduce((acc, game) => {
				acc[game.status] = (acc[game.status] || 0) + 1
				return acc
			}, {} as Record<string, number>)

			console.log(`\n📈 Game status summary:`)
			Object.entries(statusCounts).forEach(([status, count]) => {
				console.log(`   ${status}: ${count}`)
			})
		}
	} catch (error) {
		console.error("\n❌ Error:", error)
		if (error instanceof Error) {
			console.error("   Message:", error.message)
		}
		process.exit(1)
	}
}

// Run the script
main()

