"use client"

import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { SeasonStanding } from "@/lib/types/database"
import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"
import NextGameCountdown from "@/components/dashboard/NextGameCountdown"
import PicksStatusCard from "@/components/dashboard/PicksStatusCard"
import CumulativePointsChart from "@/components/dashboard/CumulativePointsChart"
import WeeklyPointsChart from "@/components/dashboard/WeeklyPointsChart"
import UserMetrics from "@/components/dashboard/UserMetrics"
import PerformanceInsights from "@/components/dashboard/PerformanceInsights"
import LeaderboardPreview from "@/components/dashboard/LeaderboardPreview"

export default function DashboardPage() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [userStats, setUserStats] = useState<SeasonStanding | null>(null)
	const [standings, setStandings] = useState<SeasonStanding[]>([])
	const [weeklyData, setWeeklyData] = useState<WeeklyPerformanceUser[] | null>(
		null
	)
	const [currentWeek, setCurrentWeek] = useState<number | null>(null)
	const [loadingStats, setLoadingStats] = useState(true)
	const [loadingWeekly, setLoadingWeekly] = useState(true)
	const [checkingOnboarding, setCheckingOnboarding] = useState(true)
	const [season] = useState("2025")

	useEffect(() => {
		if (!loading && !user) {
			router.push("/signin")
		}
	}, [user, loading, router])

	// Check if user has completed onboarding
	useEffect(() => {
		if (user && !loading) {
			const checkOnboarding = async () => {
				try {
					const response = await fetch("/api/users/me")
					const data = await response.json()
					console.log("[Dashboard] /api/users/me response:", {
						success: data.success,
						hasData: !!data.data,
						username: data.data?.username,
						error: data.error,
					})
					if (data.success && data.data) {
						if (!data.data.username) {
							console.log(
								"[Dashboard] User missing username, redirecting to onboarding"
							)
							router.push("/onboarding")
							return
						}
					} else {
						// User doesn't exist in users table, redirect to onboarding
						console.log(
							"[Dashboard] User not found or API error:",
							data.error || "Unknown error"
						)
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
	}, [user, loading, router])

	useEffect(() => {
		if (user) {
			fetchCurrentWeek()
			fetchUserStats()
			fetchWeeklyData()
		}
	}, [user, season])

	const fetchCurrentWeek = async () => {
		try {
			const response = await fetch("/api/season")
			const data = await response.json()
			if (data.success && data.data?.currentWeek) {
				setCurrentWeek(data.data.currentWeek)
			}
		} catch (error) {
			console.error("Error fetching current week:", error)
		}
	}

	const fetchUserStats = async () => {
		try {
			setLoadingStats(true)
			const response = await fetch(`/api/scores?season=${season}&type=season`)
			const data = await response.json()
			if (data.success && data.data) {
				setStandings(data.data)
				// Find the current user's stats
				const userStanding = data.data.find(
					(standing: SeasonStanding) => standing.user_id === user?.id
				)
				setUserStats(userStanding || null)
			}
		} catch (error) {
			console.error("Error fetching user stats:", error)
		} finally {
			setLoadingStats(false)
		}
	}

	const fetchWeeklyData = async () => {
		try {
			setLoadingWeekly(true)
			const response = await fetch(`/api/leaderboard?season=${season}`)
			const data = await response.json()
			if (data.success && data.data?.users) {
				setWeeklyData(data.data.users)
			}
		} catch (error) {
			console.error("Error fetching weekly data:", error)
		} finally {
			setLoadingWeekly(false)
		}
	}

	if (loading || checkingOnboarding) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	if (!user) {
		return null // Will redirect
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					{/* Status Cards - Top Section */}
					{currentWeek !== null && (
						<div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
							<PicksStatusCard currentWeek={currentWeek} season={season} />
							<NextGameCountdown currentWeek={currentWeek} season={season} />
						</div>
					)}

					{/* Charts Section */}
					{weeklyData && currentWeek !== null && weeklyData.length > 0 && (
						<div className="space-y-6 md:space-y-8 mb-6 md:mb-8">
							<CumulativePointsChart
								data={weeklyData}
								currentUserId={user?.id}
								currentWeek={currentWeek}
							/>
							<WeeklyPointsChart
								data={weeklyData}
								currentUserId={user?.id}
								currentWeek={currentWeek}
							/>
						</div>
					)}

					{/* Metrics and Insights Section */}
					<div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
						<UserMetrics
							userStats={userStats}
							weeklyData={weeklyData}
							currentUserId={user?.id}
						/>
						{weeklyData && (
							<PerformanceInsights
								weeklyData={weeklyData}
								currentUserId={user?.id}
							/>
						)}
					</div>

					{/* Leaderboard Preview */}
					{standings.length > 0 && (
						<div className="mb-6 md:mb-8">
							<LeaderboardPreview
								standings={standings}
								currentUserId={user?.id}
							/>
						</div>
					)}

					{/* Quick Links */}
					<div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
						<Link
							href="/picks/current"
							className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow"
						>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									My Picks
								</h3>
								<p className="text-sm text-gray-600">
									Make weekly NFL picks with confidence points
								</p>
							</div>
						</Link>

						<Link
							href="/leaderboard/standings"
							className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow"
						>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Leaderboard
								</h3>
								<p className="text-sm text-gray-600">
									View standings and track your performance
								</p>
							</div>
						</Link>
					</div>

					{/* NFL Data Link - Small at bottom */}
					<div className="text-center pt-4 border-t border-gray-200">
						<Link
							href="/data"
							className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
						>
							Explore NFL Data
						</Link>
					</div>
				</div>
			</main>
		</div>
	)
}
