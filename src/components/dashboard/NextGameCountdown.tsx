"use client"

import { useState, useEffect } from "react"
import type { Game } from "@/lib/types/database"

interface NextGameCountdownProps {
	currentWeek: number
	season: string
}

export default function NextGameCountdown({
	currentWeek,
	season,
}: NextGameCountdownProps) {
	const [nextGames, setNextGames] = useState<Game[]>([])
	const [totalRemainingGames, setTotalRemainingGames] = useState<number>(0)
	const [countdown, setCountdown] = useState<string>("")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchNextGames = async () => {
			try {
				setLoading(true)
				const response = await fetch(
					`/api/games?season=${season}&week=${currentWeek}`
				)
				const data = await response.json()
				if (data.success && Array.isArray(data.data)) {
					const now = new Date()
					
					// Get all games that haven't started yet
					const allUpcomingGames = data.data
						.filter((game: Game) => {
							const gameTime = new Date(game.start_time)
							return gameTime > now && game.status === "scheduled"
						})
						.sort((a: Game, b: Game) => {
							return (
								new Date(a.start_time).getTime() -
								new Date(b.start_time).getTime()
							)
						})

					// Count total remaining games in the week
					setTotalRemainingGames(allUpcomingGames.length)
					
					// Show up to 3 next games for display
					setNextGames(allUpcomingGames.slice(0, 3))
				}
			} catch (error) {
				console.error("Error fetching next games:", error)
			} finally {
				setLoading(false)
			}
		}

		fetchNextGames()
	}, [currentWeek, season])

	useEffect(() => {
		if (nextGames.length === 0) return

		const updateCountdown = () => {
			const now = new Date()
			const nextGame = nextGames[0]
			const gameTime = new Date(nextGame.start_time)
			const diff = gameTime.getTime() - now.getTime()

			if (diff <= 0) {
				setCountdown("Game started!")
				return
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24))
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
			const seconds = Math.floor((diff % (1000 * 60)) / 1000)

			if (days > 0) {
				setCountdown(`${days}d ${hours}h ${minutes}m`)
			} else if (hours > 0) {
				setCountdown(`${hours}h ${minutes}m ${seconds}s`)
			} else if (minutes > 0) {
				setCountdown(`${minutes}m ${seconds}s`)
			} else {
				setCountdown(`${seconds}s`)
			}
		}

		updateCountdown()
		const interval = setInterval(updateCountdown, 1000)

		return () => clearInterval(interval)
	}, [nextGames])

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

	if (nextGames.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
				<h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
					Next Game(s)
				</h3>
				<p className="text-sm text-gray-600">No upcoming games scheduled</p>
			</div>
		)
	}

	const nextGame = nextGames[0]
	const gameTime = new Date(nextGame.start_time)
	const gameTimeStr = gameTime.toLocaleString([], {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})

	return (
		<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
			<h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
				Next Game(s)
			</h3>
			<div className="space-y-2">
				<div>
					<div className="text-lg md:text-xl font-bold text-blue-600 mb-1">
						{countdown || "Calculating..."}
					</div>
					<div className="text-xs md:text-sm text-gray-600">
						{nextGame.away_team} @ {nextGame.home_team}
					</div>
					<div className="text-xs text-gray-500 mt-1">{gameTimeStr}</div>
				</div>
				{totalRemainingGames > 1 && (
					<div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
						{totalRemainingGames - 1} more game{totalRemainingGames - 1 > 1 ? "s" : ""} remaining this week
					</div>
				)}
			</div>
		</div>
	)
}

