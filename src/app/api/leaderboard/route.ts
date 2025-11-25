// src/app/api/leaderboard/route.ts
// API endpoint for weekly performance leaderboard data

import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSuccessResponse, handleAPIError } from "@/lib/api/utils"

export interface WeeklyPerformanceUser {
	user_id: string
	display_name: string
	week_scores: Record<number, number> // week number -> points
	total_points: number
	rank: number
}

export async function GET(request: NextRequest) {
	try {
		// Use service role key for leaderboard (public data, bypasses RLS)
		// This allows us to see all users' scores and display names
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			return handleAPIError(
				new Error("Missing Supabase configuration"),
				"fetch leaderboard",
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

		// Fetch users who have completed onboarding (have username) - to include users without scores
		const { data: allUsersRaw, error: usersError } = await supabase
			.from("users")
			.select("id, display_name, username")
			.order("display_name", { ascending: true })

		if (usersError) {
			console.error("Database error fetching users:", usersError)
			return handleAPIError(new Error("Failed to fetch users"), "fetch leaderboard")
		}

		// Filter to only users with usernames (completed onboarding)
		const allUsers = allUsersRaw?.filter(user => user.username && user.username.trim().length > 0) || []

		// Fetch all scores for the season
		const { data: allScores, error: scoresError } = await supabase
			.from("scores")
			.select("*")
			.eq("season", season)
			.order("points", { ascending: false })

		if (scoresError) {
			console.error("Database error fetching scores:", scoresError)
			return handleAPIError(new Error("Failed to fetch scores"), "fetch leaderboard")
		}

		// Build weekly performance data structure - start with ALL users
		const userPerformance = new Map<string, {
			user_id: string
			display_name: string
			week_scores: Record<number, number>
			total_points: number
		}>()

		// Initialize week_scores for all weeks (1-18)
		const allWeeks = Array.from({ length: 18 }, (_, i) => i + 1)

		// Initialize all users with 0 scores
		allUsers?.forEach((user) => {
			const weekScores: Record<number, number> = {}
			allWeeks.forEach(week => {
				weekScores[week] = 0 // Initialize all weeks to 0
			})

			userPerformance.set(user.id, {
				user_id: user.id,
				display_name: user.display_name || "Unknown User",
				week_scores: weekScores,
				total_points: 0,
			})
		})

		// Process all scores and update user performance
		allScores?.forEach((score) => {
			const userId = score.user_id
			const existing = userPerformance.get(userId)

			if (existing) {
				existing.week_scores[score.week] = score.points
				existing.total_points += score.points
			}
		})

		// Convert to array and sort by total_points
		const performanceArray: WeeklyPerformanceUser[] = Array.from(userPerformance.values())
			.map(user => ({
				...user,
				rank: 0 // Will be set below
			}))
			.sort((a, b) => b.total_points - a.total_points)

		// Set rankings
		performanceArray.forEach((user, index) => {
			user.rank = index + 1
		})

		// Calculate week winners (highest score per week)
		const weekWinners = new Map<number, number>() // week -> highest points
		performanceArray.forEach(user => {
			allWeeks.forEach(week => {
				const weekScore = user.week_scores[week] || 0
				const currentWinner = weekWinners.get(week) || 0
				if (weekScore > currentWinner) {
					weekWinners.set(week, weekScore)
				}
			})
		})

		return createSuccessResponse({
			users: performanceArray,
			week_winners: Object.fromEntries(weekWinners),
			season,
		}, {
			count: performanceArray.length,
			type: "weekly_performance"
		})

	} catch (error) {
		return handleAPIError(error, "fetch leaderboard")
	}
}

