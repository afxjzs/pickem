// src/app/api/sync/games/route.ts
// Background sync endpoint with intelligent checking
// Called by cron jobs and can be triggered async from main API routes

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { dataSync } from "@/lib/api/sync"
import { espnAPI } from "@/lib/api/espn"
import { normalizeGames } from "@/lib/api/normalizers"
import { setLastSyncTime, getLastSyncTime } from "@/lib/utils/sync-status"
import type { Game } from "@/lib/types/database"

interface SyncOptions {
	season?: string
	week?: number
	syncScores?: boolean
	syncSchedules?: boolean
	syncOdds?: boolean
}

/**
 * Check if there are active games (live or scheduled within 4 hours)
 */
async function hasActiveGames(
	supabase: any,
	season: string,
	week: number
): Promise<boolean> {
	const now = new Date()
	const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000)
	const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

	const { data, error } = await supabase
		.from("games")
		.select("id")
		.eq("season", season)
		.eq("week", week)
		.in("status", ["live", "scheduled"])
		.gte("start_time", fourHoursAgo.toISOString())
		.lte("start_time", fourHoursFromNow.toISOString())
		.limit(1)

	if (error) {
		console.error("Error checking for active games:", error)
		return false
	}

	return (data?.length || 0) > 0
}

/**
 * Check if any games are scheduled more than 12 days out
 */
async function hasGamesScheduledFarOut(
	supabase: any,
	season: string
): Promise<boolean> {
	const now = new Date()
	const twelveDaysFromNow = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000)

	const { data, error } = await supabase
		.from("games")
		.select("id")
		.eq("season", season)
		.eq("status", "scheduled")
		.gte("start_time", twelveDaysFromNow.toISOString())
		.limit(1)

	if (error) {
		console.error("Error checking for far-out games:", error)
		return false
	}

	return (data?.length || 0) > 0
}

/**
 * Check if week is complete (all games final with scores)
 */
async function isWeekComplete(
	supabase: any,
	season: string,
	week: number
): Promise<boolean> {
	const { data: games, error } = await supabase
		.from("games")
		.select("status, home_score, away_score")
		.eq("season", season)
		.eq("week", week)

	if (error || !games || games.length === 0) {
		return false
	}

	return games.every(
		(game: { status: string; home_score: number | null; away_score: number | null }) =>
			game.status === "final" &&
			game.home_score !== null &&
			game.away_score !== null
	)
}

/**
 * Sync games from ESPN
 */
async function syncGamesFromESPN(
	season: number,
	week: number,
	supabase: any
): Promise<void> {
	try {
		console.log(`🔄 Syncing games from ESPN for season ${season}, week ${week}`)
		const espnGames = await espnAPI.getSchedule(season, week)
		const normalizedGames = normalizeGames(espnGames)

		// Sync to database
		await dataSync.syncGamesToDatabase(normalizedGames)

		// Update sync timestamp
		await setLastSyncTime(season.toString(), week)

		console.log(`✅ Synced ${normalizedGames.length} games for week ${week}`)
	} catch (error) {
		console.error(`❌ Error syncing games for week ${week}:`, error)
		throw error
	}
}

/**
 * Sync odds for games
 */
async function syncOddsForWeek(
	season: number,
	week: number,
	supabase: any
): Promise<void> {
		try {
			// Check last odds sync time (don't sync more than once per hour)
			const lastOddsSyncKey = `last_odds_sync_${season}_${week}`
			const { data: lastOddsData } = await supabase
				.from("app_config")
				.select("value")
				.eq("key", lastOddsSyncKey)
				.single()
			
			const lastOddsSync = lastOddsData?.value ? new Date(lastOddsData.value) : null
			const now = new Date()

			if (lastOddsSync) {
				const timeSinceSync = now.getTime() - lastOddsSync.getTime()
				const oneHour = 60 * 60 * 1000
				if (timeSinceSync < oneHour) {
					console.log(
						`⏭️  Skipping odds sync for week ${week} - synced ${Math.round(
							timeSinceSync / 60000
						)} minutes ago`
					)
					return
				}
			}

		console.log(`🔄 Syncing odds for season ${season}, week ${week}`)
		await dataSync.syncGameOdds(season, week)

		// Update odds sync timestamp
		const timestamp = new Date().toISOString()
		const { error } = await supabase.from("app_config").upsert(
			{
				key: lastOddsSyncKey,
				value: timestamp,
				description: `Last odds sync time for season ${season}, week ${week}`,
			},
			{ onConflict: "key" }
		)

		if (error) {
			console.error(`Error setting odds sync timestamp:`, error)
		}
	} catch (error) {
		console.error(`❌ Error syncing odds for week ${week}:`, error)
		// Don't throw - odds sync failure shouldn't block the response
	}
}

export async function POST(request: NextRequest) {
	try {
		// Get Supabase service role client
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

		if (!supabaseUrl || !supabaseServiceKey) {
			return Response.json(
				{ error: "Missing Supabase configuration" },
				{ status: 500 }
			)
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
			db: {
				schema: "pickem",
			},
		})

		// Parse request body for sync options
		let options: SyncOptions = {}
		try {
			const body = await request.json()
			options = body
		} catch {
			// No body provided, use defaults
		}

		const season = options.season || "2025"
		const seasonNum = parseInt(season)
		const week = options.week

		// If no week specified, get current week
		if (!week) {
			const seasonInfo = await espnAPI.getCurrentSeasonInfo()
			const currentWeek = seasonInfo.currentWeek
			options.week = currentWeek
		}

		const weekNum = options.week!
		const syncScores = options.syncScores !== false // Default to true
		const syncSchedules = options.syncSchedules !== false // Default to true
		const syncOdds = options.syncOdds !== false // Default to true

		// Check if week is complete
		const weekComplete = await isWeekComplete(supabase, season, weekNum)

		if (weekComplete) {
			console.log(
				`⏭️  Week ${weekNum} is complete - skipping sync`
			)
			return Response.json({
				success: true,
				message: `Week ${weekNum} is complete, no sync needed`,
				synced: false,
			})
		}

		// Determine if we need to sync games
		// Sync if schedules are requested OR if scores are requested and there are active games
		let shouldSyncGames = false
		if (syncSchedules) {
			shouldSyncGames = true
		} else if (syncScores) {
			const hasActive = await hasActiveGames(supabase, season, weekNum)
			if (hasActive) {
				shouldSyncGames = true
			} else {
				console.log(
					`⏭️  No active games for week ${weekNum} - skipping score sync`
				)
			}
		}

		// Sync games from ESPN if needed (this updates both schedules and scores)
		if (shouldSyncGames) {
			await syncGamesFromESPN(seasonNum, weekNum, supabase)
		}

		// Sync odds if requested
		if (syncOdds) {
			await syncOddsForWeek(seasonNum, weekNum, supabase)
		}

		return Response.json({
			success: true,
			message: `Sync completed for week ${weekNum}`,
			synced: true,
		})
	} catch (error) {
		console.error("Error in background sync:", error)
		return Response.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		)
	}
}

