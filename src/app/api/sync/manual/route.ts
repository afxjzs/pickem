// src/app/api/sync/manual/route.ts
// Manual sync endpoint - can be triggered from UI
// Syncs scores, schedules, and odds for a specific week

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { espnAPI } from "@/lib/api/espn"

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

		// Parse request body
		let season: string | undefined
		let week: number | undefined
		try {
			const body = await request.json()
			season = body.season
			week = body.week
		} catch {
			// No body provided, use defaults
		}

		// Get current season and week if not provided
		if (!season || !week) {
			const seasonInfo = await espnAPI.getCurrentSeasonInfo()
			season = seasonInfo.season.toString()
			week = seasonInfo.currentWeek
		}

		// Trigger background sync
		const syncUrl = new URL("/api/sync/games", request.url)
		const syncResponse = await fetch(syncUrl.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				season,
				week,
				syncScores: true,
				syncSchedules: true,
				syncOdds: true,
			}),
		})

		if (!syncResponse.ok) {
			const error = await syncResponse.text()
			throw new Error(`Sync failed: ${error}`)
		}

		const result = await syncResponse.json()

		return Response.json({
			success: true,
			message: `Manual sync initiated for week ${week}`,
			...result,
		})
	} catch (error) {
		console.error("Error in manual sync:", error)
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

