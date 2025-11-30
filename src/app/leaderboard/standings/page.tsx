"use client"

// src/app/leaderboard/standings/page.tsx
// Overall Standings Leaderboard

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import type { SeasonStanding } from "@/lib/types/database"

function StandingsContent() {
	const { user, loading: authLoading } = useAuth()
	const router = useRouter()
	const [overallData, setOverallData] = useState<SeasonStanding[] | null>(null)
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

	// Fetch data on mount and when season changes
	useEffect(() => {
		fetchOverallData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [season])

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

	if (authLoading || checkingOnboarding) {
		return (
			<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4580BC' }}>
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
					<p className="mt-4 text-white">Loading...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen" style={{ backgroundColor: '#4580BC' }}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
				{/* Header */}
				<div className="mb-4 md:mb-6">
					<h1 className="text-2xl md:text-3xl font-galindo text-white mb-2">Overall Standings</h1>
					<p className="text-sm md:text-base text-gray-600">Season {season}</p>
				</div>

				{/* Overall Standings Table */}
				<div className="bg-white rounded-lg shadow overflow-hidden">
					{loadingOverall ? (
						<div className="p-6 md:p-8 text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
							<p className="mt-4 text-sm md:text-base text-gray-600">Loading standings...</p>
						</div>
					) : overallData && overallData.length > 0 ? (
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
												className={isUser ? "bg-[#E9932D]/10" : ""}
											>
												<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${
													isUser ? "bg-[#E9932D]/10" : "bg-white"
												}`}>
													{standing.rank}
												</td>
												<td className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 sticky left-12 md:left-16 z-10 border-r border-gray-200 ${
													isUser ? "bg-[#E9932D]/10" : "bg-white"
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
					) : (
						<div className="p-6 md:p-8 text-center text-sm md:text-base text-gray-500">
							No standings data available yet.
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default function StandingsPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		}>
			<StandingsContent />
		</Suspense>
	)
}

