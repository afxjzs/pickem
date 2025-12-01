// src/app/api/cron/sync-scores/route.ts
// Cron job: Runs once per day (1 AM)
// Syncs scores, schedules, and odds for current week

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { espnAPI } from "@/lib/api/espn"

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

		// Check if there are active games
		const hasActive = await hasActiveGames(supabase, season, currentWeek)

		if (!hasActive) {
			console.log(
				`⏭️  [CRON] No active games for week ${currentWeek} - skipping sync`
			)
			return Response.json({
				success: true,
				message: `No active games for week ${currentWeek}`,
				synced: false,
			})
		}

		// Trigger background sync for scores
		const syncUrl = new URL("/api/sync/games", request.url)
		const syncResponse = await fetch(syncUrl.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				season,
				week: currentWeek,
				syncScores: true,
				syncSchedules: true, // Also sync schedules to get latest scores
				syncOdds: true, // Include odds sync in this job
			}),
		})

		if (!syncResponse.ok) {
			const error = await syncResponse.text()
			throw new Error(`Sync failed: ${error}`)
		}

		const result = await syncResponse.json()

		console.log(
			`✅ [CRON] Score sync completed for week ${currentWeek}:`,
			result
		)

		return Response.json({
			success: true,
			message: `Score sync completed for week ${currentWeek}`,
			...result,
		})
	} catch (error) {
		console.error("❌ [CRON] Error in score sync:", error)
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

