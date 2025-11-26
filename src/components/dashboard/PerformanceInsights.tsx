"use client"

import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"

interface PerformanceInsightsProps {
	weeklyData: WeeklyPerformanceUser[]
	currentUserId?: string
}

export default function PerformanceInsights({
	weeklyData,
	currentUserId,
}: PerformanceInsightsProps) {
	if (!weeklyData || !currentUserId) {
		return null
	}

	const userWeekly = weeklyData.find((u) => u.user_id === currentUserId)
	if (!userWeekly) {
		return null
	}

	// Calculate consistency (standard deviation of weekly scores)
	const weeklyScores = Object.values(userWeekly.week_scores).filter((s) => s > 0)
	const mean =
		weeklyScores.reduce((sum, score) => sum + score, 0) / weeklyScores.length
	const variance =
		weeklyScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
		weeklyScores.length
	const stdDev = Math.sqrt(variance)

	// Calculate average of all players for comparison
	// Calculate average_points for each user from their week_scores
	const allPlayersAvg =
		weeklyData.reduce((sum, u) => {
			const weeksWithScores = Object.values(u.week_scores).filter((s) => s > 0).length
			const avg = weeksWithScores > 0 ? u.total_points / weeksWithScores : 0
			return sum + avg
		}, 0) / weeklyData.length

	// Calculate current user's average
	const weeksWithScores = Object.values(userWeekly.week_scores).filter((s) => s > 0).length
	const userAvg = weeksWithScores > 0 ? userWeekly.total_points / weeksWithScores : 0

	// Count week wins
	const weekWins = Object.keys(userWeekly.week_scores).filter((week) => {
		const weekNum = parseInt(week)
		const userScore = userWeekly.week_scores[weekNum]
		if (userScore === 0) return false

		// Check if this user had the highest score for this week
		const maxScore = Math.max(
			...weeklyData.map((u) => u.week_scores[weekNum] || 0)
		)
		return userScore === maxScore && userScore > 0
	}).length

	const consistencyScore = stdDev < 5 ? "Very Consistent" : stdDev < 10 ? "Consistent" : "Variable"
	const vsAverage = userAvg > allPlayersAvg ? "above" : "below"

	return (
		<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				Performance Insights
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="p-3 bg-blue-50 rounded-lg">
					<div className="text-sm text-gray-600 mb-1">Consistency</div>
					<div className="text-lg font-semibold text-gray-900">
						{consistencyScore}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						Std dev: {stdDev.toFixed(1)} pts
					</div>
				</div>

				<div className="p-3 bg-green-50 rounded-lg">
					<div className="text-sm text-gray-600 mb-1">Week Wins</div>
					<div className="text-lg font-semibold text-gray-900">{weekWins}</div>
					<div className="text-xs text-gray-500 mt-1">
						Weeks with highest score
					</div>
				</div>

				<div className="p-3 bg-purple-50 rounded-lg">
					<div className="text-sm text-gray-600 mb-1">vs Average</div>
					<div className="text-lg font-semibold text-gray-900 capitalize">
						{vsAverage}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{Math.abs(userAvg - allPlayersAvg).toFixed(1)} pts
						{vsAverage === "above" ? " better" : " worse"} than average
					</div>
				</div>
			</div>
		</div>
	)
}

