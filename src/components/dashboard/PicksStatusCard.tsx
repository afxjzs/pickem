"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import type { Pick } from "@/lib/types/database"
import type { Game } from "@/lib/types/database"
import { isPickCorrect } from "@/lib/utils/scoring"

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
	const [games, setGames] = useState<Game[]>([])
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

	// Create a set of available game IDs for quick lookup
	const availableGameIds = new Set(availableGames.map((game) => game.id))

	// Count complete picks (has both team and confidence points) for ALL games in the week
	const allCompletePicks = picks.filter(
		(pick) => pick.picked_team && pick.confidence_points > 0
	)

	// Count complete picks ONLY for available games (to determine if picks are complete)
	const availableCompletePicks = picks.filter(
		(pick) => pick.picked_team && pick.confidence_points > 0 && availableGameIds.has(pick.game_id)
	)

	// Total games for the week (all games)
	const totalGamesForWeek = games.length
	// Total picks made for the week (all complete picks)
	const totalPicksMade = allCompletePicks.length
	// Available games count
	const availableGamesCount = availableGames.length
	// Picks made for available games
	const picksForAvailable = availableCompletePicks.length
	// Check if all available games have picks
	const isComplete = availableGamesCount > 0 && picksForAvailable === availableGamesCount

	// Calculate results summary for completed games
	// Create a map of game_id to game for quick lookup
	const gameMap = new Map<string, Game>()
	games.forEach((game) => {
		gameMap.set(game.id, game)
	})

	// Create a map of game_id to pick for quick lookup
	const pickMap = new Map<string, Pick>()
	allCompletePicks.forEach((pick) => {
		pickMap.set(pick.game_id, pick)
	})

	let correctPicks = 0
	let incorrectPicks = 0
	let pendingPicks = 0

	games.forEach((game) => {
		// Only count games that are final (completed)
		const isGameFinal =
			game.status === "final" &&
			game.home_score !== null &&
			game.home_score !== undefined &&
			game.away_score !== null &&
			game.away_score !== undefined

		if (isGameFinal) {
			const pick = pickMap.get(game.id)
			if (pick) {
				const correct = isPickCorrect(pick, game)
				if (correct === true) {
					correctPicks++
				} else if (correct === false) {
					incorrectPicks++
				}
			} else {
				// No pick = incorrect
				incorrectPicks++
			}
		} else {
			// Game not final yet - count as pending if there's a pick
			const pick = pickMap.get(game.id)
			if (pick) {
				pendingPicks++
			}
		}
	})

	return (
		<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
			<h3 className="text-sm md:text-base font-galindo text-[#265387] mb-2">
				Week {currentWeek} Picks
			</h3>
			{availableGamesCount === 0 ? (
				<div>
					<p className="text-sm text-gray-600 mb-3">
						All games for this week have started or completed.
					</p>
					<p className="text-xs text-gray-600 mb-3">
						{totalPicksMade} of {totalGamesForWeek} games picked
					</p>
					{/* Results Summary */}
					{(correctPicks > 0 || incorrectPicks > 0) && (
						<div className="text-xs text-gray-600 mb-3 space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-green-600">✓</span>
								<span>{correctPicks} correct</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-red-600">✗</span>
								<span>{incorrectPicks} incorrect</span>
							</div>
						</div>
					)}
					<Link
						href={`/picks/${currentWeek}`}
						className="text-sm text-[#4580BC] hover:text-[#265387] font-medium transition-colors"
					>
						View Picks →
					</Link>
				</div>
			) : isComplete ? (
				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
						<p className="text-sm font-medium text-[#10B981]">Picks Complete</p>
					</div>
					<p className="text-xs text-gray-600 mb-3">
						{totalPicksMade} of {totalGamesForWeek} games picked
					</p>
					{/* Results Summary */}
					{(correctPicks > 0 || incorrectPicks > 0) && (
						<div className="text-xs text-gray-600 mb-3 space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-green-600">✓</span>
								<span>{correctPicks} correct</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-red-600">✗</span>
								<span>{incorrectPicks} incorrect</span>
							</div>
						</div>
					)}
					<Link
						href={`/picks/${currentWeek}`}
						className="text-sm text-[#4580BC] hover:text-[#265387] font-medium transition-colors"
					>
						View/Edit Picks →
					</Link>
				</div>
			) : (
				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-2 h-2 bg-[#E9932D] rounded-full"></div>
						<p className="text-sm font-medium text-[#E9932D]">
							You have not made your picks!
						</p>
					</div>
					<p className="text-xs text-gray-600 mb-3">
						{totalPicksMade} of {totalGamesForWeek} games picked
					</p>
					{/* Results Summary */}
					{(correctPicks > 0 || incorrectPicks > 0) && (
						<div className="text-xs text-gray-600 mb-3 space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-green-600">✓</span>
								<span>{correctPicks} correct</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-red-600">✗</span>
								<span>{incorrectPicks} incorrect</span>
							</div>
						</div>
					)}
					<Link
						href="/picks/current"
						className="inline-block bg-[#4580BC] hover:bg-[#265387] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Make Picks →
					</Link>
				</div>
			)}
		</div>
	)
}

