"use client"

// src/app/leaderboard/picks/page.tsx
// Group Picks View - Shows all users' picks for a specific week

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import type { GroupPicksResponse, UserPickData } from "@/app/api/group-picks/route"
import type { Game, Team, Pick } from "@/lib/types/database"
import { isPickCorrect } from "@/lib/utils/scoring"

function GroupPicksContent() {
	const { user } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [week, setWeek] = useState(1)
	const [season, setSeason] = useState("2025")
	const [data, setData] = useState<GroupPicksResponse | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const weekParam = searchParams.get("week")
		if (weekParam) {
			const weekNum = parseInt(weekParam, 10)
			if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
				setWeek(weekNum)
			}
		}
	}, [searchParams])

	useEffect(() => {
		fetchGroupPicks()
	}, [week, season])

	const fetchGroupPicks = async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/group-picks?season=${season}&week=${week}`)
			const result = await response.json()
			if (result.success) {
				setData(result.data)
			}
		} catch (error) {
			console.error("Error fetching group picks:", error)
		} finally {
			setLoading(false)
		}
	}

	const handleWeekChange = (newWeek: number) => {
		setWeek(newWeek)
		router.push(`/leaderboard/picks?week=${newWeek}`, { scroll: false })
	}

	const isCurrentUser = (userId: string) => {
		return user?.id === userId
	}

	const getUserPickForGame = (userPicks: UserPickData, gameId: string) => {
		return userPicks.picks.find(p => p.game_id === gameId)
	}

	const getTeamAbbreviation = (game: Game, pickedTeam: string) => {
		if (pickedTeam === game.home_team) {
			return game.home_team
		}
		if (pickedTeam === game.away_team) {
			return game.away_team
		}
		return pickedTeam
	}

	// Determine which team is favored based on spread
	const getFavoredTeam = (game: Game): string | null => {
		if (game.spread === null || game.spread === undefined) {
			return null // Can't determine without spread
		}
		const spread = Number(game.spread)
		// Spread is from home team's perspective:
		// Negative = home team favored (e.g., -6.5 means home team favored by 6.5)
		// Positive = away team favored (e.g., +3 means away team favored by 3)
		// Zero = pick 'em
		if (spread < 0) {
			return game.home_team
		} else if (spread > 0) {
			return game.away_team
		}
		return null // Pick 'em
	}

	const isFavored = (game: Game, pickedTeam: string) => {
		const favoredTeam = getFavoredTeam(game)
		if (favoredTeam === null) {
			return false // Can't determine, default to false
		}
		return pickedTeam === favoredTeam
	}

	return (
		<div className="min-h-screen" style={{ backgroundColor: '#4580BC' }}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-6 flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-galindo text-white mb-2">Group Picks</h1>
						<p className="text-gray-600">Season {season}</p>
					</div>
					<Link
						href="/leaderboard"
						className="bg-[#4580BC] hover:bg-[#265387] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						View Leaderboard
					</Link>
				</div>

				{/* Week Selector */}
				<div className="mb-6 bg-white rounded-lg shadow p-4">
					<div className="flex flex-wrap gap-2">
						<span className="text-sm font-medium text-gray-700 mr-2">Week:</span>
						{Array.from({ length: 18 }, (_, i) => i + 1).map(weekNum => (
							<button
								key={weekNum}
								onClick={() => handleWeekChange(weekNum)}
								className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
									week === weekNum
										? "bg-[#4580BC] text-white"
										: "bg-white/80 text-gray-700 hover:bg-white"
								}`}
							>
								{weekNum}
							</button>
						))}
					</div>
				</div>

				{/* Group Picks Table */}
				{loading ? (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading picks...</p>
					</div>
				) : data && data.games.length > 0 ? (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									{/* Game Header Row */}
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
											Team Name
										</th>
										{data.games.map((game) => (
											<th
												key={game.id}
												className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]"
											>
												<div className="flex flex-col">
													<span>{game.away_team}</span>
													<span className="text-gray-400">@</span>
													<span>{game.home_team}</span>
												</div>
											</th>
										))}
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											Total Points
										</th>
									</tr>
									{/* Favored Row */}
									<tr className="bg-gray-100">
										<td className="px-4 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
											Favored
										</td>
										{data.games.map((game) => {
											const favoredTeam = getFavoredTeam(game)
											return (
												<td
													key={game.id}
													className="px-2 py-2 text-center text-xs text-gray-600 font-semibold"
												>
													{favoredTeam || "--"}
												</td>
											)
										})}
										<td></td>
									</tr>
									{/* Spread Row */}
									<tr className="bg-gray-100">
										<td className="px-4 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
											Spread
										</td>
										{data.games.map((game) => {
											const spread = game.spread
											return (
												<td
													key={game.id}
													className="px-2 py-2 text-center text-xs text-gray-600"
												>
													{spread !== null && spread !== undefined
														? `${spread > 0 ? "+" : ""}${spread}`
														: "--"}
												</td>
											)
										})}
										<td></td>
									</tr>
									{/* Underdog Row */}
									<tr className="bg-gray-100">
										<td className="px-4 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
											Underdog
										</td>
										{data.games.map((game) => {
											const favoredTeam = getFavoredTeam(game)
											const underdogTeam = favoredTeam === game.home_team 
												? game.away_team 
												: favoredTeam === game.away_team 
													? game.home_team 
													: null
											return (
												<td
													key={game.id}
													className="px-2 py-2 text-center text-xs text-gray-600"
												>
													{underdogTeam || "--"}
												</td>
											)
										})}
										<td></td>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{[...data.user_picks].sort((a, b) => {
										// Sort by weekly_points descending (highest first)
										// If points are equal, sort alphabetically by name
										if (b.weekly_points !== a.weekly_points) {
											return b.weekly_points - a.weekly_points
										}
										return a.display_name.localeCompare(b.display_name)
									}).map((userPicks) => {
										const isUser = isCurrentUser(userPicks.user_id)
										return (
											<tr
												key={userPicks.user_id}
												className={isUser ? "bg-yellow-50" : ""}
											>
												<td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${
													isUser ? "bg-yellow-50" : "bg-white"
												}`}>
													{userPicks.display_name}
												</td>
												{data.games.map((game) => {
													// Current user can always see their own picks
													// Other users' picks are only visible once game has started (live or final)
													const gameHasStarted = game.status === "live" || game.status === "final"
													const pick = getUserPickForGame(userPicks, game.id)
													
													// If game hasn't started and this is NOT the current user, hide their picks
													if (!gameHasStarted && !isUser) {
														// Game hasn't started yet - hide other users' picks
														// If user has made a pick, show "--", otherwise show blank
														if (pick && pick.picked_team && pick.confidence_points > 0) {
															return (
																<td
																	key={game.id}
																	className="px-2 py-3 text-center text-sm text-gray-400"
																>
																	--
																</td>
															)
														} else {
															// No pick - show blank
															return (
																<td
																	key={game.id}
																	className="px-2 py-3 text-center text-sm"
																>
																</td>
															)
														}
													}
													
													// Current user's picks are always shown, or game has started - show picks

													// Game has started (live or final) - show picks
													// If no pick exists, show blank
													if (!pick) {
														return (
															<td
																key={game.id}
																className="px-2 py-3 text-center text-sm"
															>
															</td>
														)
													}

													// If pick exists but is incomplete (missing team or confidence points), show "--"
													if (!pick.picked_team || pick.confidence_points === 0) {
														return (
															<td
																key={game.id}
																className="px-2 py-3 text-center text-sm text-gray-400"
															>
																--
															</td>
														)
													}

													const teamAbbr = getTeamAbbreviation(game, pick.picked_team)
													
													// Explicitly check if game is final before determining correctness
													// Only show correct/incorrect for games that have actually finished
													const isGameFinal = game.status === "final" && 
														game.home_score !== null && 
														game.home_score !== undefined &&
														game.away_score !== null && 
														game.away_score !== undefined
													
													// Determine if pick is correct/incorrect (only for completed games)
													let pickCorrect: boolean | null = null
													if (isGameFinal) {
														pickCorrect = isPickCorrect(pick as Pick, game)
													}
													// If game is not final, pickCorrect remains null
													
													// Color logic:
													// - If game is final: green for correct, red for incorrect
													// - If game not final: gray/black (neutral)
													let pickColor = "text-gray-700" // Default: neutral gray/black
													if (pickCorrect === true) {
														pickColor = "text-green-600" // Correct pick
													} else if (pickCorrect === false) {
														pickColor = "text-red-600" // Incorrect pick
													}
													// If pickCorrect is null, game hasn't finished, so keep gray/black

													return (
														<td
															key={game.id}
															className={`px-2 py-3 text-center text-sm font-medium ${pickColor}`}
														>
															{teamAbbr} ({pick.confidence_points})
														</td>
													)
												})}
												<td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
													{userPicks.weekly_points}
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
						No picks data available for this week.
					</div>
				)}
			</div>
		</div>
	)
}

export default function GroupPicksPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4580BC' }}>
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
					<p className="mt-4 text-white">Loading...</p>
				</div>
			</div>
		}>
			<GroupPicksContent />
		</Suspense>
	)
}

