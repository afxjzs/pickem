"use client"

// src/app/leaderboard/page.tsx
// Weekly Performance and Overall Standings Leaderboard

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import Navigation from "@/components/layout/Navigation"
import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"
import type { SeasonStanding } from "@/lib/types/database"
import type { GroupPicksResponse, UserPickData } from "@/app/api/group-picks/route"
import type { Game, Pick } from "@/lib/types/database"
import { getWinningTeam, isPickCorrect } from "@/lib/utils/scoring"

type TabType = "weekly" | "overall" | "group-picks"

export default function LeaderboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [activeTab, setActiveTab] = useState<TabType>("weekly")
	const [weeklyData, setWeeklyData] = useState<{
		users: WeeklyPerformanceUser[]
		week_winners: Record<number, number>
		season: string
	} | null>(null)
	const [overallData, setOverallData] = useState<SeasonStanding[] | null>(null)
	const [groupPicksData, setGroupPicksData] = useState<GroupPicksResponse | null>(null)
	const [groupPicksCache, setGroupPicksCache] = useState<Map<number, GroupPicksResponse>>(new Map())
	const [loadingWeekly, setLoadingWeekly] = useState(true)
	const [loadingOverall, setLoadingOverall] = useState(true)
	const [loadingGroupPicks, setLoadingGroupPicks] = useState(false)
	const [season, setSeason] = useState("2025")
	const [groupPicksWeek, setGroupPicksWeek] = useState(1)

	// Initialize week from URL if present
	useEffect(() => {
		const weekParam = searchParams.get("week")
		if (weekParam) {
			const weekNum = parseInt(weekParam, 10)
			if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
				setGroupPicksWeek(weekNum)
				setActiveTab("group-picks")
			}
		}
	}, [searchParams])

	// Fetch data on mount and when season changes
	useEffect(() => {
		fetchWeeklyData()
		fetchOverallData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [season])

	// Fetch group picks when tab is active or week changes
	useEffect(() => {
		if (activeTab === "group-picks") {
			// Always fetch when week changes, even if we have cache
			// The fetchGroupPicks function will use cache if available
			fetchGroupPicks()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab, groupPicksWeek, season])

	const fetchWeeklyData = async () => {
		const needsLoading = !weeklyData
		if (needsLoading) {
			setLoadingWeekly(true)
		}
		try {
			const response = await fetch(`/api/leaderboard?season=${season}`)
			const data = await response.json()
			if (data.success) {
				setWeeklyData(data.data)
			} else {
				console.error("Failed to fetch weekly data:", data)
			}
		} catch (error) {
			console.error("Error fetching weekly data:", error)
		} finally {
			if (needsLoading) {
				setLoadingWeekly(false)
			}
		}
	}

	const fetchOverallData = async () => {
		const needsLoading = !overallData
		if (needsLoading) {
			setLoadingOverall(true)
		}
		try {
			const response = await fetch(`/api/scores?season=${season}&type=season`)
			const data = await response.json()
			if (data.success) {
				setOverallData(data.data)
			}
		} catch (error) {
			console.error("Error fetching overall data:", error)
		} finally {
			if (needsLoading) {
				setLoadingOverall(false)
			}
		}
	}

	const fetchGroupPicks = async () => {
		// Check cache first - but validate that cached data has spread information
		const cached = groupPicksCache.get(groupPicksWeek)
		if (cached) {
			// Check if cached data has spread data for at least some games
			// If all games are missing spread, fetch fresh data
			const hasSpreadData = cached.games && cached.games.some(game => game.spread !== null && game.spread !== undefined)
			
			if (hasSpreadData) {
				// Cached data has spread info, use it
				setGroupPicksData(cached)
				setLoadingGroupPicks(false)
				return
			} else {
				// Cached data is missing spread, remove from cache and fetch fresh
				setGroupPicksCache(prev => {
					const newCache = new Map(prev)
					newCache.delete(groupPicksWeek)
					return newCache
				})
			}
		}

		// No cache or cache invalid - fetch from API
		setLoadingGroupPicks(true)
		setGroupPicksData(null) // Clear previous data while loading
		
		try {
			// Add cache-busting parameter to ensure fresh data when spread might have been updated
			const url = `/api/group-picks?season=${season}&week=${groupPicksWeek}&_t=${Date.now()}`
			const response = await fetch(url, {
				cache: 'no-store' // Don't use browser cache
			})
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			
			const data = await response.json()
			
			if (data.success && data.data) {
				setGroupPicksData(data.data)
				// Cache the data for this week
				setGroupPicksCache(prev => {
					const newCache = new Map(prev)
					newCache.set(groupPicksWeek, data.data)
					return newCache
				})
			} else {
				console.error("Failed to fetch group picks:", data.error || "Unknown error")
				// Set empty data so UI shows "no data" message
				setGroupPicksData({
					games: [],
					user_picks: [],
					week: groupPicksWeek,
					season
				})
			}
		} catch (error) {
			console.error("Error fetching group picks:", error)
			// Set empty data on error so UI shows error state
			setGroupPicksData({
				games: [],
				user_picks: [],
				week: groupPicksWeek,
				season
			})
		} finally {
			setLoadingGroupPicks(false)
		}
	}

	const handleGroupPicksWeekChange = (newWeek: number) => {
		if (newWeek === groupPicksWeek) {
			return // Already on this week
		}
		
		setGroupPicksWeek(newWeek)
		// Clear data immediately when switching weeks so old data doesn't show
		setGroupPicksData(null)
		setLoadingGroupPicks(true)
		router.push(`/leaderboard?tab=group-picks&week=${newWeek}`, { scroll: false })
	}

	const isCurrentUser = (userId: string) => {
		return user?.id === userId
	}

	const isWeekWinner = (week: number, points: number) => {
		if (!weeklyData?.week_winners) return false
		return weeklyData.week_winners[week] === points && points > 0
	}

	const allWeeks = Array.from({ length: 18 }, (_, i) => i + 1)

	// Helper functions for Group Picks tab
	const getFavoredTeam = (game: Game): string | null => {
		// If spread is null/undefined, we can't determine favored team
		if (game.spread === null || game.spread === undefined) {
			return null
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

	const isFavoredPick = (game: Game, pickedTeam: string): boolean => {
		const favoredTeam = getFavoredTeam(game)
		if (favoredTeam === null) {
			return false
		}
		return pickedTeam === favoredTeam
	}

	const getUserPickForGame = (userPicks: UserPickData, gameId: string) => {
		return userPicks.picks.find(p => p.game_id === gameId)
	}

	const getTeamAbbreviation = (game: Game, pickedTeam: string): string => {
		if (pickedTeam === game.home_team) {
			return game.home_team
		}
		if (pickedTeam === game.away_team) {
			return game.away_team
		}
		return pickedTeam
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
					<p className="text-gray-600">Season {season}</p>
				</div>

				{/* Tabs */}
				<div className="mb-6 border-b border-gray-200">
					<nav className="-mb-px flex space-x-8">
						<button
							onClick={() => setActiveTab("weekly")}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === "weekly"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							Weekly Performance
						</button>
						<button
							onClick={() => setActiveTab("overall")}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === "overall"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							Overall Standings
						</button>
						<button
							onClick={() => setActiveTab("group-picks")}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === "group-picks"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							Group Picks
						</button>
					</nav>
				</div>

				{/* Weekly Performance Tab */}
				{activeTab === "weekly" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						{loadingWeekly ? (
							<div className="p-8 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-4 text-gray-600">Loading leaderboard...</p>
							</div>
						) : weeklyData && weeklyData.users && weeklyData.users.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Rank
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Pick Set Name
											</th>
											{allWeeks.map(week => (
												<th
													key={week}
													className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Wk {week}
												</th>
											))}
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Total Pts
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{weeklyData.users.map((userData) => {
											const isUser = isCurrentUser(userData.user_id)
											return (
												<tr
													key={userData.user_id}
													className={isUser ? "bg-yellow-50" : ""}
												>
													<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
														{userData.rank}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
														{userData.display_name}
													</td>
													{allWeeks.map(week => {
														const points = userData.week_scores[week] || 0
														const isWinner = isWeekWinner(week, points)
														return (
															<td
																key={week}
																className={`px-2 py-3 whitespace-nowrap text-sm text-center ${
																	isWinner
																		? "bg-green-100 font-semibold text-green-800"
																		: "text-gray-900"
																}`}
															>
																{points}
															</td>
														)
													})}
													<td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
														{userData.total_points}
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						) : (
							<div className="p-8 text-center text-gray-500">
								No leaderboard data available yet.
							</div>
						)}
					</div>
				)}

				{/* Overall Standings Tab */}
				{activeTab === "overall" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						{loadingOverall ? (
							<div className="p-8 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-4 text-gray-600">Loading standings...</p>
							</div>
						) : overallData && overallData.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Rank
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Pick Set Name
											</th>
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Total Points
											</th>
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Weeks Played
											</th>
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Avg Points
											</th>
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Total Picks
											</th>
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Correct Picks
											</th>
											<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
												Correct %
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{overallData.map((standing) => {
											const isUser = isCurrentUser(standing.user_id)
											return (
												<tr
													key={standing.user_id}
													className={isUser ? "bg-yellow-50" : ""}
												>
													<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
														{standing.rank}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
														{standing.display_name}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
														{standing.total_points}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
														{standing.weeks_played}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
														{standing.average_points.toFixed(1)}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
														{standing.total_picks}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
														{standing.correct_picks}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
														{standing.correct_picks_percentage.toFixed(1)}%
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						) : (
							<div className="p-8 text-center text-gray-500">
								No standings data available yet.
							</div>
						)}
					</div>
				)}

				{/* Group Picks Tab */}
				{activeTab === "group-picks" && (
					<div>
						{/* Week Selector */}
						<div className="mb-6 bg-white rounded-lg shadow p-4">
							<div className="flex flex-wrap gap-2">
								<span className="text-sm font-medium text-gray-700 mr-2">Week:</span>
								{allWeeks.map(weekNum => (
									<button
										key={weekNum}
										onClick={() => handleGroupPicksWeekChange(weekNum)}
										className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
											groupPicksWeek === weekNum
												? "bg-blue-600 text-white"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200"
										}`}
									>
										{weekNum}
									</button>
								))}
							</div>
						</div>

						{/* Group Picks Table */}
						{loadingGroupPicks ? (
							<div className="bg-white rounded-lg shadow p-8 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-4 text-gray-600">Loading picks...</p>
							</div>
						) : groupPicksData && groupPicksData.games.length > 0 ? (
							<div className="bg-white rounded-lg shadow overflow-hidden">
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											{/* Game Header Row */}
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
													Team Name
												</th>
												{groupPicksData.games.map((game) => (
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
													Points
												</th>
											</tr>
											{/* Favored Row */}
											<tr className="bg-gray-100">
												<td className="px-4 py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
													Favored
												</td>
												{groupPicksData.games.map((game) => {
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
												{groupPicksData.games.map((game) => {
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
												{groupPicksData.games.map((game) => {
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
											{groupPicksData.user_picks.map((userPicks) => {
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
														{groupPicksData.games.map((game) => {
															const pick = getUserPickForGame(userPicks, game.id)
															if (!pick) {
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
															// - If game not final: gray/black (neutral) - NO COLORING BASED ON FAVORITE/UNDERDOG
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
																	<div className="flex flex-col">
																		<span>{teamAbbr}</span>
																		<span className="text-xs">({pick.confidence_points})</span>
																	</div>
																</td>
															)
														})}
														<td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-center ${
															isUser ? "bg-yellow-50" : ""
														}`}>
															{userPicks.weekly_points || 0}
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
				)}
			</div>
		</div>
	)
}

