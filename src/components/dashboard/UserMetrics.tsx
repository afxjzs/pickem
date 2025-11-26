"use client"

import type { SeasonStanding } from "@/lib/types/database"
import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"

interface UserMetricsProps {
	userStats: SeasonStanding | null
	weeklyData: WeeklyPerformanceUser[] | null
	currentUserId?: string
}

export default function UserMetrics({
	userStats,
	weeklyData,
	currentUserId,
}: UserMetricsProps) {
	if (!userStats) {
		return null
	}

	// Calculate additional metrics from weekly data
	let bestWeek = { week: 0, points: 0 }
	let worstWeek = { week: 0, points: Infinity }
	let currentStreak = 0
	let rankTrend: "up" | "down" | "same" | null = null

	if (weeklyData && currentUserId) {
		const userWeekly = weeklyData.find((u) => u.user_id === currentUserId)
		if (userWeekly) {
			// Find best and worst weeks
			Object.entries(userWeekly.week_scores).forEach(([week, points]) => {
				const weekNum = parseInt(week)
				if (points > bestWeek.points) {
					bestWeek = { week: weekNum, points }
				}
				if (points < worstWeek.points && points > 0) {
					worstWeek = { week: weekNum, points }
				}
			})

			// Calculate current streak (consecutive weeks with picks)
			const weeks = Object.keys(userWeekly.week_scores)
				.map(Number)
				.sort((a, b) => b - a) // Sort descending
			for (const week of weeks) {
				if (userWeekly.week_scores[week] > 0) {
					currentStreak++
				} else {
					break
				}
			}

			// Calculate rank trend (compare current rank to last week's rank)
			if (weeklyData.length > 1) {
				const sortedByTotal = [...weeklyData].sort(
					(a, b) => b.total_points - a.total_points
				)
				const currentRank = sortedByTotal.findIndex(
					(u) => u.user_id === currentUserId
				)

				// Calculate what rank would be without last week's points
				const lastWeek = Math.max(...Object.keys(userWeekly.week_scores).map(Number))
				const pointsWithoutLastWeek =
					userWeekly.total_points - (userWeekly.week_scores[lastWeek] || 0)

				const previousRank = sortedByTotal.findIndex((u) => {
					const uLastWeek = Math.max(...Object.keys(u.week_scores).map(Number))
					const uPointsWithoutLastWeek =
						u.total_points - (u.week_scores[uLastWeek] || 0)
					return (
						u.user_id === currentUserId ||
						uPointsWithoutLastWeek > pointsWithoutLastWeek
					)
				})

				if (currentRank < previousRank) {
					rankTrend = "up"
				} else if (currentRank > previousRank) {
					rankTrend = "down"
				} else {
					rankTrend = "same"
				}
			}
		}
	}

	return (
		<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
			<h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
				Your Stats
			</h2>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
				{/* Overall Rank */}
				<div className="text-center p-4 bg-blue-50 rounded-lg">
					<div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
						#{userStats.rank}
					</div>
					<div className="text-sm md:text-base text-gray-700 font-medium">
						Overall Rank
					</div>
					{rankTrend && (
						<div className="text-xs text-gray-500 mt-1">
							{rankTrend === "up" && "↑ Trending up"}
							{rankTrend === "down" && "↓ Trending down"}
							{rankTrend === "same" && "→ Holding steady"}
						</div>
					)}
				</div>

				{/* Total Points */}
				<div className="text-center p-4 bg-purple-50 rounded-lg">
					<div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
						{userStats.total_points}
					</div>
					<div className="text-sm md:text-base text-gray-700 font-medium">
						Total Points
					</div>
					<div className="text-xs text-gray-500 mt-1">Season total</div>
				</div>

				{/* Correct Picks */}
				<div className="text-center p-4 bg-green-50 rounded-lg">
					<div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
						{userStats.correct_picks}/{userStats.total_picks}
					</div>
					<div className="text-sm md:text-base text-gray-700 font-medium">
						Correct Picks
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{userStats.correct_picks_percentage.toFixed(1)}% accuracy
					</div>
				</div>

				{/* Average Points */}
				<div className="text-center p-4 bg-orange-50 rounded-lg">
					<div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
						{userStats.average_points.toFixed(1)}
					</div>
					<div className="text-sm md:text-base text-gray-700 font-medium">
						Avg Points/Week
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{userStats.weeks_played} weeks played
					</div>
				</div>

				{/* Best Week */}
				{bestWeek.points > 0 && (
					<div className="text-center p-4 bg-emerald-50 rounded-lg">
						<div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">
							{bestWeek.points}
						</div>
						<div className="text-sm md:text-base text-gray-700 font-medium">
							Best Week
						</div>
						<div className="text-xs text-gray-500 mt-1">Week {bestWeek.week}</div>
					</div>
				)}

				{/* Worst Week */}
				{worstWeek.points < Infinity && worstWeek.points > 0 && (
					<div className="text-center p-4 bg-red-50 rounded-lg">
						<div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
							{worstWeek.points}
						</div>
						<div className="text-sm md:text-base text-gray-700 font-medium">
							Worst Week
						</div>
						<div className="text-xs text-gray-500 mt-1">Week {worstWeek.week}</div>
					</div>
				)}

				{/* Current Streak */}
				{currentStreak > 0 && (
					<div className="text-center p-4 bg-yellow-50 rounded-lg">
						<div className="text-3xl md:text-4xl font-bold text-yellow-600 mb-2">
							{currentStreak}
						</div>
						<div className="text-sm md:text-base text-gray-700 font-medium">
							Week Streak
						</div>
						<div className="text-xs text-gray-500 mt-1">
							Consecutive weeks with picks
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

