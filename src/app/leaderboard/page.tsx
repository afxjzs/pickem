"use client"

// src/app/leaderboard/page.tsx
// Weekly Performance and Overall Standings Leaderboard

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"
import type { SeasonStanding } from "@/lib/types/database"

type TabType = "weekly" | "overall"

function LeaderboardContent() {
	const { user, loading: authLoading } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	// Initialize tab from URL parameter
	const initialTab = (searchParams.get("tab") as TabType) || "weekly"
	const [activeTab, setActiveTab] = useState<TabType>(initialTab)
	const [weeklyData, setWeeklyData] = useState<{
		users: WeeklyPerformanceUser[]
		week_winners: Record<number, number>
		season: string
	} | null>(null)
	const [overallData, setOverallData] = useState<SeasonStanding[] | null>(null)
	const [loadingWeekly, setLoadingWeekly] = useState(true)
	const [loadingOverall, setLoadingOverall] = useState(true)
	const [season, setSeason] = useState("2025")
	const [checkingOnboarding, setCheckingOnboarding] = useState(true)

	// Check if user has completed onboarding
	useEffect(() => {
		if (!authLoading && !user) {
			router.push("/signin")
			return
		}
		if (user && !authLoading) {
			const checkOnboarding = async () => {
				try {
					const response = await fetch("/api/users/me")
					const data = await response.json()
					if (data.success && data.data) {
						if (!data.data.username) {
							router.push("/onboarding")
							return
						}
					} else {
						router.push("/onboarding")
						return
					}
				} catch (error) {
					console.error("Error checking onboarding:", error)
				} finally {
					setCheckingOnboarding(false)
				}
			}
			checkOnboarding()
		}
	}, [user, authLoading, router])

	// Initialize tab from URL if present
	useEffect(() => {
		const tabParam = searchParams.get("tab") as TabType
		
		// Set tab from URL
		if (tabParam && ["weekly", "overall"].includes(tabParam)) {
			setActiveTab(tabParam)
		}
	}, [searchParams])

	// Fetch data on mount and when season changes
	useEffect(() => {
		fetchWeeklyData()
		fetchOverallData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [season])


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

	const isCurrentUser = (userId: string) => {
		return user?.id === userId
	}

	const isWeekWinner = (week: number, points: number) => {
		if (!weeklyData?.week_winners) return false
		return weeklyData.week_winners[week] === points && points > 0
	}

	const allWeeks = Array.from({ length: 18 }, (_, i) => i + 1)

	if (authLoading || checkingOnboarding) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
				{/* Header */}
				<div className="mb-4 md:mb-6">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
					<p className="text-sm md:text-base text-gray-600">Season {season}</p>
				</div>

				{/* Tabs */}
				<div className="mb-4 md:mb-6 border-b border-gray-200">
					<nav className="-mb-px flex space-x-4 md:space-x-8">
						<button
							onClick={() => setActiveTab("weekly")}
							className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${
								activeTab === "weekly"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							Weekly Performance
						</button>
						<button
							onClick={() => setActiveTab("overall")}
							className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${
								activeTab === "overall"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							Overall Standings
						</button>
					</nav>
				</div>

				{/* Weekly Performance Tab */}
				{activeTab === "weekly" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						{loadingWeekly ? (
							<div className="p-6 md:p-8 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-4 text-sm md:text-base text-gray-600">Loading leaderboard...</p>
							</div>
						) : weeklyData && weeklyData.users && weeklyData.users.length > 0 ? (
							<div className="overflow-x-auto -mx-4 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
												Rank
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-12 md:left-16 bg-gray-50 z-10 border-r border-gray-200 min-w-[120px]">
												Pick Set Name
											</th>
											{allWeeks.map(week => (
												<th
													key={week}
													className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]"
												>
													Wk {week}
												</th>
											))}
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
													<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${
														isUser ? "bg-yellow-50" : "bg-white"
													}`}>
														{userData.rank}
													</td>
													<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-12 md:left-16 z-10 border-r border-gray-200 ${
														isUser ? "bg-yellow-50" : "bg-white"
													}`}>
														{userData.display_name}
													</td>
													{allWeeks.map(week => {
														const points = userData.week_scores[week] || 0
														const isWinner = isWeekWinner(week, points)
														return (
															<td
																key={week}
																className={`px-1 md:px-2 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-center ${
																	isWinner
																		? "bg-green-100 font-semibold text-green-800"
																		: "text-gray-900"
																}`}
															>
																{points}
															</td>
														)
													})}
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-semibold text-gray-900 text-center">
														{userData.total_points}
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
									</div>
								</div>
							</div>
						) : (
							<div className="p-6 md:p-8 text-center text-sm md:text-base text-gray-500">
								No leaderboard data available yet.
							</div>
						)}
					</div>
				)}

				{/* Overall Standings Tab */}
				{activeTab === "overall" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						{loadingOverall ? (
							<div className="p-6 md:p-8 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-4 text-sm md:text-base text-gray-600">Loading standings...</p>
							</div>
						) : overallData && overallData.length > 0 ? (
							<div className="overflow-x-auto -mx-4 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
												Rank
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-12 md:left-16 bg-gray-50 z-10 border-r border-gray-200 min-w-[120px]">
												Pick Set Name
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
												Total Points
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
												Weeks Played
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
												Avg Points
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
												Total Picks
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
												Correct Picks
											</th>
											<th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
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
													<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${
														isUser ? "bg-yellow-50" : "bg-white"
													}`}>
														{standing.rank}
													</td>
													<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-12 md:left-16 z-10 border-r border-gray-200 ${
														isUser ? "bg-yellow-50" : "bg-white"
													}`}>
														{standing.display_name}
													</td>
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-semibold text-gray-900 text-center">
														{standing.total_points}
													</td>
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
														{standing.weeks_played}
													</td>
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
														{standing.average_points.toFixed(1)}
													</td>
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
														{standing.total_picks}
													</td>
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
														{standing.correct_picks}
													</td>
													<td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
														{standing.correct_picks_percentage.toFixed(1)}%
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
									</div>
								</div>
							</div>
						) : (
							<div className="p-6 md:p-8 text-center text-sm md:text-base text-gray-500">
								No standings data available yet.
							</div>
						)}
					</div>
				)}

			</div>
		</div>
	)
}

export default function LeaderboardPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		}>
			<LeaderboardContent />
		</Suspense>
	)
}

