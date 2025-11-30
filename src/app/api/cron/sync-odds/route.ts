// src/app/api/cron/sync-odds/route.ts
// Cron job: Runs hourly
// Checks last sync time (don't sync more than once per hour)
// Only syncs current week and upcoming games

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { espnAPI } from "@/lib/api/espn"
import { getLastSyncTime } from "@/lib/utils/sync-status"

/**
 * Get last odds sync time for a week
 */
async function getLastOddsSyncTime(
	supabase: ReturnType<typeof createClient>,
	season: string,
	week: number
): Promise<Date | null> {
	const key = `last_odds_sync_${season}_${week}`
	const { data, error } = await supabase
		.from("app_config")
		.select("value")
		.eq("key", key)
		.single()

	if (error || !data) {
		return null
	}

	try {
		return new Date(data.value)
	} catch {
		return null
	}
}

export async function GET(request: NextRequest) {
	try {
		// Verify this is a cron request
		// Vercel cron jobs can be protected with CRON_SECRET
		// For now, allow if CRON_SECRET is not set (development) or if it matches
		const cronSecret = process.env.CRON_SECRET
		if (cronSecret) {
			const authHeader = request.headers.get("authorization")
			if (authHeader !== `Bearer ${cronSecret}`) {
				return Response.json({ error: "Unauthorized" }, { status: 401 })
			}
		}

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

		// Get current season and week
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()
		const season = seasonInfo.season.toString()
		const currentWeek = seasonInfo.currentWeek

		// Check last odds sync time for current week
		const lastOddsSync = await getLastOddsSyncTime(
			supabase,
			season,
			currentWeek
		)
		const now = new Date()

		if (lastOddsSync) {
			const timeSinceSync = now.getTime() - lastOddsSync.getTime()
			const oneHour = 60 * 60 * 1000
			if (timeSinceSync < oneHour) {
				console.log(
					`⏭️  [CRON] Odds for week ${currentWeek} synced ${Math.round(
						timeSinceSync / 60000
					)} minutes ago - skipping`
				)
				return Response.json({
					success: true,
					message: `Odds synced recently, skipping`,
					synced: false,
				})
			}
		}

		// Sync odds for current week and next week (upcoming games)
		console.log(`🔄 [CRON] Syncing odds for week ${currentWeek}`)
		const weeksToSync = [currentWeek]
		if (currentWeek < 18) {
			weeksToSync.push(currentWeek + 1)
		}

		let syncedWeeks = 0
		const errors: string[] = []

		for (const week of weeksToSync) {
			try {
				const syncUrl = new URL("/api/sync/games", request.url)
				const syncResponse = await fetch(syncUrl.toString(), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						season,
						week,
						syncScores: false,
						syncSchedules: false,
						syncOdds: true,
					}),
				})

				if (syncResponse.ok) {
					syncedWeeks++
				} else {
					const error = await syncResponse.text()
					errors.push(`Week ${week}: ${error}`)
				}
			} catch (error) {
				errors.push(
					`Week ${week}: ${error instanceof Error ? error.message : "Unknown error"}`
				)
			}
		}

		console.log(
			`✅ [CRON] Odds sync completed: ${syncedWeeks}/${weeksToSync.length} weeks synced`
		)

		return Response.json({
			success: true,
			message: `Odds sync completed: ${syncedWeeks}/${weeksToSync.length} weeks synced`,
			syncedWeeks,
			errors: errors.length > 0 ? errors : undefined,
		})
	} catch (error) {
		console.error("❌ [CRON] Error in odds sync:", error)
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

