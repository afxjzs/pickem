"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import type { Pick } from "@/lib/types/database"

interface PicksStatusCardProps {
	currentWeek: number
	season: string
}

export default function PicksStatusCard({
	currentWeek,
	season,
}: PicksStatusCardProps) {
	const { user } = useAuth()
	const [picks, setPicks] = useState<Pick[]>([])
	const [games, setGames] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!user) return

		const fetchData = async () => {
			try {
				setLoading(true)
				// Fetch games and picks in parallel
				const [gamesResponse, picksResponse] = await Promise.all([
					fetch(`/api/games?season=${season}&week=${currentWeek}`),
					fetch(`/api/picks?season=${season}&week=${currentWeek}`, {
						credentials: "include",
					}),
				])

				const gamesData = await gamesResponse.json()
				const picksData = await picksResponse.json()

				if (gamesData.success) {
					setGames(gamesData.data || [])
				}
				if (picksData.success) {
					setPicks(picksData.data || [])
				}
			} catch (error) {
				console.error("Error fetching picks status:", error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [user, currentWeek, season])

	if (loading) {
		return (
			<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
					<div className="h-6 bg-gray-200 rounded w-1/2"></div>
				</div>
			</div>
		)
	}

	// Filter out locked games (games that have started)
	const now = new Date()
	const lockTime = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes before now
	const availableGames = games.filter((game) => {
		const gameTime = new Date(game.start_time)
		return game.status === "scheduled" && gameTime > lockTime
	})

	// Count complete picks (has both team and confidence points)
	const completePicks = picks.filter(
		(pick) => pick.picked_team && pick.confidence_points > 0
	)

	const totalGames = availableGames.length
	const picksMade = completePicks.length
	const isComplete = totalGames > 0 && picksMade === totalGames
	const completionPercentage =
		totalGames > 0 ? Math.round((picksMade / totalGames) * 100) : 0

	return (
		<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
			<h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
				Week {currentWeek} Picks
			</h3>
			{totalGames === 0 ? (
				<div>
					<p className="text-sm text-gray-600 mb-3">
						All games for this week have started or completed.
					</p>
					<Link
						href={`/picks/${currentWeek}`}
						className="text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						View Picks →
					</Link>
				</div>
			) : isComplete ? (
				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-2 h-2 bg-green-500 rounded-full"></div>
						<p className="text-sm font-medium text-green-700">Picks Complete</p>
					</div>
					<p className="text-xs text-gray-600 mb-3">
						{picksMade} of {totalGames} games picked
					</p>
					<Link
						href={`/picks/${currentWeek}`}
						className="text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						View/Edit Picks →
					</Link>
				</div>
			) : (
				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
						<p className="text-sm font-medium text-yellow-700">
							You have not made your picks!
						</p>
					</div>
					<p className="text-xs text-gray-600 mb-3">
						{picksMade} of {totalGames} games picked ({completionPercentage}%)
					</p>
					<Link
						href="/picks/current"
						className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Make Picks →
					</Link>
				</div>
			)}
		</div>
	)
}

