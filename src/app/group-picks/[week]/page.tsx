"use client"

// src/app/group-picks/[week]/page.tsx
// Group Picks view - shows all users' picks for a specific week

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import type { GroupPicksResponse, UserPickData } from "@/app/api/group-picks/route"
import type { Game, Pick } from "@/lib/types/database"
import { getWinningTeam, isPickCorrect } from "@/lib/utils/scoring"

export default function GroupPicksPage() {
	const { user, loading: authLoading } = useAuth()
	const router = useRouter()
	const params = useParams()
	const [groupPicksData, setGroupPicksData] = useState<GroupPicksResponse | null>(null)
	const [groupPicksCache, setGroupPicksCache] = useState<Map<number, GroupPicksResponse>>(new Map())
	const [loadingGroupPicks, setLoadingGroupPicks] = useState(false)
	const [season, setSeason] = useState("2025")
	const [groupPicksWeek, setGroupPicksWeek] = useState<number | null>(null)
	const [currentWeek, setCurrentWeek] = useState<number | null>(null)
	
	// Store user ID in state to persist across re-renders
	const [userId, setUserId] = useState<string | null>(null)
	useEffect(() => {
		if (user?.id) {
			setUserId(user.id)
		}
	}, [user?.id])

	const allWeeks = useMemo(() => Array.from({ length: 18 }, (_, i) => i + 1), [])

	// Initialize week from URL or fetch current week on mount
	useEffect(() => {
		const weekParam = params?.week as string
		
		if (weekParam === "current-week") {
			// Fetch current week and redirect - don't set week yet to avoid loading week 1
			const fetchCurrentWeek = async () => {
				try {
					const response = await fetch('/api/season')
					const data = await response.json()
					if (data.success && data.data?.currentWeek) {
						setCurrentWeek(data.data.currentWeek)
						// Redirect immediately without setting state to avoid loading week 1
						router.replace(`/group-picks/${data.data.currentWeek}`, { scroll: false })
					}
				} catch (error) {
					console.error("Error fetching current week:", error)
				}
			}
			fetchCurrentWeek()
		} else if (weekParam) {
			const weekNum = parseInt(weekParam, 10)
			if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
				setGroupPicksWeek(weekNum)
			} else {
				// Invalid week in URL, fetch current week
				const fetchCurrentWeek = async () => {
					try {
						const response = await fetch('/api/season')
						const data = await response.json()
						if (data.success && data.data?.currentWeek) {
							setCurrentWeek(data.data.currentWeek)
							setGroupPicksWeek(data.data.currentWeek)
							router.replace(`/group-picks/${data.data.currentWeek}`, { scroll: false })
						}
					} catch (error) {
						console.error("Error fetching current week:", error)
					}
				}
				fetchCurrentWeek()
			}
		} else {
			// No week in URL, fetch current week and redirect
			const fetchCurrentWeek = async () => {
				try {
					const response = await fetch('/api/season')
					const data = await response.json()
					if (data.success && data.data?.currentWeek) {
						setCurrentWeek(data.data.currentWeek)
						setGroupPicksWeek(data.data.currentWeek)
						router.replace(`/group-picks/${data.data.currentWeek}`, { scroll: false })
					}
				} catch (error) {
					console.error("Error fetching current week:", error)
				}
			}
			fetchCurrentWeek()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.week]) // Run when week param changes

	// Fetch group picks when week changes (only if week is valid)
	useEffect(() => {
		if (groupPicksWeek !== null && groupPicksWeek >= 1 && groupPicksWeek <= 18) {
			fetchGroupPicks()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupPicksWeek, season, currentWeek])

	const fetchGroupPicksInBackground = async () => {
		if (groupPicksWeek === null) return
		
		setLoadingGroupPicks(true)
		if (!groupPicksCache.has(groupPicksWeek)) {
			setGroupPicksData(null) // Only clear if no cache
		}

		try {
			// For completed weeks, use normal fetch (respect HTTP cache)
			// For current week, use cache-busting
			const isCurrentWeek = currentWeek !== null && groupPicksWeek === currentWeek
			const url = isCurrentWeek
				? `/api/group-picks?season=${season}&week=${groupPicksWeek}&_t=${Date.now()}`
				: `/api/group-picks?season=${season}&week=${groupPicksWeek}`

			const fetchOptions: RequestInit = isCurrentWeek
				? { cache: 'no-store' }
				: { cache: 'default' } // Respect HTTP cache headers

			const response = await fetch(url, fetchOptions)

			// Handle 304 Not Modified
			if (response.status === 304) {
				// Use cached data
				const cached = groupPicksCache.get(groupPicksWeek)
				if (cached) {
					setGroupPicksData(cached)
				}
				setLoadingGroupPicks(false)
				return
			}

			const data = await response.json()

			if (data.success && data.data) {
				setGroupPicksData(data.data)
				// Cache the data
				setGroupPicksCache(prev => {
					const newCache = new Map(prev)
					newCache.set(groupPicksWeek, data.data)
					return newCache
				})
			} else {
				console.error("Failed to fetch group picks:", data.message)
			}
		} catch (error) {
			console.error("Error fetching group picks:", error)
		} finally {
			setLoadingGroupPicks(false)
		}
	}

	const fetchGroupPicks = async () => {
		if (groupPicksWeek === null) return

		const isCurrentWeek = currentWeek !== null && groupPicksWeek === currentWeek

		// Check cache first (stale-while-revalidate pattern)
		const cached = groupPicksCache.get(groupPicksWeek)
		if (cached) {
			// For completed weeks, check if they're ACTUALLY complete (final WITH scores)
			const allGamesComplete = cached.games.every(g => 
				g.status === "final" && 
				g.home_score !== null && 
				g.away_score !== null
			)
			
			if (allGamesComplete) {
				setGroupPicksData(cached)
				setLoadingGroupPicks(false)
				// Still fetch in background to update cache if needed
				fetchGroupPicksInBackground()
				return
			}

			// For current week, show cached data immediately but fetch fresh
			if (isCurrentWeek) {
				setGroupPicksData(cached)
				setLoadingGroupPicks(false)
				// Fetch fresh data in background
				fetchGroupPicksInBackground()
				return
			}

			// For past weeks (not complete), check if cache has spread data
			const hasSpreadData = cached.games.some(g => g.spread !== null && g.spread !== undefined)
			if (hasSpreadData) {
				setGroupPicksData(cached)
				setLoadingGroupPicks(false)
				return
			} else {
				// Remove from cache if data is incomplete
				setGroupPicksCache(prev => {
					const newCache = new Map(prev)
					newCache.delete(groupPicksWeek)
					return newCache
				})
			}
		}

		// No cache or cache invalid, fetch fresh data
		await fetchGroupPicksInBackground()
	}

	const handleGroupPicksWeekChange = (newWeek: number) => {
		if (newWeek === groupPicksWeek) {
			return
		}
		setGroupPicksWeek(newWeek)
		router.push(`/group-picks/${newWeek}`, { scroll: false })
		// Clear data immediately when switching weeks
		setGroupPicksData(null)
		setLoadingGroupPicks(true)
	}

	const isCurrentUser = (checkUserId: string) => {
		// Use both current user state and stored userId to handle intermittent auth state
		return (user?.id === checkUserId) || (userId === checkUserId)
	}

	const getUserPickForGame = (userPicks: UserPickData, gameId: string) => {
		return userPicks.picks.find(p => p.game_id === gameId)
	}

	const getTeamAbbreviation = (game: Game, teamAbbr: string) => {
		return teamAbbr
	}

	const getFavoredTeam = (game: Game): string | null => {
		if (game.spread === null || game.spread === undefined) {
			return null
		}
		// Spread is from home team's perspective
		// Negative spread = home team favored
		// Positive spread = away team favored
		if (game.spread < 0) {
			return game.home_team
		} else if (game.spread > 0) {
			return game.away_team
		}
		return null // Pick 'em
	}

	return (
		<div className="min-h-screen bg-gray-50 py-4 md:py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-4 md:mb-8">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">
						Group Picks
					</h1>
					<p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
						Season {season}
					</p>

					{/* Week Selector */}
					<div className="mb-4 md:mb-6 bg-white rounded-lg shadow p-3 md:p-4">
						<div className="flex flex-wrap gap-1.5 md:gap-2">
							<span className="text-xs md:text-sm font-medium text-gray-700 mr-2">Week:</span>
							{allWeeks.map(weekNum => (
								<button
									key={weekNum}
									onClick={() => handleGroupPicksWeekChange(weekNum)}
									className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium transition-colors ${
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
				</div>

				{/* Group Picks Table */}
				{groupPicksWeek === null ? (
					<div className="bg-white rounded-lg shadow p-6 md:p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-sm md:text-base text-gray-600">Loading...</p>
					</div>
				) : loadingGroupPicks ? (
					<div className="bg-white rounded-lg shadow p-6 md:p-8 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-sm md:text-base text-gray-600">Loading picks...</p>
					</div>
				) : groupPicksData && groupPicksData.games.length > 0 ? (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						<div className="overflow-x-auto -mx-4 sm:mx-0">
							<div className="inline-block min-w-full align-middle">
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									{/* Game Header Row */}
									<tr>
										<th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-[100px]">
											Team Name
										</th>
										{groupPicksData.games.map((game) => (
											<th
												key={game.id}
												className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px] md:min-w-[70px]"
											>
												<div className="flex flex-col">
													<span className="text-xs">{game.away_team}</span>
													<span className="text-gray-400 text-xs">@</span>
													<span className="text-xs">{game.home_team}</span>
												</div>
											</th>
										))}
										<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											Points
										</th>
									</tr>
									{/* Favored Row */}
									<tr className="bg-gray-100">
										<td className="px-2 md:px-4 py-1.5 md:py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
											Favored
										</td>
										{groupPicksData.games.map((game) => {
											const favoredTeam = getFavoredTeam(game)
											return (
												<td
													key={game.id}
													className="px-1 md:px-2 py-1.5 md:py-2 text-center text-xs text-gray-600 font-semibold"
												>
													{favoredTeam || "--"}
												</td>
											)
										})}
										<td></td>
									</tr>
									{/* Spread Row */}
									<tr className="bg-gray-100">
										<td className="px-2 md:px-4 py-1.5 md:py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
											Spread
										</td>
										{groupPicksData.games.map((game) => {
											const spread = game.spread
											return (
												<td
													key={game.id}
													className="px-1 md:px-2 py-1.5 md:py-2 text-center text-xs text-gray-600"
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
										<td className="px-2 md:px-4 py-1.5 md:py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
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
													className="px-1 md:px-2 py-1.5 md:py-2 text-center text-xs text-gray-600"
												>
													{underdogTeam || "--"}
												</td>
											)
										})}
										<td></td>
									</tr>
									{/* Score Row - Show scores for live/final games */}
									<tr className="bg-gray-50">
										<td className="px-2 md:px-4 py-1.5 md:py-2 text-xs font-medium text-gray-600 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
											Score
										</td>
										{groupPicksData.games.map((game) => {
											const hasScores = game.home_score !== null && 
												game.home_score !== undefined && 
												game.away_score !== null && 
												game.away_score !== undefined
											const isLiveOrFinal = game.status === "live" || game.status === "final"
											
											return (
												<td
													key={game.id}
													className={`px-1 md:px-2 py-1.5 md:py-2 text-center text-xs font-semibold ${
														game.status === "live" ? "text-red-600" : 
														game.status === "final" ? "text-gray-900" : 
														"text-gray-400"
													}`}
												>
													{isLiveOrFinal && hasScores ? (
														<div className="flex flex-col">
															<span>{game.away_score}</span>
															<span className="text-gray-400">-</span>
															<span>{game.home_score}</span>
														</div>
													) : (
														"--"
													)}
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
												<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${
													isUser ? "bg-yellow-50" : "bg-white"
												}`}>
													{userPicks.display_name}
												</td>
												{groupPicksData.games.map((game) => {
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
																	className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm text-gray-400"
																>
																	--
																</td>
															)
														} else {
															// No pick - show blank
															return (
																<td
																	key={game.id}
																	className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm"
																>
																</td>
															)
														}
													}
													
													// Current user's picks are always shown, or game has started - show picks

													// If no pick exists, show blank
													if (!pick) {
														return (
															<td
																key={game.id}
																className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm"
															>
															</td>
														)
													}

													// Current user can always see their own picks, even if incomplete
													// Show team abbreviation if picked, even if confidence points aren't set yet
													if (isUser) {
														if (!pick.picked_team) {
															// No team picked yet - show blank
															return (
																<td
																	key={game.id}
																	className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm"
																>
																</td>
															)
														}
														
														// User has picked a team - show it, even if confidence points aren't set
														const teamAbbr = getTeamAbbreviation(game, pick.picked_team)
														
														// If confidence points aren't set, show just the team
														if (pick.confidence_points === 0 || !pick.confidence_points) {
															return (
																<td
																	key={game.id}
																	className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-gray-700"
																>
																	{teamAbbr}
																</td>
															)
														}
													}

													// For other users or if game has started, show full pick info
													// If pick exists but is incomplete (missing team or confidence points), show "--"
													if (!pick.picked_team || pick.confidence_points === 0) {
														return (
															<td
																key={game.id}
																className="px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm text-gray-400"
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
															className={`px-1 md:px-2 py-2 md:py-3 text-center text-xs md:text-sm font-medium ${pickColor}`}
														>
															<div className="flex flex-col">
																<span>{teamAbbr}</span>
																<span className="text-xs">({pick.confidence_points})</span>
															</div>
														</td>
													)
												})}
												<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-semibold text-gray-900 text-center ${
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
						</div>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow p-6 md:p-8 text-center text-sm md:text-base text-gray-500">
						No picks data available for this week.
					</div>
				)}
			</div>
		</div>
	)
}

