// src/app/api/cron/sync-schedules/route.ts
// Cron job: Runs weekly
// Checks if any games are scheduled >12 days out
// Only syncs schedules if needed

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { espnAPI } from "@/lib/api/espn"

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

		// Get current season
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()
		const season = seasonInfo.season.toString()

		// Check if there are games scheduled >12 days out
		const hasFarOutGames = await hasGamesScheduledFarOut(supabase, season)

		if (!hasFarOutGames) {
			console.log(
				`⏭️  [CRON] No games scheduled >12 days out - skipping schedule sync`
			)
			return Response.json({
				success: true,
				message: "No far-out games found, skipping schedule sync",
				synced: false,
			})
		}

		// Sync schedules for all weeks (1-18)
		console.log(`🔄 [CRON] Syncing schedules for season ${season}`)
		let syncedWeeks = 0
		const errors: string[] = []

		for (let week = 1; week <= 18; week++) {
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
						syncSchedules: true,
						syncOdds: false,
					}),
				})

				if (syncResponse.ok) {
					syncedWeeks++
				} else {
					const error = await syncResponse.text()
					errors.push(`Week ${week}: ${error}`)
				}

				// Small delay between weeks to avoid rate limiting
				if (week < 18) {
					await new Promise((resolve) => setTimeout(resolve, 500))
				}
			} catch (error) {
				errors.push(
					`Week ${week}: ${error instanceof Error ? error.message : "Unknown error"}`
				)
			}
		}

		console.log(
			`✅ [CRON] Schedule sync completed: ${syncedWeeks}/18 weeks synced`
		)

		return Response.json({
			success: true,
			message: `Schedule sync completed: ${syncedWeeks}/18 weeks synced`,
			syncedWeeks,
			errors: errors.length > 0 ? errors : undefined,
		})
	} catch (error) {
		console.error("❌ [CRON] Error in schedule sync:", error)
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

