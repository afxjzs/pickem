"use client"

// src/app/leaderboard/weeks/page.tsx
// Weekly Performance Leaderboard

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"

function WeeksContent() {
	const { user, loading: authLoading } = useAuth()
	const router = useRouter()
	const [weeklyData, setWeeklyData] = useState<{
		users: WeeklyPerformanceUser[]
		week_winners: Record<number, number>
		season: string
	} | null>(null)
	const [loadingWeekly, setLoadingWeekly] = useState(true)
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

	// Fetch data on mount and when season changes
	useEffect(() => {
		fetchWeeklyData()
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
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Weekly Performance</h1>
					<p className="text-sm md:text-base text-gray-600">Season {season}</p>
				</div>

				{/* Weekly Performance Table */}
				<div className="bg-white rounded-lg shadow overflow-hidden">
					{loadingWeekly ? (
						<div className="p-6 md:p-8 text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
							<p className="mt-4 text-sm md:text-base text-gray-600">Loading leaderboard...</p>
						</div>
					) : weeklyData && weeklyData.users && weeklyData.users.length > 0 ? (
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
					) : (
						<div className="p-6 md:p-8 text-center text-sm md:text-base text-gray-500">
							No leaderboard data available yet.
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default function WeeksPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		}>
			<WeeksContent />
		</Suspense>
	)
}

