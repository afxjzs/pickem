"use client"

import { useState, useEffect } from "react"
import { EnrichedGame } from "@/lib/types/database"

interface GamesDisplayProps {
	initialSeason?: number
	initialWeek?: number
}

export default function GamesDisplay({
	initialSeason = 2025,
	initialWeek,
}: GamesDisplayProps) {
	const [allGames, setAllGames] = useState<EnrichedGame[]>([])
	const [games, setGames] = useState<EnrichedGame[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [season, setSeason] = useState(initialSeason)
	const [week, setWeek] = useState<number | undefined>(initialWeek)
	const [status, setStatus] = useState<string>("")
	const [team, setTeam] = useState<string>("")

	useEffect(() => {
		fetchGames()
	}, [season, week, status])

	// Client-side filtering for team search
	useEffect(() => {
		if (!allGames.length) return

		let filtered = allGames

		// Apply team filter (client-side)
		if (team.trim()) {
			const teamLower = team.toLowerCase()
			filtered = filtered.filter(
				(game) =>
					game.home_team.toLowerCase().includes(teamLower) ||
					game.away_team.toLowerCase().includes(teamLower) ||
					(game.home_team_data?.name &&
						game.home_team_data.name.toLowerCase().includes(teamLower)) ||
					(game.away_team_data?.name &&
						game.away_team_data.name.toLowerCase().includes(teamLower))
			)
		}

		setGames(filtered)
	}, [allGames, team])

	const handleTeamFilterChange = (value: string) => {
		setTeam(value)
		setError(null) // Clear any existing errors when user types
	}

	const fetchGames = async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams()
			params.append("season", season.toString())
			if (week) params.append("week", week.toString())
			if (status) params.append("status", status)

			const response = await fetch(`/api/games?${params.toString()}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Failed to fetch games")
			}

			const fetchedGames = data.data || []
			setAllGames(fetchedGames)
			setGames(fetchedGames)
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}

	const getStatusColor = (gameStatus: string) => {
		const colors = {
			scheduled: "text-blue-600 bg-blue-100",
			live: "text-green-600 bg-green-100",
			final: "text-gray-600 bg-gray-100",
			cancelled: "text-red-600 bg-red-100",
		}
		return (
			colors[gameStatus as keyof typeof colors] || "text-gray-600 bg-gray-100"
		)
	}

	const getStatusIcon = (gameStatus: string) => {
		switch (gameStatus) {
			case "scheduled":
				return (
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				)
			case "live":
				return (
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				)
			case "final":
				return (
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				)
			case "cancelled":
				return (
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				)
			default:
				return null
		}
	}

	const formatGameTime = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			timeZoneName: "short",
		})
	}

	const getRelativeTime = (dateString: string) => {
		const now = new Date()
		const gameTime = new Date(dateString)
		const diffMs = gameTime.getTime() - now.getTime()
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

		if (diffMs < 0) {
			return "Game has started"
		} else if (diffDays > 0) {
			return `${diffDays} day${diffDays > 1 ? "s" : ""} away`
		} else if (diffHours > 0) {
			return `${diffHours} hour${diffHours > 1 ? "s" : ""} away`
		} else {
			const diffMinutes = Math.floor(diffMs / (1000 * 60))
			return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} away`
		}
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Loading games...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-md p-4">
				<div className="flex">
					<div className="flex-shrink-0">
						<svg
							className="h-5 w-5 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">
							Error loading games
						</h3>
						<div className="mt-2 text-sm text-red-700">{error}</div>
						<button
							onClick={fetchGames}
							className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="bg-white p-8 rounded-lg shadow-sm border">
				<div className="flex flex-wrap gap-8 items-end">
					<div className="mb-4 px-4">
						<label
							htmlFor="season"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Season
						</label>
						<select
							id="season"
							value={season}
							onChange={(e) => setSeason(parseInt(e.target.value))}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900 py-3 px-4"
						>
							<option value={2025}>2025</option>
							<option value={2024}>2024</option>
							<option value={2023}>2023</option>
							<option value={2022}>2022</option>
						</select>
					</div>

					<div className="mb-4 px-4">
						<label
							htmlFor="week"
							className="block text-sm font-medium text-gray-700 mb-3"
						>
							Week
						</label>
						<select
							id="week"
							value={week || ""}
							onChange={(e) =>
								setWeek(e.target.value ? parseInt(e.target.value) : undefined)
							}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900 py-3 px-4"
						>
							<option value="">All Weeks</option>
							{Array.from({ length: 18 }, (_, i) => i + 1).map((weekNum) => (
								<option key={weekNum} value={weekNum}>
									Week {weekNum}
								</option>
							))}
						</select>
					</div>

					<div className="mb-4 px-4">
						<label
							htmlFor="status"
							className="block text-sm font-medium text-gray-700 mb-3"
						>
							Status
						</label>
						<select
							id="status"
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900 py-3 px-4"
						>
							<option value="">All Statuses</option>
							<option value="scheduled">Scheduled</option>
							<option value="live">Live</option>
							<option value="final">Final</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>

					<div className="mb-4 px-4">
						<label
							htmlFor="team"
							className="block text-sm font-medium text-gray-700 mb-3"
						>
							Team
						</label>
						<input
							type="text"
							id="team"
							value={team}
							onChange={(e) => handleTeamFilterChange(e.target.value)}
							placeholder="e.g., BUF"
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900 py-3 px-4"
						/>
					</div>

					<div className="ml-auto flex items-center space-x-4">
						<button
							onClick={() => {
								setError(null)
								setLoading(true)
								// Clear cache by adding timestamp to force fresh data
								fetchGames()
							}}
							className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							🔄 Resync
						</button>
						<span className="text-sm text-gray-500">
							{games.length} game{games.length !== 1 ? "s" : ""}
						</span>
					</div>
				</div>
			</div>

			{/* Games List */}
			<div className="space-y-3">
				{games.map((game) => (
					<div
						key={game.espn_id}
						className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="flex items-center space-x-3 mb-2">
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
											game.status
										)}`}
									>
										{getStatusIcon(game.status)}
										<span className="ml-1 capitalize">{game.status}</span>
									</span>
									{game.is_snf && (
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
											SNF
										</span>
									)}
									{game.is_mnf && (
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
											MNF
										</span>
									)}
								</div>

								<div className="grid grid-cols-3 gap-4 items-center">
									<div className="text-center">
										{/* Away Team */}
										<div className="flex flex-col items-center space-y-2">
											{game.away_team_data?.logo_url ? (
												<img
													src={game.away_team_data.logo_url}
													alt={`${game.away_team_data.name} logo`}
													className="w-12 h-12 rounded-full"
												/>
											) : (
												<div
													className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
													style={{
														backgroundColor: `#${
															game.away_team_data?.primary_color || "666666"
														}`,
													}}
												>
													{game.away_team}
												</div>
											)}
											<div className="text-lg font-semibold text-gray-900">
												{game.away_team}
											</div>
											<div className="text-2xl font-bold text-gray-900">
												{game.away_score}
											</div>
										</div>
									</div>

									<div className="text-center">
										<div className="text-sm text-gray-500 mb-1">
											Week {game.week}
										</div>
										<div className="text-xs text-gray-400">at</div>
										<div className="text-xs text-gray-500">
											{formatGameTime(game.start_time)}
										</div>
										{game.status === "scheduled" && (
											<div className="text-xs text-blue-600 mt-1">
												{getRelativeTime(game.start_time)}
											</div>
										)}
									</div>

									<div className="text-center">
										{/* Home Team */}
										<div className="flex flex-col items-center space-y-2">
											{game.home_team_data?.logo_url ? (
												<img
													src={game.home_team_data.logo_url}
													alt={`${game.home_team_data.name} logo`}
													className="w-12 h-12 rounded-full"
												/>
											) : (
												<div
													className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
													style={{
														backgroundColor: `#${
															game.home_team_data?.primary_color || "666666"
														}`,
													}}
												>
													{game.home_team}
												</div>
											)}
											<div className="text-lg font-semibold text-gray-900">
												{game.home_team}
											</div>
											<div className="text-2xl font-bold text-gray-900">
												{game.home_score}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty State */}
			{games.length === 0 && !loading && (
				<div className="text-center py-12">
					<svg
						className="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						No games found
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Try adjusting your filters or check back later.
					</p>
				</div>
			)}
		</div>
	)
}
