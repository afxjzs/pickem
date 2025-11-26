// scripts/sync-odds.ts
// Script to fetch and update odds (spread and over/under) for games from ESPN API

import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import { espnAPI } from "../src/lib/api/espn"

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
 * Sync odds for games in a specific week
 */
async function syncWeekOdds(season: number, week: number): Promise<{
	updated: number
	errors: number
	notFound: number
}> {
	let updated = 0
	let errors = 0
	let notFound = 0

	try {
		console.log(`  Week ${week}...`)

		// Fetch games for this week
		const { data: games, error: gamesError } = await supabase
			.from("games")
			.select("id, espn_id")
			.eq("season", season.toString())
			.eq("week", week)

		if (gamesError) {
			console.error(`    ❌ Error fetching games:`, gamesError.message)
			errors++
			return { updated, errors, notFound }
		}

		if (!games || games.length === 0) {
			console.log(`    ⚠️  No games found for week ${week}`)
			return { updated, errors, notFound }
		}

		console.log(`    Found ${games.length} games, syncing odds...`)

		// Sync odds for each game
		for (const game of games) {
			if (!game.espn_id) {
				continue
			}

			try {
				// Fetch odds from ESPN
				const odds = await espnAPI.getGameOdds(game.espn_id)

				if (odds) {
					// Update game with odds data
					const updateData: { spread?: number | null; over_under?: number | null } = {}

					if (odds.spread !== null) {
						updateData.spread = odds.spread
					}

					if (odds.overUnder !== null) {
						updateData.over_under = odds.overUnder
					}

					// Only update if we have at least one value
					if (Object.keys(updateData).length > 0) {
						const { error: updateError } = await supabase
							.from("games")
							.update(updateData)
							.eq("id", game.id)

						if (updateError) {
							console.error(`    ❌ Error updating odds for game ${game.espn_id}:`, updateError.message)
							errors++
						} else {
							updated++
						}
					}
				} else {
					notFound++
				}

				// Small delay to avoid hitting rate limits
				await new Promise((resolve) => setTimeout(resolve, 200))
			} catch (error) {
				console.error(`    ❌ Error syncing odds for game ${game.espn_id}:`, error instanceof Error ? error.message : error)
				errors++
			}
		}

		console.log(`    ✓ Updated ${updated} games, ${notFound} without odds, ${errors} errors`)
	} catch (error) {
		console.error(`    ❌ Error syncing week ${week}:`, error instanceof Error ? error.message : error)
		errors++
	}

	return { updated, errors, notFound }
}

/**
 * Main function
 */
async function main() {
	console.log("🎲 Starting odds sync script...\n")

	try {
		// Get current season info
		console.log("📅 Getting current season info...")
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()
		const season = seasonInfo.season
		const currentWeek = seasonInfo.currentWeek

		console.log(`  ✓ Season: ${season}, Current Week: ${currentWeek}\n`)

		// Get command line arguments
		const args = process.argv.slice(2)
		let weeksToSync: number[] = []

		if (args.length > 0) {
			// If week(s) specified, sync those
			weeksToSync = args.map((arg) => parseInt(arg)).filter((w) => !isNaN(w) && w >= 1 && w <= 18)
			if (weeksToSync.length === 0) {
				console.error("❌ Invalid week numbers provided. Must be between 1-18.")
				process.exit(1)
			}
		} else {
			// Default: sync current week and next 2 weeks (odds change frequently)
			weeksToSync = [currentWeek, currentWeek + 1, currentWeek + 2].filter((w) => w <= 18)
		}

		console.log(`📊 Syncing odds for season ${season}, weeks: ${weeksToSync.join(", ")}...\n`)

		let totalUpdated = 0
		let totalErrors = 0
		let totalNotFound = 0

		for (const week of weeksToSync) {
			const result = await syncWeekOdds(season, week)
			totalUpdated += result.updated
			totalErrors += result.errors
			totalNotFound += result.notFound

			// Small delay between weeks
			if (week !== weeksToSync[weeksToSync.length - 1]) {
				await new Promise((resolve) => setTimeout(resolve, 500))
			}
		}

		console.log(`\n✅ Odds sync completed!`)
		console.log(`   Season: ${season}`)
		console.log(`   Weeks synced: ${weeksToSync.length}`)
		console.log(`   Games updated: ${totalUpdated}`)
		console.log(`   Games without odds: ${totalNotFound}`)
		console.log(`   Errors: ${totalErrors}`)
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

