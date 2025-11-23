import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSuccessResponse, handleAPIError } from "@/lib/api/utils"
import { Score, WeekStanding, SeasonStanding } from "@/lib/types/database"

export async function GET(request: NextRequest) {
	try {
		// Use service role key for scores (public leaderboard data, bypasses RLS)
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
		
		if (!supabaseUrl || !supabaseServiceKey) {
			return handleAPIError(
				new Error("Missing Supabase configuration"),
				"fetch scores",
				500
			)
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		})
		
		// Get query parameters
		const { searchParams } = new URL(request.url)
		const season = searchParams.get("season") || "2025"
		const week = searchParams.get("week")
		const type = searchParams.get("type") || "weekly" // "weekly" or "season"

		if (type === "weekly" && !week) {
			return handleAPIError(new Error("Week parameter required for weekly standings"), "fetch scores", 400)
		}

		if (type === "weekly") {
			const weekNumber = parseInt(week!)
			if (isNaN(weekNumber)) {
				return handleAPIError(new Error("Invalid week parameter"), "fetch scores", 400)
			}

			// Get weekly standings
			const { data: weeklyScores, error: weeklyError } = await supabase
				.from("scores")
				.select(`
					*,
					users!inner(
						id,
						display_name
					)
				`)
				.eq("season", season)
				.eq("week", weekNumber)
				.order("points", { ascending: false })

			if (weeklyError) {
				console.error("Database error:", weeklyError)
				return handleAPIError(new Error("Failed to fetch weekly scores"), "fetch scores")
			}

			// Calculate rankings
			const weeklyStandings: WeekStanding[] = (weeklyScores || []).map((score, index) => ({
				user_id: score.user_id,
				display_name: score.users?.display_name || "Unknown User",
				points: score.points,
				correct_picks: score.correct_picks,
				total_picks: score.total_picks,
				rank: index + 1
			}))

			return createSuccessResponse(weeklyStandings, {
				count: weeklyStandings.length,
				season,
				week: weekNumber,
				type: "weekly"
			})

		} else {
			// Get season standings - include only users who have completed onboarding (have username)
			// First fetch all users
			const { data: allUsersRaw, error: usersError } = await supabase
				.from("users")
				.select("id, display_name, username")
				.order("display_name", { ascending: true })

			if (usersError) {
				console.error("Database error fetching users:", usersError)
				return handleAPIError(new Error("Failed to fetch users"), "fetch scores")
			}

			// Filter to only users with usernames (completed onboarding)
			const allUsers = allUsersRaw?.filter(user => user.username && user.username.trim().length > 0) || []

			// Then fetch all scores for the season
			const { data: seasonScores, error: seasonError } = await supabase
				.from("scores")
				.select("*")
				.eq("season", season)

			if (seasonError) {
				console.error("Database error:", seasonError)
				return handleAPIError(new Error("Failed to fetch season scores"), "fetch scores")
			}

			// Aggregate scores by user - start with ALL users
			const userScores = new Map<string, {
				user_id: string
				display_name: string
				total_points: number
				weeks_played: number
				total_correct_picks: number
				total_picks: number
			}>()

			// Initialize all users with 0 scores
			allUsers?.forEach((user) => {
				userScores.set(user.id, {
					user_id: user.id,
					display_name: user.display_name || "Unknown User",
					total_points: 0,
					weeks_played: 0,
					total_correct_picks: 0,
					total_picks: 0
				})
			})

			// Process scores and update user data
			seasonScores?.forEach(score => {
				const existing = userScores.get(score.user_id)
				if (existing) {
					existing.total_points += score.points
					existing.weeks_played += 1
					existing.total_correct_picks += score.correct_picks
					existing.total_picks += score.total_picks
				}
			})

			// Convert to array and sort by total points
			const seasonStandings: SeasonStanding[] = Array.from(userScores.values())
				.map(userScore => {
					const correctPicksPercentage = userScore.total_picks > 0
						? Math.round((userScore.total_correct_picks / userScore.total_picks) * 10000) / 100 // Round to 2 decimal places
						: 0
					return {
						user_id: userScore.user_id,
						display_name: userScore.display_name,
						total_points: userScore.total_points,
						weeks_played: userScore.weeks_played,
						average_points: userScore.weeks_played > 0 ? userScore.total_points / userScore.weeks_played : 0,
						total_picks: userScore.total_picks,
						correct_picks: userScore.total_correct_picks,
						correct_picks_percentage: correctPicksPercentage,
						rank: 0 // Will be set below
					}
				})
				.sort((a, b) => b.total_points - a.total_points)

			// Set rankings
			seasonStandings.forEach((standing, index) => {
				standing.rank = index + 1
			})

			return createSuccessResponse(seasonStandings, {
				count: seasonStandings.length,
				season,
				type: "season"
			})
		}

	} catch (error) {
		return handleAPIError(error, "fetch scores")
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient()
		
		// Get authenticated user (admin only for score management)
		const { data: { user }, error: authError } = await supabase.auth.getUser()
		if (authError || !user) {
			return handleAPIError(new Error("Unauthorized"), "manage scores", 401)
		}

		// Check if user is admin
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single()

		if (profileError || !userProfile?.is_admin) {
			return handleAPIError(new Error("Admin access required"), "manage scores", 403)
		}

		// Parse request body
		const body = await request.json()
		const { action, userId, week, season, points, correctPicks, totalPicks } = body

		if (action === "update") {
			// Update existing score
			const { data: updatedScore, error: updateError } = await supabase
				.from("scores")
				.upsert({
					user_id: userId,
					week,
					season,
					points: points || 0,
					correct_picks: correctPicks || 0,
					total_picks: totalPicks || 0
				})
				.select()
				.single()

			if (updateError) {
				console.error("Error updating score:", updateError)
				return handleAPIError(new Error("Failed to update score"), "manage scores")
			}

			return createSuccessResponse(updatedScore, {
				message: "Score updated successfully"
			})

		} else if (action === "delete") {
			// Delete score
			const { error: deleteError } = await supabase
				.from("scores")
				.delete()
				.eq("user_id", userId)
				.eq("week", week)
				.eq("season", season)

			if (deleteError) {
				console.error("Error deleting score:", deleteError)
				return handleAPIError(new Error("Failed to delete score"), "manage scores")
			}

			return createSuccessResponse(null, {
				message: "Score deleted successfully"
			})

		} else {
			return handleAPIError(new Error("Invalid action"), "manage scores", 400)
		}

	} catch (error) {
		return handleAPIError(error, "manage scores")
	}
}
